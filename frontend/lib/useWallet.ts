'use client';

import { useState, useCallback, useEffect } from 'react';
import { createWalletClient, createPublicClient, custom, http, type Address } from 'viem';
import { sepolia } from 'viem/chains';

export function useWallet() {
  const [address, setAddress] = useState<Address | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      setError('No wallet found — install MetaMask.');
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const walletClient = createWalletClient({
        chain: sepolia,
        transport: custom((window as any).ethereum),
      });
      const [addr] = await walletClient.requestAddresses();

      // Ensure we're on Sepolia — prompt a switch if not
      const chainId = await walletClient.getChainId();
      if (chainId !== sepolia.id) {
        await walletClient.switchChain({ id: sepolia.id });
      }

      setAddress(addr);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  // Auto-detect connected account and listen for accountsChanged events
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const walletClient = createWalletClient({
            chain: sepolia,
            transport: custom((window as any).ethereum),
          });
          const accounts = await walletClient.getAddresses();
          if (accounts.length > 0) {
            setAddress(accounts[0]);
          }
        } catch (err) {
          console.error('Error checking wallet connection on mount:', err);
        }
      }
    };

    checkConnection();

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const handleAccounts = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0] as Address);
        } else {
          setAddress(null);
        }
      };

      (window as any).ethereum.on('accountsChanged', handleAccounts);

      return () => {
        if ((window as any).ethereum.removeListener) {
          (window as any).ethereum.removeListener('accountsChanged', handleAccounts);
        }
      };
    }
  }, []);

  return { address, connecting, error, connect, disconnect };
}

export function getPublicClient() {
  return createPublicClient({ chain: sepolia, transport: http() });
}

export function getWalletClient() {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('No wallet found');
  }
  return createWalletClient({ chain: sepolia, transport: custom((window as any).ethereum) });
}

