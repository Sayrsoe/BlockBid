const HARDHAT_CHAIN_ID = 31337n;

function parseTargetChainId(value: string | undefined): bigint {
  if (!value) {
    return HARDHAT_CHAIN_ID;
  }

  try {
    const parsed = BigInt(value);
    return parsed > 0n ? parsed : HARDHAT_CHAIN_ID;
  } catch {
    return HARDHAT_CHAIN_ID;
  }
}

export const targetNetwork = {
  chainId: parseTargetChainId(import.meta.env.VITE_TARGET_CHAIN_ID),
  name: import.meta.env.VITE_TARGET_CHAIN_NAME?.trim() || "Hardhat Local",
  rpcUrl:
    import.meta.env.VITE_TARGET_RPC_URL?.trim() || "http://127.0.0.1:8545",
  explorerUrl: import.meta.env.VITE_TARGET_EXPLORER_URL?.trim() || "",
  currencySymbol:
    import.meta.env.VITE_TARGET_CURRENCY_SYMBOL?.trim() || "ETH",
} as const;

export function toChainIdHex(chainId: bigint): `0x${string}` {
  return `0x${chainId.toString(16)}`;
}
