// scripts/createStream.ts
//
// Step 4 — Safe creates a confidential payment stream via AegisStream.createStream().
//
// Flow:
//   1. Override the HandleClient's getAddress to report the Safe address as the
//      proof owner (the Gateway trusts owner as a self-reported field — see feedback.md §5.3).
//   2. Encrypt 100 tokens as a uint256 handle for AegisStream as the application contract.
//   3. Batch a Safe transaction calling AegisStream.createStream() with the
//      encrypted handle + proof, starting now for a 30-day duration.
//   4. Sign and execute via Safe (same pattern as the wrap/setOperator batch).
//
// Requires: SEPOLIA_RPC_URL and DEPLOYER_PRIVATE_KEY in .env

import 'dotenv/config';
import Safe from '@safe-global/protocol-kit';
import { createWalletClient, createPublicClient, http, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { createViemHandleClient } from '@iexec-nox/handle';

// ──────────────────────────────────────────────────────────────────────────────
// Deployed contract addresses (Ethereum Sepolia)
// ──────────────────────────────────────────────────────────────────────────────
const SAFE_ADDRESS = '0x1c0780faCD4E295439c07FD69104f276de80DFB4';
const VAULT = '0xb9dC5Aebe33f7b1F74971C0F87164eD018f69C66';
const STREAM = '0xd4AC9ef480a60215b0aDe26c85716A0B5A87Ecf1';

// ──────────────────────────────────────────────────────────────────────────────
// Stream parameters
// ──────────────────────────────────────────────────────────────────────────────
const AMOUNT = 100n * 10n ** 18n;       // 100 tokens at 18 decimals
const DURATION = 30n * 24n * 60n * 60n; // 30 days in seconds

// ──────────────────────────────────────────────────────────────────────────────
// Minimal ABI for encoding createStream()
// externalEuint256 is defined as `type externalEuint256 is bytes32;` in
// encrypted-types/EncryptedTypes.sol, so it ABi-encodes as bytes32.
// ──────────────────────────────────────────────────────────────────────────────
const STREAM_ABI = [
  {
    type: 'function',
    name: 'createStream',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'encryptedTotalAmount', type: 'bytes32' },
      { name: 'inputProof', type: 'bytes' },
      { name: 'startTime', type: 'uint40' },
      { name: 'duration', type: 'uint40' },
    ],
    outputs: [{ name: 'streamId', type: 'uint256' }],
  },
] as const;

async function main() {
  const deployerPk = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
  const rpcUrl = process.env.SEPOLIA_RPC_URL!;

  if (!deployerPk || !rpcUrl) {
    console.error('Missing DEPLOYER_PRIVATE_KEY or SEPOLIA_RPC_URL in .env');
    process.exit(1);
  }

  const account = privateKeyToAccount(deployerPk);

  // The recipient is the deployer EOA — different from the Safe (sender), which
  // satisfies AegisStream's require(recipient != msg.sender) check.
  const recipient = account.address;

  console.log('Deployer (stream recipient):', recipient);
  console.log('Safe (stream sender):', SAFE_ADDRESS);

  // ────────────────────────────────────────────────────────────────────────────
  // Step 1 — Encrypt 100 tokens with the Safe address as proof owner
  // ────────────────────────────────────────────────────────────────────────────

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(rpcUrl),
  });

  // Override getAddresses so the Handle Gateway embeds SAFE_ADDRESS as the
  // proof owner. The Gateway trusts `owner` as a self-reported field — security
  // is enforced on-chain later (ownerInProof == msg.sender in Compute.sol's
  // validateInputProof). The EOA's private key is still used for signing
  // gateway attestation verification (via verifyTypedData), which only checks
  // the gateway's identity, not the owner address.
  //
  // See feedback.md §5.3 for the full investigation.
  (walletClient as any).getAddresses = async () => [SAFE_ADDRESS as `0x${string}`];

  const handleClient = await createViemHandleClient(walletClient);

  console.log('\nEncrypting 100 tokens for AegisStream (owner = Safe)...');
  const { handle, handleProof } = await handleClient.encryptInput(
    AMOUNT,
    'uint256',
    STREAM as `0x${string}`,
  );
  console.log('Encrypted handle:', handle);
  console.log('Proof snippet:', (handleProof as string).slice(0, 66) + '...');

  // ────────────────────────────────────────────────────────────────────────────
  // Step 2 — Build and execute the Safe transaction
  // ────────────────────────────────────────────────────────────────────────────

  const safe = await Safe.init({
    provider: rpcUrl,
    signer: deployerPk,
    safeAddress: SAFE_ADDRESS,
  });

  const publicClient = createPublicClient({ chain: sepolia, transport: http(rpcUrl) });

  const startTime = Math.floor(Date.now() / 1000); // start streaming immediately

  const createStreamData = encodeFunctionData({
    abi: STREAM_ABI,
    functionName: 'createStream',
    args: [
      VAULT as `0x${string}`,
      recipient as `0x${string}`,
      handle as `0x${string}`,
      handleProof as `0x${string}`,
      startTime,
      Number(DURATION),
    ],
  });

  console.log('\nCreating Safe transaction (createStream)...');
  const safeTx = await safe.createTransaction({
    transactions: [
      { to: STREAM, value: '0', data: createStreamData },
    ],
  });

  console.log('Signing Safe transaction...');
  const signedSafeTx = await safe.signTransaction(safeTx);

  console.log('Executing Safe transaction...');
  const execResult = await safe.executeTransaction(signedSafeTx);
  console.log('Executed. Hash:', execResult.hash);

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: execResult.hash as `0x${string}`,
  });
  console.log('Confirmed in block:', receipt.blockNumber.toString());
  console.log('Tx hash:', receipt.transactionHash);

  // Extract streamId from StreamCreated event emitted by AegisStream.createStream()
  // (Safe's execTransaction wraps the inner call, so streamId isn't a direct return value)
  const streamCreatedLogs = await publicClient.getContractEvents({
    address: STREAM as `0x${string}`,
    abi: [{
      type: 'event',
      name: 'StreamCreated',
      inputs: [
        { name: 'streamId', type: 'uint256', indexed: true },
        { name: 'sender', type: 'address', indexed: true },
        { name: 'recipient', type: 'address', indexed: true },
        { name: 'asset', type: 'address', indexed: false },
      ],
    }],
    fromBlock: receipt.blockNumber,
    toBlock: receipt.blockNumber,
  });
  console.log('StreamCreated event:', streamCreatedLogs);

  if (streamCreatedLogs.length > 0) {
    const streamId = streamCreatedLogs[0].args.streamId;
    console.log('Stream ID:', streamId);
  }

  console.log('Done — stream created successfully.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
