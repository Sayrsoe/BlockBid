import {
  BrowserProvider,
  Contract,
  Interface,
  JsonRpcProvider,
  parseEther,
  type ContractTransactionReceipt,
  type ContractTransactionResponse,
} from "ethers";
import { BLOCKBID_ABI, getBlockBidAddress } from "../contracts/contractConfig";
import { targetNetwork } from "../config/network";
import {
  AuctionCategory,
  AuctionStatus,
  BidStatus,
  PaymentStatus,
  type Auction,
  type Bid,
  type CreateAuctionInput,
  type CreateAuctionResult,
  type EscrowInfo,
  type PlatformOverview,
  type TransactionCallbacks,
  type TransactionResult,
} from "../types/blockBid";
import { getAuctionDisplayStatus } from "../utils/format";
import { mapWithConcurrency } from "../utils/mapWithConcurrency";

export type TransactionLifecycle = TransactionCallbacks;

const contractInterface = new Interface(BLOCKBID_ABI);
let readProvider: JsonRpcProvider | null = null;

type StructValue = Record<string | number, unknown>;

function getStructField<T>(value: unknown, name: string, index: number): T {
  const struct = value as StructValue;
  return (struct[name] ?? struct[index]) as T;
}

function toBigInt(value: unknown): bigint {
  return typeof value === "bigint" ? value : BigInt(String(value));
}

function toNumber(value: unknown): number {
  return Number(toBigInt(value));
}

function normalizeAuction(value: unknown): Auction {
  return {
    auctionId: toBigInt(getStructField(value, "auctionId", 0)),
    seller: String(getStructField(value, "seller", 1)),
    highestBidder: String(getStructField(value, "highestBidder", 2)),
    status: toNumber(getStructField(value, "status", 3)) as AuctionStatus,
    category: toNumber(getStructField(value, "category", 4)) as AuctionCategory,
    reserveMet: Boolean(getStructField(value, "reserveMet", 5)),
    sellerClaimed: Boolean(getStructField(value, "sellerClaimed", 6)),
    antiSnipeTriggered: Boolean(getStructField(value, "antiSnipeTriggered", 7)),
    createdAt: toBigInt(getStructField(value, "createdAt", 8)),
    startTime: toBigInt(getStructField(value, "startTime", 9)),
    endTime: toBigInt(getStructField(value, "endTime", 10)),
    totalBids: toNumber(getStructField(value, "totalBids", 11)),
    disputeId: toNumber(getStructField(value, "disputeId", 12)),
    startingPrice: toBigInt(getStructField(value, "startingPrice", 13)),
    reservePrice: toBigInt(getStructField(value, "reservePrice", 14)),
    currentHighestBid: toBigInt(getStructField(value, "currentHighestBid", 15)),
    minBidIncrement: toBigInt(getStructField(value, "minBidIncrement", 16)),
    metadataURI: String(getStructField(value, "metadataURI", 17)),
  };
}

function normalizeBid(value: unknown): Bid {
  return {
    bidder: String(getStructField(value, "bidder", 0)),
    status: toNumber(getStructField(value, "status", 1)) as BidStatus,
    timestamp: toBigInt(getStructField(value, "timestamp", 2)),
    amount: toBigInt(getStructField(value, "amount", 3)),
  };
}

function normalizeEscrow(value: unknown): EscrowInfo {
  return {
    auctionId: toBigInt(getStructField(value, "auctionId", 0)),
    amount: toBigInt(getStructField(value, "amount", 1)),
    depositor: String(getStructField(value, "depositor", 2)),
    status: toNumber(getStructField(value, "status", 3)) as PaymentStatus,
    depositedAt: toBigInt(getStructField(value, "depositedAt", 4)),
    releaseDeadline: toBigInt(getStructField(value, "releaseDeadline", 5)),
  };
}

function getReadProvider(): JsonRpcProvider {
  if (!readProvider) {
    readProvider = new JsonRpcProvider(targetNetwork.rpcUrl, Number(targetNetwork.chainId));
  }

  return readProvider;
}

export function getReadContract(): Contract {
  return new Contract(getBlockBidAddress(), BLOCKBID_ABI, getReadProvider());
}

export async function getWriteContract(provider: BrowserProvider): Promise<Contract> {
  const signer = await provider.getSigner();
  return new Contract(getBlockBidAddress(), BLOCKBID_ABI, signer);
}

