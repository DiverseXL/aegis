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
      '[AegisStream disclosure test] NOX_HANDLE_GATEWAY_HOST_PORT is not set. ' +
        'The Nox stack must be started before running this test.',
    );
  }
  return `http://127.0.0.1:${port}`;
}

describe('AegisStream — discloseToAuditor', () => {
  it('grants an auditor decrypt access to a frozen snapshot, not the live handle', async () => {
    const { viem } = await nox.connect();
    const publicClient = await viem.getPublicClient();
    const [sender, recipient, auditor] = await viem.getWalletClients();

    // Build a handle client scoped to the auditor's wallet identity, so that
    // decrypt calls use the auditor's address rather than defaulting to account #0.
    const auditorHandleClient = await createViemHandleClient(
      Object.assign(Object.create(auditor), {
        getAddresses: async () => [auditor.account.address],
      }),
      {
        smartContractAddress: NOX_COMPUTE_ADDRESS,
        gatewayUrl: handleGatewayUrl(),
        subgraphUrl: 'https://example.com/subgraphs/id/none',
      },
    );

    const mockUsdc = await viem.deployContract('MockERC20', ['Mock USDC', 'mUSDC', 1_000_000n]);
    const vault = await viem.deployContract('AegisVault', [mockUsdc.address]);
    const guardianPlaceholder = sender.account.address; // reusing sender as guardian for this test
    const stream = await viem.deployContract('AegisStream', [guardianPlaceholder]);

    await mockUsdc.write.approve([vault.address, 1000n]);
    await vault.write.wrap([sender.account.address, 1000n]);

    const farFuture = BigInt(Math.floor(Date.now() / 1000) + 3600);
    await vault.write.setOperator([stream.address, farFuture], { account: sender.account });

    const startTime = Number((await publicClient.getBlock()).timestamp);
    const duration = 1000;
    const { handle, handleProof } = await nox.encryptInput(1000n, 'uint256', stream.address);

    await stream.write.createStream(
      [vault.address, recipient.account.address, handle, handleProof, Number(startTime), duration],
      { account: sender.account }
    );

    // Withdraw half, so withdrawnAmount is nonzero and meaningfully "in progress"
    const testClient = await viem.getTestClient();
    await testClient.increaseTime({ seconds: duration / 2 });
    await testClient.mine({ blocks: 1 });
    await stream.write.withdraw([0n], { account: recipient.account });

    // Compute the expected snapshot value based on actual elapsed time at the
    // withdraw block (since the snapshot captures withdrawnAmount which was set
    // by the withdraw tx). Block timestamp granularity means the elapsed time
    // may differ slightly from the ideal duration/2.
    const withdrawBlock = await publicClient.getBlock({ blockTag: 'latest' });
    const withdrawElapsed = Number(withdrawBlock.timestamp) - startTime;
    const snapshotExpected = 1000n * BigInt(withdrawElapsed) / BigInt(duration);

    // --- Disclose to auditor ---
    await stream.write.discloseToAuditor([0n, auditor.account.address], { account: sender.account });

    // Auditor should be able to decrypt SOME handle now — capture it from the event
    const logs = await publicClient.getContractEvents({
      address: stream.address,
      abi: stream.abi,
      eventName: 'DisclosureGranted',
      fromBlock: 0n,
    });
    assert.equal(logs.length, 1, 'expected exactly one DisclosureGranted event');
    const snapshotHandle = logs[0].args.snapshotHandle as `0x${string}`;

    // Decrypt using the auditor-scoped handle client (not the raw nox.decrypt,
    // which would default to account #0 and fail the ACL check).
    const { value: snapshotValue } = await auditorHandleClient.decrypt(snapshotHandle);
    assert.equal(
      snapshotValue,
      snapshotExpected,
      `snapshot should reflect withdrawn amount at time of disclosure (elapsed=${withdrawElapsed})`
    );

    // --- Critical security check: withdraw MORE after disclosure, then confirm the
    // snapshot handle's value does NOT change (proving it's a frozen copy, not a live view) ---
    await testClient.increaseTime({ seconds: duration / 2 + 10 });
    await testClient.mine({ blocks: 1 });
    await stream.write.withdraw([0n], { account: recipient.account });

    const { value: snapshotValueAfter } = await auditorHandleClient.decrypt(snapshotHandle);
    assert.equal(
      snapshotValueAfter,
      snapshotExpected,
      'snapshot handle must remain frozen at disclosure-time value even after further withdrawals'
    );
  });

  it('rejects disclosure attempts from non-sender addresses', async () => {
    const { viem } = await nox.connect();
    const [sender, recipient, auditor, imposter] = await viem.getWalletClients();

    const mockUsdc = await viem.deployContract('MockERC20', ['Mock USDC', 'mUSDC', 1_000_000n]);
    const vault = await viem.deployContract('AegisVault', [mockUsdc.address]);
    const stream = await viem.deployContract('AegisStream', [sender.account.address]);

    await mockUsdc.write.approve([vault.address, 1000n]);
    await vault.write.wrap([sender.account.address, 1000n]);

    const farFuture = BigInt(Math.floor(Date.now() / 1000) + 3600);
    await vault.write.setOperator([stream.address, farFuture], { account: sender.account });

    const publicClient = await viem.getPublicClient();
    const startTime = Number((await publicClient.getBlock()).timestamp);
    const { handle, handleProof } = await nox.encryptInput(1000n, 'uint256', stream.address);

    await stream.write.createStream(
      [vault.address, recipient.account.address, handle, handleProof, Number(startTime), 1000],
      { account: sender.account }
    );

    await assert.rejects(
      stream.write.discloseToAuditor([0n, auditor.account.address], { account: imposter.account }),
      /AegisStream: only DAO\/sender can disclose/,
      'expected revert when a non-sender address attempts disclosure'
    );
  });
});
