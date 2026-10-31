export enum AuctionStatus {
  Created = 0,
  Active = 1,
  Ended = 2,
  Finalized = 3,
  Cancelled = 4,
  Disputed = 5,
}

export enum AuctionCategory {
  Art = 0,
  Collectibles = 1,
  Electronics = 2,
  Fashion = 3,
  RealWorldAssets = 4,
  Domains = 5,
  Services = 6,
  Other = 7,
}

export enum BidStatus {
  Active = 0,
  Outbid = 1,
  Winning = 2,
  Refunded = 3,
  Withdrawn = 4,
}

export enum PaymentStatus {
  Pending = 0,
  Escrowed = 1,
  Released = 2,
  Refunded = 3,
  Failed = 4,
}

export type AuctionDisplayStatus =
  | "pending"
  | "active"
  | "awaiting-end"
  | "ended"
  | "finalized"
  | "cancelled"
  | "disputed";

export interface Auction {
  auctionId: bigint;
  seller: string;
  highestBidder: string;
  status: AuctionStatus;
  category: AuctionCategory;
  reserveMet: boolean;
  sellerClaimed: boolean;
  antiSnipeTriggered: boolean;
  createdAt: bigint;
  startTime: bigint;
  endTime: bigint;
  totalBids: number;
  disputeId: number;
  startingPrice: bigint;
  reservePrice: bigint;
  currentHighestBid: bigint;
  minBidIncrement: bigint;
  metadataURI: string;
}

export interface Bid {
  bidder: string;
  status: BidStatus;
  timestamp: bigint;
  amount: bigint;
}

export interface EscrowInfo {
  auctionId: bigint;
  amount: bigint;
  depositor: string;
  status: PaymentStatus;
  depositedAt: bigint;
  releaseDeadline: bigint;
}

export interface AuctionMetadata {
  name?: string;
  title?: string;
  description?: string;
  category?: string;
  image?: string;
  createdAt?: string;
  external_url?: string;
}

export interface CreateAuctionInput {
  startingPriceEth: string;
  reservePriceEth: string;
  minBidIncrementEth: string;
  startTime: number;
  endTime: number;
  category: AuctionCategory;
  metadataURI: string;
}

export interface TransactionResult {
  hash: string;
}

export interface CreateAuctionResult extends TransactionResult {
  auctionId: bigint;
}

export interface TransactionCallbacks {
  onSubmitted?: (hash: string) => void;
}

export interface PlatformOverview {
  totalAuctions: number;
  activeAuctions: number;
  pendingAuctions: number;
  endedAuctions: number;
  cancelledAuctions: number;
  totalUsers: number;
  totalBids: number;
  totalVolume: bigint;
  platformFeeBps: number;
  paused: boolean;
}

export const AUCTION_STATUS_LABELS: Record<AuctionStatus, string> = {
  [AuctionStatus.Created]: "Created",
  [AuctionStatus.Active]: "Active",
  [AuctionStatus.Ended]: "Ended",
  [AuctionStatus.Finalized]: "Finalized",
  [AuctionStatus.Cancelled]: "Cancelled",
  [AuctionStatus.Disputed]: "Disputed",
};

export const AUCTION_CATEGORY_LABELS: Record<AuctionCategory, string> = {
  [AuctionCategory.Art]: "Art",
  [AuctionCategory.Collectibles]: "Collectibles",
  [AuctionCategory.Electronics]: "Electronics",
  [AuctionCategory.Fashion]: "Fashion",
  [AuctionCategory.RealWorldAssets]: "Real-world assets",
  [AuctionCategory.Domains]: "Domains",
  [AuctionCategory.Services]: "Services",
  [AuctionCategory.Other]: "Other",
};

export const BID_STATUS_LABELS: Record<BidStatus, string> = {
  [BidStatus.Active]: "Active",
  [BidStatus.Outbid]: "Outbid",
  [BidStatus.Winning]: "Winning",
  [BidStatus.Refunded]: "Refunded",
  [BidStatus.Withdrawn]: "Withdrawn",
};
