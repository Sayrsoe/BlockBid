import { formatEther } from "ethers";
import { AuctionStatus, type Auction, type AuctionDisplayStatus } from "../types/blockBid";

export function formatEth(value: bigint, maximumFractionDigits = 4): string {
  const numeric = Number(formatEther(value));

  if (!Number.isFinite(numeric)) {
    return `${formatEther(value)} ETH`;
  }

  return `${new Intl.NumberFormat(undefined, {
    maximumFractionDigits,
  }).format(numeric)} ETH`;
}

export function formatDateTime(timestamp: bigint | number): string {
  const seconds = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(seconds * 1000));
}

export function formatCountdown(targetTimestamp: bigint | number, now = Date.now()): string {
  const seconds = typeof targetTimestamp === "bigint" ? Number(targetTimestamp) : targetTimestamp;
  const difference = Math.max(0, seconds * 1000 - now);

  if (difference === 0) {
    return "Ended";
  }

  const totalSeconds = Math.floor(difference / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

export function toDateTimeLocalValue(date: Date): string {
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

export function unixFromDateTimeLocal(value: string): number {
  const milliseconds = new Date(value).getTime();

  if (!Number.isFinite(milliseconds)) {
    throw new Error("Enter a valid date and time.");
  }

  return Math.floor(milliseconds / 1000);
}

export function formatAuctionTiming(auction: Auction, now = Date.now()): string {
  const nowSeconds = Math.floor(now / 1000);
  const start = Number(auction.startTime);
  const end = Number(auction.endTime);

  if (auction.status === AuctionStatus.Cancelled) {
    return "Cancelled";
  }
  if (auction.status === AuctionStatus.Finalized) {
    return "Settled";
  }
  if (auction.status === AuctionStatus.Ended || auction.status === AuctionStatus.Disputed) {
    return "Ended";
  }
  if (nowSeconds < start) {
    return `Starts in ${formatCountdown(start, now).replace(" left", "")}`;
  }
  if (nowSeconds >= end) {
    return "Expired — awaiting end";
  }

  return formatCountdown(end, now);
}

export function getAuctionDisplayStatus(
  auction: Auction,
  now = Date.now(),
): AuctionDisplayStatus {
  if (auction.status === AuctionStatus.Cancelled) return "cancelled";
  if (auction.status === AuctionStatus.Finalized) return "finalized";
  if (auction.status === AuctionStatus.Disputed) return "disputed";
  if (auction.status === AuctionStatus.Ended) return "ended";

  const nowSeconds = Math.floor(now / 1000);
  if (nowSeconds < Number(auction.startTime)) return "pending";
  if (nowSeconds >= Number(auction.endTime)) return "awaiting-end";
  return "active";
}


export function formatBasisPoints(value: number): string {
  return `${(value / 100).toFixed(2)}%`;
}
