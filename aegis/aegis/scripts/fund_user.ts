import hre from 'hardhat';
import { parseEther, formatEther } from 'viem';

async function main() {
  const targetAddress = "0xE90a6DFA3b182efCfe969c83C6815b4D0D2E9Bb0";
  const connection = await hre.network.getOrCreate();
  const { viem } = connection;
  const publicClient = await viem.getPublicClient();
  const [deployer] = await viem.getWalletClients();

  console.log("Funding target:", targetAddress, "from deployer:", deployer.account.address);

  // Send 0.02 SepoliaETH (Deployer has 0.0269 ETH)
  const ethTxHash = await deployer.sendTransaction({
    to: targetAddress as `0x${string}`,
    value: parseEther("0.02"),
  });
  console.log("Sent 0.02 SepoliaETH. Waiting for receipt...");
  await publicClient.waitForTransactionReceipt({ hash: ethTxHash });
  console.log("ETH Tx confirmed:", ethTxHash);

  // Send 10,000 mUSDC (MockERC20)
  const mockUsdcAddress = "0x8c54d36d022BA2c9684c2c77e48d3D961B6ef507";
  const mockUsdcAbi = [
    { type: 'function', name: 'transfer', stateMutability: 'nonpayable',
      inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
      outputs: [{ type: 'bool' }] },
    { type: 'function', name: 'balanceOf', stateMutability: 'view',
      inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] }
  ] as const;

  const usdcTxHash = await deployer.writeContract({
    address: mockUsdcAddress as `0x${string}`,
    abi: mockUsdcAbi,
    functionName: 'transfer',
    args: [targetAddress as `0x${string}`, parseEther("10000")],
  });
  console.log("Sent 10,000 mUSDC. Waiting for receipt...");
  await publicClient.waitForTransactionReceipt({ hash: usdcTxHash });
  console.log("USDC Tx confirmed:", usdcTxHash);

  const balEth = await publicClient.getBalance({ address: targetAddress as `0x${string}` });
  const balUsdc = await publicClient.readContract({
    address: mockUsdcAddress as `0x${string}`,
    abi: mockUsdcAbi,
    functionName: 'balanceOf',
    args: [targetAddress as `0x${string}`],
  });

  console.log("Target updated ETH balance:", formatEther(balEth));
  console.log("Target updated mUSDC balance:", formatEther(balUsdc));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
