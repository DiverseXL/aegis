// scripts/deploySafe.ts
//
// Deploys a real Gnosis Safe on Ethereum Sepolia, using it as a stand-in
// for "the DAO's multisig treasury" — demonstrates that AegisStream's
// `sender` field can genuinely be a Safe address, not just an EOA.
//
// Requires: SEPOLIA_RPC_URL and DEPLOYER_PRIVATE_KEY in .env

import 'dotenv/config';
import Safe from '@safe-global/protocol-kit';
import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

async function main() {
  const deployerPk = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
  const rpcUrl = process.env.SEPOLIA_RPC_URL!;

  if (!deployerPk || !rpcUrl) {
    console.error('Missing DEPLOYER_PRIVATE_KEY or SEPOLIA_RPC_URL in .env');
    process.exit(1);
  }

  const account = privateKeyToAccount(deployerPk);
  console.log('Deployer:', account.address);

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });
  const balance = await publicClient.getBalance({ address: account.address });
  console.log('Balance:', balance.toString(), 'wei');

  // --- Initialize Safe SDK with predicted config (Safe not yet deployed) ---
  console.log('Initializing Safe SDK...');
  const safe = await Safe.init({
    provider: rpcUrl,
    signer: deployerPk,
    predictedSafe: {
      safeAccountConfig: {
        owners: [account.address],
        threshold: 1, // 1-of-1 for demo; real DAOs would use e.g. 3-of-5
      },
    },
  });

  const predictedAddress = await safe.getAddress();
  console.log('Predicted Safe address:', predictedAddress);

  // --- Create and broadcast the deployment transaction ---
  console.log('Creating deployment transaction...');
  const deploymentTx = await safe.createSafeDeploymentTransaction();

  console.log('Deployment tx details:', {
    to: deploymentTx.to,
    value: deploymentTx.value,
    data: deploymentTx.data.slice(0, 66) + '...', // log only the first chunk
  });

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(rpcUrl),
  });

  console.log('Broadcasting deployment tx...');
  const txHash = await walletClient.sendTransaction({
    to: deploymentTx.to as `0x${string}`,
    value: BigInt(deploymentTx.value),
    data: deploymentTx.data as `0x${string}`,
  });
  console.log('Tx hash:', txHash);

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  console.log('Confirmed in block:', receipt.blockNumber);
  console.log('Safe deployed at:', predictedAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