async function waitForTransaction(
  transaction: ContractTransactionResponse,
  callbacks?: TransactionCallbacks,
): Promise<ContractTransactionReceipt> {
  callbacks?.onSubmitted?.(transaction.hash);
  const receipt = await transaction.wait();

  if (!receipt) {
    throw new Error("The transaction was submitted but no receipt was returned.");
  }

  return receipt;
}

function transactionResult(receipt: ContractTransactionReceipt): TransactionResult {
  return { hash: receipt.hash };
}

export async function getTotalAuctions(): Promise<number> {
  const total: bigint = await getReadContract().getTotalAuctions();
  return Number(total);
}

export async function getAuction(auctionId: bigint | number): Promise<Auction> {
  const value: unknown = await getReadContract().getAuction(auctionId);
  return normalizeAuction(value);
}

export async function getAuctionsByIds(auctionIds: readonly bigint[]): Promise<Auction[]> {
  const uniqueIds = [...new Set(auctionIds.map((id) => id.toString()))].map((id) => BigInt(id));
  return mapWithConcurrency(uniqueIds, 8, (auctionId) => getAuction(auctionId));
}

export async function getAllAuctions(): Promise<Auction[]> {
  const total = await getTotalAuctions();
  const ids = Array.from({ length: total }, (_, index) => BigInt(index + 1));
  return getAuctionsByIds(ids);
}

export async function getBidHistory(auctionId: bigint | number): Promise<Bid[]> {
  const values: unknown[] = await getReadContract().getBidHistory(auctionId);
  return values.map(normalizeBid);
}

export async function getMinimumNextBid(auctionId: bigint | number): Promise<bigint> {
  return getReadContract().getMinimumNextBid(auctionId) as Promise<bigint>;
}

export async function getPendingRefund(account: string): Promise<bigint> {
  return getReadContract().getPendingRefund(account) as Promise<bigint>;
}

export async function getEscrowInfo(auctionId: bigint | number): Promise<EscrowInfo> {
  const value: unknown = await getReadContract().getEscrowInfo(auctionId);
  return normalizeEscrow(value);
}

export async function getPlatformFeeBps(): Promise<number> {
  const fee: bigint = await getReadContract().getPlatformFee();
  return Number(fee);
}

export async function getFeeRecipient(): Promise<string> {
  return String(await getReadContract().getFeeRecipient());
}

export async function getContractOwner(): Promise<string> {
  return String(await getReadContract().owner());
}

export async function isContractPaused(): Promise<boolean> {
  return Boolean(await getReadContract().paused());
}

export async function getWalletBalance(
  provider: BrowserProvider,
  account: string,
): Promise<bigint> {
  return provider.getBalance(account);
}

async function getIndexedAuctionIds(
  method: "getAuctionsBySeller" | "getAuctionsByBidder",
  account: string,
): Promise<bigint[]> {
  const contract = getReadContract();
  const pageSize = 50;
  const collected: bigint[] = [];
  let offset = 0;

  for (;;) {
    const page: bigint[] = await contract[method](account, offset, pageSize);
    collected.push(...page);

    if (page.length < pageSize) {
      break;
    }

    offset += page.length;
  }

  return [...new Set(collected.map((id) => id.toString()))].map((id) => BigInt(id));
}

export function getAuctionsBySeller(account: string): Promise<bigint[]> {
  return getIndexedAuctionIds("getAuctionsBySeller", account);
}

export function getAuctionsByBidder(account: string): Promise<bigint[]> {
  return getIndexedAuctionIds("getAuctionsByBidder", account);
}

export async function getPlatformOverview(): Promise<PlatformOverview> {
  const [auctions, platformFeeBps, paused] = await Promise.all([
    getAllAuctions(),
    getPlatformFeeBps(),
    isContractPaused(),
  ]);
  const histories = await mapWithConcurrency(auctions, 6,
    (auction) => getBidHistory(auction.auctionId),
  );
  const users = new Set<string>();
  let activeAuctions = 0;
  let pendingAuctions = 0;
  let endedAuctions = 0;
  let cancelledAuctions = 0;
  let totalBids = 0;
  let totalVolume = 0n;

  auctions.forEach((auction, index) => {
    users.add(auction.seller.toLowerCase());
    const displayStatus = getAuctionDisplayStatus(auction);
    if (displayStatus === "active") activeAuctions += 1;
    if (displayStatus === "pending") pendingAuctions += 1;
    if (displayStatus === "ended" || displayStatus === "finalized") endedAuctions += 1;
    if (displayStatus === "cancelled") cancelledAuctions += 1;

    const history = histories[index];
    totalBids += history.length;
    history.forEach((bid) => users.add(bid.bidder.toLowerCase()));

    if (
      auction.reserveMet &&
      (auction.status === AuctionStatus.Ended || auction.status === AuctionStatus.Finalized)
    ) {
      totalVolume += auction.currentHighestBid;
    }
  });

  return {
    totalAuctions: auctions.length,
    activeAuctions,
    pendingAuctions,
    endedAuctions,
    cancelledAuctions,
    totalUsers: users.size,
    totalBids,
    totalVolume,
    platformFeeBps,
    paused,
  };
}

