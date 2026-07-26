import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { createViemHandleClient } from '@iexec-nox/handle';
import { nox } from '@iexec-nox/nox-hardhat-plugin';

// NoxCompute address for the Hardhat local chain (31337) — same constant used
// by the nox-hardhat-plugin internally and in Nox.noxComputeContract().
const NOX_COMPUTE_ADDRESS = '0x75C6AF4430cc474b1bb9b8540b7E46D6f8e1C685';

function handleGatewayUrl(): string {
  const port = Number(process.env.NOX_HANDLE_GATEWAY_HOST_PORT);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(
      '[AegisStream test] NOX_HANDLE_GATEWAY_HOST_PORT is not set. ' +
        'The Nox stack must be started before running this test.',
    );
  }
  return `http://127.0.0.1:${port}`;
}

describe('AegisStream', () => {
  it('vests linearly and pays out the correct amount at 50% and 100% duration', async () => {
    const { viem } = await nox.connect();
    const publicClient = await viem.getPublicClient();
    const testClient = await viem.getTestClient();
    const [sender, recipient] = await viem.getWalletClients();

    // Create a handle client bound to the recipient's wallet.
    //
    // WalletClientAdapter.getAddress() calls walletClient.getAddresses()
    // and takes [0], which for JSON-RPC accounts always returns the node's
    // first account (account #0) regardless of which Hardhat wallet client
    // is passed. We work around this by overriding getAddresses on the
    // recipient's wallet client to return only the recipient's address,
    // while keeping all other methods (signTypedData, etc.) intact.
    const recipientAddress = recipient.account.address;
    const recipientHandleClient = await createViemHandleClient(
      Object.assign(Object.create(recipient), {
        getAddresses: async () => [recipientAddress],
      }),
      {
        smartContractAddress: NOX_COMPUTE_ADDRESS,
        gatewayUrl: handleGatewayUrl(),
        subgraphUrl: 'https://example.com/subgraphs/id/none',
      },
    );

    // --- Setup: mock treasury token -> AegisVault confidential wrapper ---
    const mockUsdc = await viem.deployContract('MockERC20', ['Mock USDC', 'mUSDC', 1_000_000n]);
    const vault = await viem.deployContract('AegisVault', [mockUsdc.address]);
    const stream = await viem.deployContract('AegisStream', [sender.account.address]);

    // Wrap 1000 units into the confidential vault token, held by sender
    await mockUsdc.write.approve([vault.address, 1000n]);
    await vault.write.wrap([sender.account.address, 1000n]);

    // Sender must set AegisStream as an ERC-7984 operator before it can pull funds
    const farFuture = BigInt(Math.floor(Date.now() / 1000) + 3600);
    await vault.write.setOperator([stream.address, farFuture], { account: sender.account });

    // --- Create a 1000-unit stream over a 1000-second duration ---
    const startTime = Number((await publicClient.getBlock()).timestamp);
    const duration = 1000;

    const { handle, handleProof } = await nox.encryptInput(1000n, 'uint256', stream.address);

    await stream.write.createStream(
      [vault.address, recipient.account.address, handle, handleProof, startTime, duration],
      { account: sender.account }
    );

    // --- Fast-forward to ~50% of duration and withdraw ---
    await testClient.increaseTime({ seconds: duration / 2 });
    await testClient.mine({ blocks: 1 });

    await stream.write.withdraw([0n], { account: recipient.account });

    // Compute the expected vested amount based on the actual elapsed time.
    // The stream's startTime was captured before the createStream tx, so the
    // real elapsed may differ slightly from the ideal duration/2.
    const halfwayBlock = await publicClient.getBlock({ blockTag: 'latest' });
    const halfwayElapsed = Number(halfwayBlock.timestamp) - startTime;
    const halfwayExpected = 1000n * BigInt(halfwayElapsed) / BigInt(duration);

    const halfwayHandle = (await vault.read.confidentialBalanceOf([recipient.account.address])) as `0x${string}`;
    const { value: halfwayValue } = await recipientHandleClient.decrypt(halfwayHandle);
    assert.equal(halfwayValue, halfwayExpected, `expected ~50% vested at halfway point (elapsed=${halfwayElapsed})`);

    // --- Fast-forward past full duration and withdraw the remainder ---
    await testClient.increaseTime({ seconds: duration / 2 + 10 }); // past end
    await testClient.mine({ blocks: 1 });

    await stream.write.withdraw([0n], { account: recipient.account });

    // At or past full duration, the remaining balance should equal totalAmount.
    const finalBlock = await publicClient.getBlock({ blockTag: 'latest' });
    const finalElapsed = Math.min(Number(finalBlock.timestamp) - startTime, duration);
    const finalExpected = 1000n * BigInt(finalElapsed) / BigInt(duration);

    const finalHandle = (await vault.read.confidentialBalanceOf([recipient.account.address])) as `0x${string}`;
    const { value: finalValue } = await recipientHandleClient.decrypt(finalHandle);
    assert.equal(finalValue, finalExpected, 'expected full amount vested after duration ends');
  });
});
