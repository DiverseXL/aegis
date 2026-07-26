import { getPublicClient } from './useWallet';
import { CONTRACTS, STREAM_ABI } from './contracts';

export interface StreamSummary {
  id: bigint;
  sender: `0x${string}`;
  recipient: `0x${string}`;
  asset: `0x${string}`;
  startTime: bigint;
  duration: bigint;
}

export async function fetchAllStreams(): Promise<StreamSummary[]> {
  const publicClient = getPublicClient();

  const nextId = (await publicClient.readContract({
    address: CONTRACTS.stream as `0x${string}`,
    abi: STREAM_ABI,
    functionName: 'nextStreamId',
  })) as bigint;

  const streams: StreamSummary[] = [];
  for (let i = 0n; i < nextId; i++) {
    const raw = (await publicClient.readContract({
      address: CONTRACTS.stream as `0x${string}`,
      abi: STREAM_ABI,
      functionName: 'streams',
      args: [i],
    })) as [`0x${string}`, `0x${string}`, `0x${string}`, `0x${string}`, `0x${string}`, number, number];

    // struct order: sender, recipient, asset, totalAmount(handle), withdrawnAmount(handle), startTime, duration
    streams.push({
      id: i,
      sender: raw[0],
      recipient: raw[1],
      asset: raw[2],
      startTime: BigInt(raw[5]),
      duration: BigInt(raw[6]),
    });
  }
  return streams;
}
