'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createWalletClient, createPublicClient, custom, http, type Address } from 'viem';
import { sepolia } from 'viem/chains';

interface WalletContextValue {
  address: Address | null;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
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
      localStorage.removeItem('aegis_disconnected');
      const walletClient = createWalletClient({ chain: sepolia, transport: custom((window as any).ethereum) });
      const [addr] = await walletClient.requestAddresses();
      const chainId = await walletClient.getChainId();
      if (chainId !== sepolia.id) await walletClient.switchChain({ id: sepolia.id });
      setAddress(addr);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    localStorage.setItem('aegis_disconnected', 'true');
    setAddress(null);
  }, []);

  const switchWallet = useCallback(async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      setError('No wallet found — install MetaMask.');
      return;
    }
    setError(null);
    try {
      localStorage.removeItem('aegis_disconnected');
      const walletClient = createWalletClient({ chain: sepolia, transport: custom((window as any).ethereum) });
      await walletClient.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] });
      const [addr] = await walletClient.requestAddresses();
      setAddress(addr);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to switch wallet');
    }
  }, []);

  useEffect(() => {
    const checkConnection = async () => {
      if (localStorage.getItem('aegis_disconnected') === 'true') return;
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const walletClient = createWalletClient({ chain: sepolia, transport: custom((window as any).ethereum) });
          const accounts = await walletClient.getAddresses();
          if (accounts.length > 0) setAddress(accounts[0]);
        } catch (err) {
          console.error('Error checking wallet connection on mount:', err);
        }
      }
    };
    checkConnection();

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const handleAccounts = (accounts: string[]) => {
        if (accounts.length > 0) {
          localStorage.removeItem('aegis_disconnected');
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

  return (
    <WalletContext.Provider value={{ address, connecting, error, connect, disconnect, switchWallet }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within a WalletProvider');
  return ctx;
}

export function getPublicClient() {
  return createPublicClient({ chain: sepolia, transport: http('https://ethereum-sepolia-rpc.publicnode.com') });
}

export function getWalletClient() {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('No wallet found');
  }
  return createWalletClient({ chain: sepolia, transport: custom((window as any).ethereum) });
}
