// agents/payoutGuardian.ts
//
// Aegis Payout Guardian — off-chain watchdog for AegisStream.
// Watches StreamCreated events and flags:
//   1. Amount anomalies (requires decrypt access, granted via Nox.addViewer
//      in AegisStream.createStream() to this agent's configured address)
//   2. Rate anomalies (public on-chain data, no decryption needed)
//
// This agent only DECRYPTS and LOGS — it does not have on-chain authority
// to block or reverse a stream. Enforcement action (e.g. pausing a stream)
// is a separate, deliberate design decision for a future iteration — see
// README "Status" section.

import { createPublicClient, http, parseAbiItem, type Address, type Hash } from 'viem';
import { createViemHandleClient } from '@iexec-nox/handle';

export interface PolicyConfig {
  maxAmountPerStream: bigint;
  maxStreamsPerWindow: number;
  windowSeconds: number;
}

export const DEFAULT_POLICY: PolicyConfig = {
  maxAmountPerStream: 50_000n,
  maxStreamsPerWindow: 5,
  windowSeconds: 3600,
};

export interface FlagEvent {
  streamId: bigint;
  sender: Address;
  recipient: Address;
  reason: 'amount' | 'rate';
  detail: string;
  timestamp: number;
}

const STREAM_CREATED_EVENT = parseAbiItem(
  'event StreamCreated(uint256 indexed streamId, address indexed sender, address indexed recipient, address asset)'
);

// AegisStream ABI fragment needed for reading back the amount handle
const STREAM_ABI = [
  {
    type: 'function',
    name: 'getStreamTotalAmount',
    stateMutability: 'view',
    inputs: [{ name: 'streamId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bytes32' }],
  },
] as const;

export class PayoutGuardian {
  private recentStreamsBySender = new Map<Address, number[]>();
  private flags: FlagEvent[] = [];

  constructor(
    private readonly policy: PolicyConfig,
    private readonly streamContractAddress: Address,
    private readonly publicClient: ReturnType<typeof createPublicClient>,
    private readonly handleClient: ReturnType<typeof createViemHandleClient>
  ) {}

  /** Public read-only log of everything flagged so far — for the dashboard. */
  getFlags(): readonly FlagEvent[] {
    return this.flags;
  }

  private checkRateAnomaly(sender: Address): { flagged: boolean; count: number } {
    const now = Date.now() / 1000;
    const timestamps = (this.recentStreamsBySender.get(sender) ?? [])
      .filter((t) => now - t < this.policy.windowSeconds);
    timestamps.push(now);
    this.recentStreamsBySender.set(sender, timestamps);
    return { flagged: timestamps.length > this.policy.maxStreamsPerWindow, count: timestamps.length };
  }

  private async checkAmountAnomaly(streamId: bigint): Promise<{ flagged: boolean; amount: bigint }> {
    const handle = (await this.publicClient.readContract({
      address: this.streamContractAddress,
      abi: STREAM_ABI,
      functionName: 'getStreamTotalAmount',
      args: [streamId],
    })) as `0x${string}`;

    const { value } = await this.handleClient.decrypt(handle);
    const amount = BigInt(value as string | number | bigint);
    // maxAmountPerStream === 0n is the sentinel for "no limit stated" —
    // skip the check rather than flagging every stream as exceeding a zero threshold.
    if (this.policy.maxAmountPerStream === 0n) {
      return { flagged: false, amount };
    }
    return { flagged: amount > this.policy.maxAmountPerStream, amount };
  }

  private record(flag: Omit<FlagEvent, 'timestamp'>) {
    const entry: FlagEvent = { ...flag, timestamp: Date.now() };
    this.flags.push(entry);
    console.log(`[Guardian] FLAGGED (${entry.reason}): stream ${entry.streamId} — ${entry.detail}`);
  }

  /** Starts watching StreamCreated events. Returns an unwatch function. */
  watch(): () => void {
    return this.publicClient.watchEvent({
      address: this.streamContractAddress,
      event: STREAM_CREATED_EVENT,
      onLogs: async (logs) => {
        for (const log of logs) {
          const { streamId, sender, recipient } = log.args as {
            streamId: bigint;
            sender: Address;
            recipient: Address;
          };

          const rate = this.checkRateAnomaly(sender);
          if (rate.flagged) {
            this.record({
              streamId,
              sender,
              recipient,
              reason: 'rate',
              detail: `${rate.count} streams from ${sender} within ${this.policy.windowSeconds}s (limit ${this.policy.maxStreamsPerWindow})`,
            });
          }

          try {
            const { flagged, amount } = await this.checkAmountAnomaly(streamId);
            if (flagged) {
              this.record({
                streamId,
                sender,
                recipient,
                reason: 'amount',
                detail: `amount ${amount} exceeds threshold ${this.policy.maxAmountPerStream}`,
              });
            }
          } catch (err) {
            // Decrypt can fail if this agent's address wasn't granted viewer
            // access (e.g. payoutGuardian wasn't set on this stream's contract
            // instance) — log but don't crash the watcher.
            console.error(`[Guardian] Could not decrypt amount for stream ${streamId}:`, err);
          }
        }
      },
    });
  }
}

import { createWalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

export async function startPayoutGuardian(config: {
  rpcUrl: string;
  streamContractAddress: Address;
  guardianPrivateKey: `0x${string}`;
  noxComputeAddress: Address;
  gatewayUrl: string;
  policy?: PolicyConfig;
}) {
  const publicClient = createPublicClient({ transport: http(config.rpcUrl) });
  const walletClient = createWalletClient({
    account: privateKeyToAccount(config.guardianPrivateKey),
    transport: http(config.rpcUrl),
  });

  // createViemHandleClient resolves as a Promise, and HandleClientConfig requires
  // subgraphUrl even if it is not used in private decryption methods.
  // Using official Ethereum Sepolia Indexer subgraph discovered via Graph Explorer.
  const handleClient = await createViemHandleClient(walletClient, {
    smartContractAddress: config.noxComputeAddress,
    gatewayUrl: config.gatewayUrl,
    subgraphUrl: 'https://api.thegraph.com/subgraphs/id/9CsccKwvgYFo72zZeU4k4wj2NEBLdWhVE3EUandgmzgo',
  });

  const guardian = new PayoutGuardian(
    config.policy ?? DEFAULT_POLICY,
    config.streamContractAddress,
    publicClient,
    handleClient
  );

  guardian.watch();
  return guardian;
}
