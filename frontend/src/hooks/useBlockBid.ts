import { useCallback } from "react";
import type { BrowserProvider } from "ethers";
import { useWallet } from "./useWallet";
import * as blockBid from "../services/blockBidService";
import type { CreateAuctionInput, TransactionCallbacks } from "../types/blockBid";
import type { TransactionLifecycle } from "../services/blockBidService";

export function useBlockBid() {
  const { provider, isConnected, isCorrectNetwork } = useWallet();

  const requireProvider = useCallback((): BrowserProvider => {
    if (!isConnected || !provider) {
      throw new Error("Connect MetaMask before submitting a transaction.");
    }
    if (!isCorrectNetwork) {
      throw new Error("Switch MetaMask to the configured BlockBid network first.");
    }

    return provider;
  }, [isConnected, isCorrectNetwork, provider]);

  return {
    createAuction: (input: CreateAuctionInput, lifecycle?: TransactionLifecycle) =>
      blockBid.createAuction(requireProvider(), input, lifecycle),
    placeBid: (auctionId: bigint | number, amountEth: string) =>
      blockBid.placeBid(requireProvider(), auctionId, amountEth),
    cancelAuction: (auctionId: bigint | number) =>
      blockBid.cancelAuction(requireProvider(), auctionId),
    endAuction: (auctionId: bigint | number) =>
      blockBid.endAuction(requireProvider(), auctionId),
    finalizeAuction: (auctionId: bigint | number) =>
      blockBid.finalizeAuction(requireProvider(), auctionId),
    claimRefund: () => blockBid.claimRefund(requireProvider()),
    claimProceeds: (auctionId: bigint | number) =>
      blockBid.claimProceeds(requireProvider(), auctionId),
    setPlatformFee: (feeBps: number, callbacks?: TransactionCallbacks) =>
      blockBid.setPlatformFee(requireProvider(), feeBps, callbacks),
    setFeeRecipient: (recipient: string, callbacks?: TransactionCallbacks) =>
      blockBid.setFeeRecipient(requireProvider(), recipient, callbacks),
    transferMarketplaceOwnership: (newOwner: string, callbacks?: TransactionCallbacks) =>
      blockBid.transferMarketplaceOwnership(requireProvider(), newOwner, callbacks),
    renounceMarketplaceOwnership: (callbacks?: TransactionCallbacks) =>
      blockBid.renounceMarketplaceOwnership(requireProvider(), callbacks),
    pauseMarketplace: (callbacks?: TransactionCallbacks) =>
      blockBid.pauseMarketplace(requireProvider(), callbacks),
    unpauseMarketplace: (callbacks?: TransactionCallbacks) =>
      blockBid.unpauseMarketplace(requireProvider(), callbacks),
  };
}
