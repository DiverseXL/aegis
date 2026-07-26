// scripts/topUpSafe.ts
//
// Sends a correctly-scaled amount of MockERC20 (1000 full tokens at 18 decimals)
// to the Safe, fixing the earlier negligible transfer (1000 raw units).
//
// Requires: SEPOLIA_RPC_URL and DEPLOYER_PRIVATE_KEY in .env

import 'dotenv/config';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

const SAFE_ADDRESS = '0x1c0780faCD4E295439c07FD69104f276de80DFB4';
const MOCK_USDC = '0x8c54d36d022BA2c9684c2c77e48d3D961B6ef507';

const MOCK_ERC20_ABI = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
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
  const publicClient = createPublicClient({ chain: sepolia, transport: http(rpcUrl) });
  const walletClient = createWalletClient({ account, chain: sepolia, transport: http(rpcUrl) });

  const AMOUNT = 1000n * 10n ** 18n; // 1000 tokens, correctly accounting for 18 decimals

  console.log('Topping up the Safe with correctly-sized amount...');
  const tx = await walletClient.writeContract({
    address: MOCK_USDC,
    abi: MOCK_ERC20_ABI,
    functionName: 'transfer',
    args: [SAFE_ADDRESS as `0x${string}`, AMOUNT],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
  console.log('Top-up tx:', receipt.transactionHash);
}

main().catch(console.error);
