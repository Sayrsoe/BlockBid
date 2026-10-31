import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ZeroAddress } from "ethers";
import { AuctionStatusBadge } from "./AuctionStatusBadge";
import {
  AUCTION_CATEGORY_LABELS,
  AuctionStatus,
  type Auction,
  type AuctionMetadata,
} from "../types/blockBid";
import { formatCountdown, formatEth } from "../utils/format";
import { loadAuctionMetadata, metadataTitle, resolveContentUri } from "../utils/metadata";
import { shortenAddress } from "../utils/address";

interface AuctionCardProps {
  auction: Auction;
  metadata?: AuctionMetadata | null;
}

export function AuctionCard({ auction, metadata: providedMetadata }: AuctionCardProps) {
  const [loadedMetadata, setLoadedMetadata] = useState<AuctionMetadata | null>(providedMetadata ?? null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (providedMetadata !== undefined) {
      setLoadedMetadata(providedMetadata);
      return;
    }

    let active = true;
    void loadAuctionMetadata(auction.metadataURI).then((value) => {
      if (active) setLoadedMetadata(value);
    });

    return () => {
      active = false;
    };
  }, [auction.metadataURI, providedMetadata]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const metadata = providedMetadata ?? loadedMetadata;
  const image = metadata?.image ? resolveContentUri(metadata.image) : null;
  const displayBid = auction.currentHighestBid > 0n ? auction.currentHighestBid : auction.startingPrice;
  const hasStarted = Number(auction.startTime) * 1_000 <= now;
  const hasEnded = Number(auction.endTime) * 1_000 <= now;
  const isLive = auction.status === AuctionStatus.Active && hasStarted && !hasEnded;
  const timerLabel = !hasStarted
    ? `Starts in ${formatCountdown(auction.startTime, now)}`
    : isLive
      ? formatCountdown(auction.endTime, now)
      : "Auction closed";

  return (
    <article className="surface-card group relative overflow-hidden transition duration-300 hover:-translate-y-1.5 hover:border-violet-400/25 hover:shadow-[0_30px_90px_-42px_rgba(124,58,237,.72)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-violet-950 via-cosmos-800 to-cyan-950">
        {image ? (
          <img
            src={image}
            alt={metadataTitle(metadata, auction.auctionId)}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.06]"
          />
        ) : (
          <div className="relative grid h-full place-items-center overflow-hidden">
            <div className="absolute h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="absolute right-8 top-8 h-20 w-20 rounded-full border border-white/10" />
            <span className="relative text-5xl font-black text-white/20">#{auction.auctionId.toString()}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-cosmos-950 via-transparent to-transparent" />
        <div className="absolute left-4 top-4">
          <AuctionStatusBadge status={auction.status} />
        </div>
        <div className="absolute bottom-4 right-4 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
          {timerLabel}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">
              {AUCTION_CATEGORY_LABELS[auction.category]}
            </p>
            <h2 className="mt-2 truncate text-lg font-bold text-white">
              {metadataTitle(metadata, auction.auctionId)}
            </h2>
            <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
              {metadata?.description || "Demo listing; item delivery is not guaranteed."}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
          <div>
            <p className="text-[11px] text-slate-500">
              {auction.currentHighestBid > 0n ? "Highest bid" : "Starting price"}
            </p>
            <p className="mt-1 font-bold text-white">{formatEth(displayBid)}</p>
          </div>
          <div className="border-l border-white/[0.07] pl-3">
            <p className="text-[11px] text-slate-500">Total bids</p>
            <p className="mt-1 font-bold text-white">{auction.totalBids}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
          <span>Seller {shortenAddress(auction.seller, 3)}</span>
          <span>
            {auction.highestBidder === ZeroAddress
              ? "No bidder yet"
              : `Leader ${shortenAddress(auction.highestBidder, 3)}`}
          </span>
        </div>

        <Link to={`/auction/${auction.auctionId.toString()}`} className="button-secondary mt-5 w-full">
          View auction
          <ArrowIcon />
        </Link>
      </div>
    </article>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
