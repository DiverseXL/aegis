// scripts/safeCreateStream.ts
//
// Step 3 — Safe approves AegisVault, wraps mUSDC into confidential ERC-7984
// tokens, and sets AegisStream as operator.
//
// Batches three Safe transactions:
//   1. MockERC20.approve(Vault, 1000 tokens) — correct-amount allowance so wrap
//      can transferFrom the Safe's mUSDC.
//   2. AegisVault.wrap(Safe, 1000 tokens) — wraps 1000 mUSDC into confidential
//      tokens credited back to the Safe.
//   3. AegisVault.setOperator(AegisStream, forever) — authorizes AegisStream
//      to pull confidential tokens from the Safe via confidentialTransferFrom.
//
// Requires: SEPOLIA_RPC_URL and DEPLOYER_PRIVATE_KEY in .env

import 'dotenv/config';
import Safe from '@safe-global/protocol-kit';
import { createPublicClient, createWalletClient, http, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

const SAFE_ADDRESS = '0x1c0780faCD4E295439c07FD69104f276de80DFB4';
const VAULT = '0xb9dC5Aebe33f7b1F74971C0F87164eD018f69C66';
const STREAM = '0xd4AC9ef480a60215b0aDe26c85716A0B5A87Ecf1';
const MOCK_USDC = '0x8c54d36d022BA2c9684c2c77e48d3D961B6ef507';

const AMOUNT = 1000n * 10n ** 18n; // 1000 full tokens at 18 decimals
const FOREVER = BigInt(2 ** 48 - 1); // type(uint48).max — never expires

// Minimal ABIs for encoding the batched calls
const MOCK_ERC20_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const;

const VAULT_ABI = [
  {
    type: 'function',
    name: 'wrap',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'setOperator',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'until', type: 'uint48' },
    ],
    outputs: [],
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
  console.log('Deployer:', account.address);

  const safe = await Safe.init({
    provider: rpcUrl,
    signer: deployerPk,
    safeAddress: SAFE_ADDRESS,
  });

  const publicClient = createPublicClient({ chain: sepolia, transport: http(rpcUrl) });

  // Encode the three batched calls (approve → wrap → setOperator)
  const approveVaultData = encodeFunctionData({
    abi: MOCK_ERC20_ABI,
    functionName: 'approve',
    args: [VAULT as `0x${string}`, AMOUNT],
  });

  const wrapData = encodeFunctionData({
    abi: VAULT_ABI,
    functionName: 'wrap',
    args: [SAFE_ADDRESS as `0x${string}`, AMOUNT],
  });

  const setOperatorData = encodeFunctionData({
    abi: VAULT_ABI,
    functionName: 'setOperator',
    args: [STREAM as `0x${string}`, FOREVER],
  });

  console.log('Creating batched Safe transaction (approve → wrap → setOperator)...');
  const safeTx = await safe.createTransaction({
    transactions: [
      { to: MOCK_USDC, value: '0', data: approveVaultData }, // step 1: correct-amount approval
      { to: VAULT, value: '0', data: wrapData },              // step 2: wrap with sufficient allowance
      { to: VAULT, value: '0', data: setOperatorData },       // step 3: authorize stream
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
  console.log('Done — Safe has wrapped tokens and set AegisStream as operator.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
