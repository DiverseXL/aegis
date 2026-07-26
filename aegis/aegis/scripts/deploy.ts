import hre from 'hardhat';
import { parseEther } from 'viem';

async function main() {
  const connection = await hre.network.getOrCreate();
  const { viem } = connection;
  const publicClient = await viem.getPublicClient();
  const [deployer] = await viem.getWalletClients();

  console.log('Deploying from:', deployer.account.address);
  const balance = await publicClient.getBalance({ address: deployer.account.address });
  console.log('Deployer balance:', balance.toString(), 'wei');

  // --- Deploy MockERC20 (stand-in for a real treasury token on testnet) ---
  const mockUsdc = await viem.deployContract('MockERC20', ['Aegis Mock USDC', 'mUSDC', 1_000_000n * 10n ** 18n]);
  console.log('MockERC20 deployed at:', mockUsdc.address);

  // --- Deploy AegisVault, wrapping the mock treasury token ---
  const vault = await viem.deployContract('AegisVault', [mockUsdc.address]);
  console.log('AegisVault deployed at:', vault.address);

  // --- Deploy AegisStream, with the deployer as the initial payoutGuardian ---
  const stream = await viem.deployContract('AegisStream', [deployer.account.address]);
  console.log('AegisStream deployed at:', stream.address);

  console.log('\n--- Deployment Summary ---');
  console.log('MockERC20:', mockUsdc.address);
  console.log('AegisVault:', vault.address);
  console.log('AegisStream:', stream.address);
  console.log('Deployer / Guardian:', deployer.account.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
