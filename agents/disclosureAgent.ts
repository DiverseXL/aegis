// agents/disclosureAgent.ts
//
// Aegis Disclosure Agent — manages auditor access grants for AegisStream.
// Nox ACL grants are permanent (no revoke), so this agent implements
// time-boxed disclosure via the snapshot pattern: each disclosure creates
// a frozen copy of the current withdrawn amount and grants the auditor
// viewer access ONLY on that snapshot — never on the live, changing handle.
//
// The public DisclosureGranted event log is itself the accountability mechanism:
// who was granted access to what stream, and when, is visible on-chain to anyone.

import { createPublicClient, createWalletClient, http, parseAbiItem, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

export interface DisclosureRecord {
  streamId: bigint;
  auditor: Address;
  snapshotHandle: `0x${string}`;
  timestamp: number;
  requestedBy: Address; // msg.sender at disclosure time — emitted by the contract as address indexed requestedBy
}

const DISCLOSURE_ABI = [
  {
    type: 'function',
    name: 'discloseToAuditor',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'streamId', type: 'uint256' },
      { name: 'auditor', type: 'address' },
    ],
    outputs: [{ name: 'snapshotHandle', type: 'bytes32' }],
  },
] as const;

const DISCLOSURE_EVENT = parseAbiItem(
  'event DisclosureGranted(uint256 indexed streamId, address indexed auditor, address indexed requestedBy, bytes32 snapshotHandle, uint256 timestamp)'
);

export class DisclosureAgent {
  private log: DisclosureRecord[] = [];

  constructor(
    private readonly streamContractAddress: Address,
    private readonly publicClient: ReturnType<typeof createPublicClient>,
    private readonly walletClient: ReturnType<typeof createWalletClient>
  ) {}

  /** Full public audit trail of every disclosure ever granted — who saw what, when. */
  getDisclosureLog(): readonly DisclosureRecord[] {
    return this.log;
  }

  /**
   * Grants an auditor access to a frozen snapshot of a stream's current
   * withdrawn amount. Only callable by the DAO/stream sender on-chain
   * (enforced in the contract itself via require(msg.sender == s.sender)).
   *
   * Returns the transaction hash of the disclosure tx.
   */
  async discloseToAuditor(streamId: bigint, auditor: Address): Promise<`0x${string}`> {
    const txHash = await this.walletClient.writeContract({
      address: this.streamContractAddress,
      abi: DISCLOSURE_ABI,
      functionName: 'discloseToAuditor',
      args: [streamId, auditor],
      chain: undefined,
      account: this.walletClient.account!,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    return receipt.transactionHash;
  }

  /** Starts watching DisclosureGranted events to build the in-memory public log.
   *  Returns an unwatch function. In production, persist log entries to durable storage.
   */
  watch(): () => void {
    return this.publicClient.watchEvent({
      address: this.streamContractAddress,
      event: DISCLOSURE_EVENT,
      onLogs: (logs) => {
        for (const log of logs) {
          const { streamId, auditor, requestedBy, snapshotHandle, timestamp } = log.args as {
            streamId: bigint;
            auditor: Address;
            requestedBy: Address;
            snapshotHandle: `0x${string}`;
            timestamp: bigint;
          };
          this.log.push({
            streamId,
            auditor,
            snapshotHandle,
            timestamp: Number(timestamp),
            requestedBy,
          });
          console.log(`[Disclosure] ${requestedBy} granted auditor ${auditor} snapshot access on stream ${streamId}`);
        }
      },
    });
  }
}

export async function startDisclosureAgent(config: {
  rpcUrl: string;
  streamContractAddress: Address;
  daoPrivateKey: `0x${string}`;
}): Promise<DisclosureAgent> {
  const publicClient = createPublicClient({ transport: http(config.rpcUrl) });
  const walletClient = createWalletClient({
    account: privateKeyToAccount(config.daoPrivateKey),
    transport: http(config.rpcUrl),
  });

  const agent = new DisclosureAgent(config.streamContractAddress, publicClient, walletClient);
  agent.watch();
  return agent;
}
