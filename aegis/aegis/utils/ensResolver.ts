// utils/ensResolver.ts
//
// Resolves Ethereum addresses to ENS names for display purposes.
// ENS itself lives on Ethereum mainnet, so this always reads from mainnet
// regardless of which chain the actual Aegis contracts are deployed on
// (Sepolia). This is read-only, no wallet/signing needed.

import { createPublicClient, http, type Address } from 'viem';
import { mainnet } from 'viem/chains';

// A public mainnet RPC is fine here since this is read-only and low-volume —
// ENS lookups don't need your Alchemy/Infura Sepolia key. Using a public
// endpoint avoids consuming your paid RPC quota for a cosmetic feature.
// The explicit URL is used because the default http() transport was found
// to be unreliable in practice (see aegis/aegis/utils/ensResolver.ts:test).
const ensClient = createPublicClient({
  chain: mainnet,
  transport: http('https://ethereum-rpc.publicnode.com'),
});

const cache = new Map<Address, string | null>();

/**
 * Resolves an address to its primary ENS name, if one exists.
 * Returns null if no ENS name is set — callers should fall back to
 * showing the raw address (or a shortened version) in that case.
 */
export async function resolveEnsName(address: Address): Promise<string | null> {
  if (cache.has(address)) {
    return cache.get(address) ?? null;
  }

  try {
    const name = await ensClient.getEnsName({ address });
    cache.set(address, name ?? null);
    return name;
  } catch (err) {
    console.warn(`ENS lookup failed for ${address}:`, err);
    cache.set(address, null); // cache the failure too, avoid retry storms
    return null;
  }
}

/**
 * Convenience formatter: returns the ENS name if available, otherwise a
 * shortened address like "0x0Ec6...ce59" — never the full 42-char hex.
 */
export async function displayNameFor(address: Address): Promise<string> {
  const ensName = await resolveEnsName(address);
  if (ensName) return ensName;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
