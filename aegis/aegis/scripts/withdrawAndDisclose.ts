// scripts/withdrawAndDisclose.ts
//
// Completes the demo flow started in createStream.ts:
//   1. Recipient (deployer EOA) withdraws the vested portion of stream #0
//   2. Safe discloses a snapshot of the withdrawn amount to an auditor
//   3. Auditor decrypts the snapshot to confirm selective disclosure works
//
// Requires: SEPOLIA_RPC_URL and DEPLOYER_PRIVATE_KEY in .env

import 'dotenv/config';
import Safe from '@safe-global/protocol-kit';
import { createWalletClient, createPublicClient, http, encodeFunctionData } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { createViemHandleClient } from '@iexec-nox/handle';

const SAFE_ADDRESS = '0x1c0780faCD4E295439c07FD69104f276de80DFB4';
const STREAM = '0xd4AC9ef480a60215b0aDe26c85716A0B5A87Ecf1' as `0x${string}`;
const STREAM_ID = 0n;

const STREAM_ABI = [
    {
        type: 'function', name: 'withdraw', stateMutability: 'nonpayable',
        inputs: [{ name: 'streamId', type: 'uint256' }], outputs: []
    },
    {
        type: 'function', name: 'discloseToAuditor', stateMutability: 'nonpayable',
        inputs: [{ name: 'streamId', type: 'uint256' }, { name: 'auditor', type: 'address' }],
        outputs: [{ name: 'snapshotHandle', type: 'bytes32' }]
    },
    {
        type: 'function', name: 'getStreamTotalAmount', stateMutability: 'view',
        inputs: [{ name: 'streamId', type: 'uint256' }], outputs: [{ type: 'bytes32' }]
    },
] as const;

async function main() {
    const deployerPk = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
    const rpcUrl = process.env.SEPOLIA_RPC_URL!;
    const account = privateKeyToAccount(deployerPk); // this is the recipient too

    const publicClient = createPublicClient({ chain: sepolia, transport: http(rpcUrl) });
    const recipientWalletClient = createWalletClient({ account, chain: sepolia, transport: http(rpcUrl) });

    // --- Step 1: Recipient withdraws ---
    console.log('Recipient withdrawing from stream', STREAM_ID.toString(), '...');
    const withdrawTx = await recipientWalletClient.writeContract({
        address: STREAM,
        abi: STREAM_ABI,
        functionName: 'withdraw',
        args: [STREAM_ID],
    });
    const withdrawReceipt = await publicClient.waitForTransactionReceipt({ hash: withdrawTx });
    console.log('Withdraw tx:', withdrawReceipt.transactionHash, '— block', withdrawReceipt.blockNumber.toString());

    // --- Step 2: generate a throwaway "auditor" identity for the demo ---
    const auditorPk = generatePrivateKey();
    const auditorAccount = privateKeyToAccount(auditorPk);
    console.log('Demo auditor address:', auditorAccount.address);

    // --- Step 3: Safe discloses a snapshot to the auditor ---
    const safe = await Safe.init({ provider: rpcUrl, signer: deployerPk, safeAddress: SAFE_ADDRESS });

    const discloseData = encodeFunctionData({
        abi: STREAM_ABI,
        functionName: 'discloseToAuditor',
        args: [STREAM_ID, auditorAccount.address],
    });

    const safeTx = await safe.createTransaction({
        transactions: [{ to: STREAM, value: '0', data: discloseData }],
    });
    const signedSafeTx = await safe.signTransaction(safeTx);
    const execResult = await safe.executeTransaction(signedSafeTx);
    const discloseReceipt = await publicClient.waitForTransactionReceipt({ hash: execResult.hash as `0x${string}` });
    console.log('Disclose tx:', discloseReceipt.transactionHash, '— block', discloseReceipt.blockNumber.toString());

    // Pull the snapshot handle from the DisclosureGranted event
    const disclosureLogs = await publicClient.getContractEvents({
        address: STREAM,
        abi: [{
            type: 'event', name: 'DisclosureGranted', inputs: [
                { name: 'streamId', type: 'uint256', indexed: true },
                { name: 'auditor', type: 'address', indexed: true },
                { name: 'requestedBy', type: 'address', indexed: true },
                { name: 'snapshotHandle', type: 'bytes32', indexed: false },
                { name: 'timestamp', type: 'uint256', indexed: false },
            ]
        }],
        fromBlock: discloseReceipt.blockNumber,
        toBlock: discloseReceipt.blockNumber,
    });
    const snapshotHandle = disclosureLogs[0]?.args.snapshotHandle as `0x${string}`;
    console.log('Snapshot handle:', snapshotHandle);

    // --- Step 4: Auditor decrypts the snapshot ---
    const auditorWalletClient = createWalletClient({ account: auditorAccount, chain: sepolia, transport: http(rpcUrl) });
    const auditorHandleClient = await createViemHandleClient(auditorWalletClient);

    const { value } = await auditorHandleClient.decrypt(snapshotHandle);
    console.log('Auditor decrypted withdrawn amount:', value.toString());
}

main().catch((error) => { console.error(error); process.exitCode = 1; });