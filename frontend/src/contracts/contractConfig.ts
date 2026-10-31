import { isAddress, ZeroAddress, type InterfaceAbi } from "ethers";
import artifact from "./BlockBidMarketplace.json";

interface ContractArtifact {
  abi: InterfaceAbi;
}

const configuredAddress = import.meta.env.VITE_BLOCKBID_ADDRESS?.trim() ?? "";

export const BLOCKBID_ADDRESS = configuredAddress;
export const BLOCKBID_ABI = (artifact as ContractArtifact).abi;

export function getBlockBidAddress(): string {
  if (!isAddress(BLOCKBID_ADDRESS) || BLOCKBID_ADDRESS === ZeroAddress) {
    throw new Error(
      "BlockBid contract address is missing or invalid. Set VITE_BLOCKBID_ADDRESS in frontend/.env and restart Vite.",
    );
  }

  return BLOCKBID_ADDRESS;
}
