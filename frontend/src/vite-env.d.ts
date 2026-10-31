/// <reference types="vite/client" />

import type { Eip1193Provider } from "ethers";

type AccountsChangedListener = (accounts: string[]) => void;
type ChainChangedListener = (chainId: string) => void;

interface InjectedEthereumProvider extends Eip1193Provider {
  on(event: "accountsChanged", listener: AccountsChangedListener): void;
  on(event: "chainChanged", listener: ChainChangedListener): void;
  removeListener(event: "accountsChanged", listener: AccountsChangedListener): void;
  removeListener(event: "chainChanged", listener: ChainChangedListener): void;
}

declare global {
  interface Window {
    ethereum?: InjectedEthereumProvider;
  }

  interface ImportMetaEnv {
    readonly VITE_BLOCKBID_ADDRESS?: string;
    readonly VITE_TARGET_CHAIN_ID?: string;
    readonly VITE_TARGET_CHAIN_NAME?: string;
    readonly VITE_TARGET_RPC_URL?: string;
    readonly VITE_TARGET_EXPLORER_URL?: string;
    readonly VITE_TARGET_CURRENCY_SYMBOL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