export async function createAuction(
  provider: BrowserProvider,
  input: CreateAuctionInput,
  callbacks?: TransactionCallbacks,
): Promise<CreateAuctionResult> {
  const contract = await getWriteContract(provider);
  const transaction: ContractTransactionResponse = await contract.createAuction(
    parseEther(input.startingPriceEth),
    input.reservePriceEth.trim() === "" ? 0n : parseEther(input.reservePriceEth),
    parseEther(input.minBidIncrementEth),
    input.startTime,
    input.endTime,
    input.category,
    input.metadataURI.trim(),
  );
  const receipt = await waitForTransaction(transaction, callbacks);

  for (const log of receipt.logs) {
    try {
      const parsed = contractInterface.parseLog(log);
      if (parsed?.name === "AuctionCreated") {
        return {
          hash: receipt.hash,
          auctionId: toBigInt(parsed.args.auctionId ?? parsed.args[0]),
        };
      }
    } catch {
      // Ignore logs emitted by other contracts or unknown interfaces.
    }
  }

  return {
    hash: receipt.hash,
    auctionId: BigInt(await getTotalAuctions()),
  };
}

export async function editAuctionMetadata(
  provider: BrowserProvider,
  auctionId: bigint | number,
  metadataURI: string,
  callbacks?: TransactionCallbacks,
): Promise<TransactionResult> {
  const contract = await getWriteContract(provider);
  const transaction: ContractTransactionResponse = await contract.editAuctionMetadata(
    auctionId,
    metadataURI.trim(),
  );
  return transactionResult(await waitForTransaction(transaction, callbacks));
}

export async function placeBid(
  provider: BrowserProvider,
  auctionId: bigint | number,
  amountEth: string,
  callbacks?: TransactionCallbacks,
): Promise<TransactionResult> {
  const contract = await getWriteContract(provider);
  const transaction: ContractTransactionResponse = await contract.placeBid(auctionId, {
    value: parseEther(amountEth),
  });
  return transactionResult(await waitForTransaction(transaction, callbacks));
}

export async function cancelAuction(
  provider: BrowserProvider,
  auctionId: bigint | number,
  callbacks?: TransactionCallbacks,
): Promise<TransactionResult> {
  const contract = await getWriteContract(provider);
  const transaction: ContractTransactionResponse = await contract.cancelAuction(auctionId);
  return transactionResult(await waitForTransaction(transaction, callbacks));
}

export async function endAuction(
  provider: BrowserProvider,
  auctionId: bigint | number,
  callbacks?: TransactionCallbacks,
): Promise<TransactionResult> {
  const contract = await getWriteContract(provider);
  const transaction: ContractTransactionResponse = await contract.endAuction(auctionId);
  return transactionResult(await waitForTransaction(transaction, callbacks));
}

export async function finalizeAuction(
  provider: BrowserProvider,
  auctionId: bigint | number,
  callbacks?: TransactionCallbacks,
): Promise<TransactionResult> {
  const contract = await getWriteContract(provider);
  const transaction: ContractTransactionResponse = await contract.finalizeAuction(auctionId);
  return transactionResult(await waitForTransaction(transaction, callbacks));
}

export async function claimRefund(
  provider: BrowserProvider,
  callbacks?: TransactionCallbacks,
): Promise<TransactionResult> {
  const contract = await getWriteContract(provider);
  const transaction: ContractTransactionResponse = await contract.claimRefund();
  return transactionResult(await waitForTransaction(transaction, callbacks));
}

export async function claimProceeds(
  provider: BrowserProvider,
  auctionId: bigint | number,
  callbacks?: TransactionCallbacks,
): Promise<TransactionResult> {
  const contract = await getWriteContract(provider);
  const transaction: ContractTransactionResponse = await contract.claimProceeds(auctionId);
  return transactionResult(await waitForTransaction(transaction, callbacks));
}

