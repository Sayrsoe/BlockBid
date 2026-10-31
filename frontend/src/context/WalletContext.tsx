import {
  BrowserProvider,
  getAddress,
  type Eip1193Provider,
} from "ethers";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { targetNetwork, toChainIdHex } from "../config/network";

type WalletStatus = "idle" | "checking" | "connecting" | "connected" | "switching";

export interface WalletContextValue {
  account: string | null;
  chainId: bigint | null;
  provider: BrowserProvider | null;
  status: WalletStatus;
  error: string | null;
  isMetaMaskAvailable: boolean;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
  clearError: () => void;
}

export const WalletContext = createContext<WalletContextValue | undefined>(
  undefined,
);

function readErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const candidate = error as {
      code?: number;
      shortMessage?: string;
      message?: string;
    };

    if (candidate.code === 4001) {
      return "The wallet request was rejected.";
    }
    if (candidate.shortMessage) {
      return candidate.shortMessage;
    }
    if (candidate.message) {
      return candidate.message;
    }
  }

  return "The wallet request failed. Please try again.";
}

function checksumAccount(account: string): string {
  try {
    return getAddress(account);
  } catch {
    return account;
  }
}

export function WalletProvider({ children }: PropsWithChildren) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<bigint | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [status, setStatus] = useState<WalletStatus>("checking");
  const [error, setError] = useState<string | null>(null);

  const isMetaMaskAvailable = typeof window !== "undefined" && Boolean(window.ethereum);

  const syncWallet = useCallback(async (requestAccess: boolean) => {
    const injected = window.ethereum;

    if (!injected) {
      setAccount(null);
      setChainId(null);
      setProvider(null);
      setStatus("idle");
      if (requestAccess) {
        setError("MetaMask was not detected in this browser.");
      }
      return;
    }

    setError(null);
    setStatus(requestAccess ? "connecting" : "checking");

    try {
      const method = requestAccess ? "eth_requestAccounts" : "eth_accounts";
      const accounts = (await injected.request({ method })) as string[];
      const currentChainId = (await injected.request({
        method: "eth_chainId",
      })) as string;
      const nextProvider = new BrowserProvider(injected as Eip1193Provider);

      setProvider(nextProvider);
      setChainId(BigInt(currentChainId));

      if (accounts.length === 0) {
        setAccount(null);
        setStatus("idle");
        return;
      }

      setAccount(checksumAccount(accounts[0]));
      setStatus("connected");
    } catch (walletError) {
      setAccount(null);
      setStatus("idle");
      setError(readErrorMessage(walletError));
    }
  }, []);

  const connect = useCallback(async () => {
    await syncWallet(true);
  }, [syncWallet]);

  const disconnect = useCallback(() => {
    // EIP-1193 wallets do not expose a universal programmatic disconnect.
    // This clears the app session; the wallet may remain authorized internally.
    setAccount(null);
    setProvider(null);
    setStatus("idle");
    setError(null);
  }, []);

  const switchNetwork = useCallback(async () => {
    const injected = window.ethereum;
    if (!injected) {
      setError("MetaMask was not detected in this browser.");
      return;
    }

    setStatus("switching");
    setError(null);

    try {
      await injected.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: toChainIdHex(targetNetwork.chainId) }],
      });
      setChainId(targetNetwork.chainId);
      setStatus(account ? "connected" : "idle");
    } catch (switchError) {
      const code =
        typeof switchError === "object" && switchError !== null
          ? (switchError as { code?: number }).code
          : undefined;

      if (code === 4902) {
        try {
          await injected.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: toChainIdHex(targetNetwork.chainId),
                chainName: targetNetwork.name,
                nativeCurrency: {
                  name: targetNetwork.currencySymbol,
                  symbol: targetNetwork.currencySymbol,
                  decimals: 18,
                },
                rpcUrls: [targetNetwork.rpcUrl],
                ...(targetNetwork.explorerUrl
                  ? { blockExplorerUrls: [targetNetwork.explorerUrl] }
                  : {}),
              },
            ],
          });
          setChainId(targetNetwork.chainId);
          setStatus(account ? "connected" : "idle");
          return;
        } catch (addError) {
          setError(readErrorMessage(addError));
        }
      } else {
        setError(readErrorMessage(switchError));
      }

      setStatus(account ? "connected" : "idle");
    }
  }, [account]);

  useEffect(() => {
    void syncWallet(false);
  }, [syncWallet]);

  useEffect(() => {
    const injected = window.ethereum;
    if (!injected) {
      return;
    }

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAccount(null);
        setStatus("idle");
        return;
      }

      setAccount(checksumAccount(accounts[0]));
      setStatus("connected");
      setError(null);
    };

    const handleChainChanged = (nextChainId: string) => {
      setChainId(BigInt(nextChainId));
      setError(null);
    };

    injected.on("accountsChanged", handleAccountsChanged);
    injected.on("chainChanged", handleChainChanged);

    return () => {
      injected.removeListener("accountsChanged", handleAccountsChanged);
      injected.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      account,
      chainId,
      provider,
      status,
      error,
      isMetaMaskAvailable,
      isConnected: Boolean(account),
      isCorrectNetwork: chainId === targetNetwork.chainId,
      connect,
      disconnect,
      switchNetwork,
      clearError: () => setError(null),
    }),
    [
      account,
      chainId,
      provider,
      status,
      error,
      isMetaMaskAvailable,
      connect,
      disconnect,
      switchNetwork,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
