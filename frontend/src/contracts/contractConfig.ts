import { isAddress, ZeroAddress } from "ethers";

const configuredAddress = import.meta.env.VITE_BLOCKBID_ADDRESS?.trim() ?? "";

// Replace this gate with verified run identity when the local deployment is ready.
export const hasVerifiedDeployment: boolean = false;
export const deploymentUnavailableMessage =
  "Auction data and wallet actions require a verified local deployment.";

export const BLOCKBID_ADDRESS = configuredAddress;

export function getBlockBidAddress(): string {
  if (!hasVerifiedDeployment) throw new Error(deploymentUnavailableMessage);
  if (!isAddress(BLOCKBID_ADDRESS) || BLOCKBID_ADDRESS === ZeroAddress) {
    throw new Error(
      "BlockBid contract address is missing or invalid. Set VITE_BLOCKBID_ADDRESS in frontend/.env and restart Vite.",
    );
  }

  return BLOCKBID_ADDRESS;
}