export async function setPlatformFee(
  provider: BrowserProvider,
  feeBps: number,
  callbacks?: TransactionCallbacks,
): Promise<TransactionResult> {
  const contract = await getWriteContract(provider);
  const transaction: ContractTransactionResponse = await contract.setPlatformFee(feeBps);
  return transactionResult(await waitForTransaction(transaction, callbacks));
}

export async function setFeeRecipient(
  provider: BrowserProvider,
  recipient: string,
  callbacks?: TransactionCallbacks,
): Promise<TransactionResult> {
  const contract = await getWriteContract(provider);
  const transaction: ContractTransactionResponse = await contract.setFeeRecipient(recipient);
  return transactionResult(await waitForTransaction(transaction, callbacks));
}

export async function transferMarketplaceOwnership(
  provider: BrowserProvider,
  newOwner: string,
  callbacks?: TransactionCallbacks,
): Promise<TransactionResult> {
  const contract = await getWriteContract(provider);
  const transaction: ContractTransactionResponse = await contract.transferOwnership(newOwner);
  return transactionResult(await waitForTransaction(transaction, callbacks));
}

export async function renounceMarketplaceOwnership(
  provider: BrowserProvider,
  callbacks?: TransactionCallbacks,
): Promise<TransactionResult> {
  const contract = await getWriteContract(provider);
  const transaction: ContractTransactionResponse = await contract.renounceOwnership();
  return transactionResult(await waitForTransaction(transaction, callbacks));
}

export async function pauseMarketplace(
  provider: BrowserProvider,
  callbacks?: TransactionCallbacks,
): Promise<TransactionResult> {
  const contract = await getWriteContract(provider);
  const transaction: ContractTransactionResponse = await contract.pause();
  return transactionResult(await waitForTransaction(transaction, callbacks));
}

export async function unpauseMarketplace(
  provider: BrowserProvider,
  callbacks?: TransactionCallbacks,
): Promise<TransactionResult> {
  const contract = await getWriteContract(provider);
  const transaction: ContractTransactionResponse = await contract.unpause();
  return transactionResult(await waitForTransaction(transaction, callbacks));
}

const friendlyCustomErrors: Record<string, string> = {
  AuctionNotActive: "This auction is not active.",
  AuctionAlreadyEnded: "This auction has already expired.",
  AuctionNotEnded: "This auction has not reached its end time yet.",
  CannotCancelAfterBid: "An auction cannot be cancelled after the first bid.",
  NotAuctionSeller: "Only the seller can perform this action.",
  SellerCannotBid: "The seller cannot bid on their own auction.",
  AlreadyHighestBidder: "You are already the highest bidder.",
  BidTooLow: "The bid is below the minimum accepted amount.",
  NoFundsToWithdraw: "This wallet has no refund available to claim.",
  EscrowStillLocked: "Seller proceeds are still locked in escrow.",
  EscrowAlreadySettled: "This auction has already been settled.",
  EscrowNotFound: "No releasable escrow exists for this auction.",
  ContractIsPaused: "The marketplace is currently paused.",
  ContractNotPaused: "The marketplace is not paused.",
  OwnableUnauthorizedAccount: "Only the marketplace owner can perform this action.",
  OwnableInvalidOwner: "Enter a valid non-zero owner address.",
  FeeExceedsMaximum: "The platform fee cannot exceed 10%.",
  ZeroAddressNotAllowed: "Enter a non-zero Ethereum address.",
  NotYetImplemented: "This contract feature is not implemented in the deployed MVP.",
};

export function readContractError(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const candidate = error as {
      code?: number | string;
      shortMessage?: string;
      reason?: string;
      message?: string;
      info?: { error?: { message?: string } };
    };

    if (candidate.code === 4001 || candidate.code === "ACTION_REJECTED") {
      return "The transaction was rejected in MetaMask.";
    }

    const combined = [
      candidate.shortMessage,
      candidate.reason,
      candidate.info?.error?.message,
      candidate.message,
    ]
      .filter(Boolean)
      .join(" ");

    for (const [name, message] of Object.entries(friendlyCustomErrors)) {
      if (combined.includes(name)) {
        return message;
      }
    }

    if (candidate.shortMessage) {
      return candidate.shortMessage.replace("execution reverted: ", "");
    }
    if (candidate.reason) {
      return candidate.reason;
    }
    if (candidate.info?.error?.message) {
      return candidate.info.error.message;
    }
    if (candidate.message) {
      const match = candidate.message.match(/reverted with custom error '([^']+)'/i);
      return match?.[1] ?? candidate.message;
    }
  }

  return "The blockchain request failed. Check the network, contract address, and wallet.";
}
