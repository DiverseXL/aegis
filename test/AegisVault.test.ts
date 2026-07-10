import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { nox } from '@iexec-nox/nox-hardhat-plugin';

describe('AegisVault', () => {
  it('wraps ERC-20 into a confidential balance', async () => {
    const { viem } = await nox.connect();

    const mockUsdc = await viem.deployContract('MockERC20', ['Mock USDC', 'mUSDC', 1_000_000n]);
    const vault = await viem.deployContract('AegisVault', [mockUsdc.address]);

    const [wallet] = await viem.getWalletClients();
    const recipient = wallet.account.address;

    await mockUsdc.write.approve([vault.address, 100n]);
    await vault.write.wrap([recipient, 100n]);

    // Read the encrypted balance handle back
    const handle = (await vault.read.confidentialBalanceOf([recipient])) as `0x${string}`;

    // Decrypt it via the Nox stack and assert on the cleartext value
    const { value } = await nox.decrypt(handle);
    assert.equal(value, 100n);
  });
});
