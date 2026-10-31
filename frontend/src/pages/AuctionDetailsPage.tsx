import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { ZeroAddress, parseEther } from "ethers";
import { Link, useParams } from "react-router";
import { AuctionStatusBadge } from "../components/AuctionStatusBadge";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { PageHeader } from "../components/PageHeader";
import { StatusAlert } from "../components/StatusAlert";
import { WalletButton } from "../components/WalletButton";
import { useBlockBid } from "../hooks/useBlockBid";
import { useWallet } from "../hooks/useWallet";
import {
  getAuction,
  getBidHistory,
  getEscrowInfo,
  getMinimumNextBid,
  readContractError,
} from "../services/blockBidService";
import {
  AUCTION_CATEGORY_LABELS,
  BID_STATUS_LABELS,
  AuctionStatus,
  PaymentStatus,
  type Auction,
  type AuctionMetadata,
  type Bid,
  type EscrowInfo,
} from "../types/blockBid";
import { formatCountdown, formatDateTime, formatEth } from "../utils/format";
import { loadAuctionMetadata, metadataTitle, resolveContentUri } from "../utils/metadata";
import { shortenAddress } from "../utils/address";

interface AuctionDetailsData {
  auction: Auction;
  bids: Bid[];
  escrow: EscrowInfo;
  minimumNextBid: bigint;
  metadata: AuctionMetadata | null;
}

export function AuctionDetailsPage() {
  const { auctionId } = useParams();
  const numericId = auctionId && /^\d+$/.test(auctionId) ? BigInt(auctionId) : null;
  const { account, isConnected, isCorrectNetwork } = useWallet();
  const actions = useBlockBid();
  const [data, setData] = useState<AuctionDetailsData | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const loadDetails = useCallback(async () => {
    if (numericId === null) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [auction, bids, escrow, minimumNextBid] = await Promise.all([
        getAuction(numericId),
        getBidHistory(numericId),
        getEscrowInfo(numericId),
        getMinimumNextBid(numericId),
      ]);
      const metadata = await loadAuctionMetadata(auction.metadataURI);
      setData({ auction, bids, escrow, minimumNextBid, metadata });
      setBidAmount((current) => current || formatEth(minimumNextBid, 8).replace(" ETH", ""));
    } catch (loadError) {
      setError(readContractError(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [numericId]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  async function runAction(label: string, action: () => Promise<{ hash: string }>) {
    setActiveAction(label);
    setError(null);
    setSuccess(null);

    try {
      const result = await action();
      setSuccess(`${label} confirmed · ${result.hash}`);
      await loadDetails();
    } catch (actionError) {
      setError(readContractError(actionError));
    } finally {
      setActiveAction(null);
    }
  }

  if (numericId === null) {
    return <Unavailable title="Invalid auction ID" description="The route must contain a numeric on-chain auction identifier." />;
  }

  if (isLoading) {
    return (
      <div className="surface-card grid min-h-80 place-items-center p-8 text-slate-400">
        <div className="text-center"><LoadingSpinner label="Loading auction" /><p className="mt-3 text-sm">Reading auction data from the contract…</p></div>
      </div>
    );
  }

  if (!data) {
    return <Unavailable title="Auction unavailable" description={error ?? "The contract did not return a readable auction."} />;
  }

  const { auction, bids, escrow, metadata, minimumNextBid } = data;
  const normalizedAccount = account?.toLowerCase();
  const isSeller = normalizedAccount === auction.seller.toLowerCase();
  const isHighestBidder = normalizedAccount === auction.highestBidder.toLowerCase();
  const hasStarted = Number(auction.startTime) * 1_000 <= now;
  const hasEndedByTime = Number(auction.endTime) * 1_000 <= now;
  const isActive = auction.status === AuctionStatus.Active;
  const canBid = isActive && hasStarted && !hasEndedByTime && !isSeller && !isHighestBidder;
  const canCancel = isSeller && isActive && auction.totalBids === 0;
  const canEnd = isActive && hasEndedByTime;
  const escrowReady =
    auction.status === AuctionStatus.Ended &&
    escrow.status === PaymentStatus.Escrowed &&
    Number(escrow.releaseDeadline) * 1_000 <= now;
  const image = metadata?.image ? resolveContentUri(metadata.image) : null;
  const currentDisplayPrice = auction.currentHighestBid > 0n ? auction.currentHighestBid : auction.startingPrice;
  const timerText = !hasStarted
    ? `Starts in ${formatCountdown(auction.startTime, now)}`
    : hasEndedByTime
      ? "Bidding closed"
      : formatCountdown(auction.endTime, now);

  let bidValidationMessage: string | null = null;
  if (!bidAmount.trim()) {
    bidValidationMessage = "Enter a bid amount.";
  } else {
    try {
      if (parseEther(bidAmount) < minimumNextBid) {
        bidValidationMessage = `Minimum next bid is ${formatEth(minimumNextBid)}.`;
      }
    } catch {
      bidValidationMessage = "Enter a valid ETH amount.";
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Link to="/" className="button-ghost px-0"><BackIcon /> Marketplace</Link>
        <button type="button" className="button-secondary" onClick={() => void loadDetails()} disabled={isLoading}>
          <RefreshIcon /> Refresh
        </button>
      </div>

      <PageHeader
        eyebrow={`Auction #${auction.auctionId.toString()}`}
        title={metadataTitle(metadata, auction.auctionId)}
        description={metadata?.description || "Demo listing; item delivery is not guaranteed."}
      />

      {error ? <StatusAlert tone="error" title="Action failed">{error}</StatusAlert> : null}
      {success ? <StatusAlert tone="success" title="Transaction confirmed">{success}</StatusAlert> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <main className="space-y-6">
          <section className="surface-card-strong cosmic-border overflow-hidden">
            <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-violet-950 via-cosmos-800 to-cyan-950">
              {image ? (
                <img src={image} alt={metadataTitle(metadata, auction.auctionId)} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center"><span className="text-7xl font-black text-white/10">#{auction.auctionId.toString()}</span></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-cosmos-950/90 via-transparent to-transparent" />
              <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                <AuctionStatusBadge status={auction.status} />
                <span className="rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-200 backdrop-blur">
                  {AUCTION_CATEGORY_LABELS[auction.category]}
                </span>
              </div>
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Auction timer</p>
                  <p className="mt-1 text-2xl font-black text-white sm:text-3xl">{timerText}</p>
                </div>
                {auction.antiSnipeTriggered ? (
                  <span className="rounded-full border border-violet-300/20 bg-violet-500/15 px-3 py-1.5 text-xs font-bold text-violet-200 backdrop-blur">Anti-snipe extended</span>
                ) : null}
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Detail icon={<UserIcon />} label="Seller" value={shortenAddress(auction.seller, 6)} />
                <Detail icon={<CrownIcon />} label="Highest bidder" value={auction.highestBidder === ZeroAddress ? "No bids" : shortenAddress(auction.highestBidder, 6)} />
                <Detail icon={<BidIcon />} label="Total bids" value={String(auction.totalBids)} />
                <Detail label="Starting price" value={formatEth(auction.startingPrice)} />
                <Detail label="Reserve" value={auction.reservePrice === 0n ? "No reserve" : `${formatEth(auction.reservePrice)} · ${auction.reserveMet ? "Met" : "Not met"}`} />
                <Detail label="Minimum increment" value={formatEth(auction.minBidIncrement)} />
                <Detail label="Starts" value={formatDateTime(auction.startTime)} />
                <Detail label="Ends" value={formatDateTime(auction.endTime)} />
                <Detail label="Storage" value="Local off-chain metadata" />
              </div>
            </div>
          </section>

          <section className="surface-card p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div><p className="eyebrow">On-chain history</p><h2 className="mt-2 text-2xl font-black text-white">Bid activity</h2></div>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-sm font-bold text-slate-300">{bids.length}</span>
            </div>

            {bids.length === 0 ? (
              <div className="muted-panel mt-6 p-6 text-center"><p className="font-semibold text-slate-300">No bids yet</p><p className="mt-1 text-sm text-slate-500">The first valid bid will appear here permanently.</p></div>
            ) : (
              <div className="mt-6 space-y-3">
                {[...bids].reverse().map((bid, index) => (
                  <div key={`${bid.bidder}-${bid.timestamp.toString()}-${index}`} className="muted-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl border border-violet-300/15 bg-violet-500/10 text-violet-200"><BidIcon /></span>
                      <div><p className="font-semibold text-white">{shortenAddress(bid.bidder, 5)}</p><p className="mt-0.5 text-xs text-slate-500">{formatDateTime(bid.timestamp)}</p></div>
                    </div>
                    <div className="sm:text-right"><p className="font-black text-white">{formatEth(bid.amount)}</p><p className="mt-0.5 text-xs font-semibold text-violet-300">{BID_STATUS_LABELS[bid.status]}</p></div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="surface-card-strong cosmic-border p-6">
            <p className="eyebrow">{auction.currentHighestBid > 0n ? "Current highest bid" : "Starting price"}</p>
            <p className="mt-3 text-4xl font-black tracking-tight text-white">{formatEth(currentDisplayPrice)}</p>
            <p className="mt-2 text-sm text-slate-500">Minimum next bid: <span className="font-semibold text-slate-300">{formatEth(minimumNextBid)}</span></p>

            {!isConnected ? (
              <div className="mt-6"><WalletButton /></div>
            ) : !isCorrectNetwork ? (
              <p className="mt-6 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-3 text-sm font-semibold text-red-200">Switch to the configured network to continue.</p>
            ) : canBid ? (
              <form
                className="mt-6 space-y-3"
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  if (!bidValidationMessage) void runAction("Bid", () => actions.placeBid(auction.auctionId, bidAmount));
                }}
              >
                <label className="form-label">
                  Your bid
                  <div className="relative">
                    <input className="form-control pr-16" type="number" min="0" step="any" value={bidAmount} onChange={(event: ChangeEvent<HTMLInputElement>) => setBidAmount(event.target.value)} />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-violet-300/15 bg-violet-400/10 px-2 py-1 text-[10px] font-black text-violet-200">ETH</span>
                  </div>
                </label>
                {bidValidationMessage ? <p className="text-xs font-semibold text-red-300">{bidValidationMessage}</p> : null}
                <button type="submit" className="button-primary w-full py-3" disabled={Boolean(activeAction) || Boolean(bidValidationMessage)}>
                  {activeAction === "Bid" ? <LoadingSpinner size="sm" label="Submitting bid" /> : <BidIcon />}
                  {activeAction === "Bid" ? "Confirming bid" : "Place bid"}
                </button>
              </form>
            ) : (
              <div className="muted-panel mt-6 p-4 text-sm leading-6 text-slate-400">
                {isSeller
                  ? "You are the seller, so this wallet cannot bid on its own auction."
                  : isHighestBidder
                    ? "You are currently the highest bidder."
                    : !hasStarted
                      ? `Bidding opens ${formatDateTime(auction.startTime)}.`
                      : hasEndedByTime
                        ? "The bidding period has ended."
                        : "This auction is not accepting bids."}
              </div>
            )}
          </section>

          {(canCancel || canEnd || escrowReady) && isConnected && isCorrectNetwork ? (
            <section className="surface-card space-y-3 p-6">
              <p className="eyebrow">Available actions</p>
              {canCancel ? (
                <button type="button" className="button-secondary w-full" disabled={Boolean(activeAction)} onClick={() => void runAction("Cancellation", () => actions.cancelAuction(auction.auctionId))}>
                  {activeAction === "Cancellation" ? <LoadingSpinner size="sm" label="Cancelling" /> : null} Cancel auction
                </button>
              ) : null}
              {canEnd ? (
                <button type="button" className="button-primary w-full" disabled={Boolean(activeAction)} onClick={() => void runAction("Auction ending", () => actions.endAuction(auction.auctionId))}>
                  {activeAction === "Auction ending" ? <LoadingSpinner size="sm" label="Ending auction" /> : null} End auction
                </button>
              ) : null}
              {escrowReady ? (
                <button type="button" className="button-primary w-full" disabled={Boolean(activeAction)} onClick={() => void runAction(isSeller ? "Proceeds claim" : "Finalization", () => isSeller ? actions.claimProceeds(auction.auctionId) : actions.finalizeAuction(auction.auctionId))}>
                  {activeAction === "Proceeds claim" || activeAction === "Finalization" ? <LoadingSpinner size="sm" label="Settling escrow" /> : null}
                  {isSeller ? "Claim proceeds" : "Finalize auction"}
                </button>
              ) : null}
            </section>
          ) : null}

          {auction.status === AuctionStatus.Ended && escrow.status === PaymentStatus.Escrowed ? (
            <section className="surface-card p-6">
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-200"><LockIcon /></span><div><p className="eyebrow">Escrow</p><p className="mt-1 font-bold text-white">{formatEth(escrow.amount)} locked</p></div></div>
              <p className="mt-4 text-sm leading-6 text-slate-500">Release available {formatDateTime(escrow.releaseDeadline)}</p>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function Unavailable({ title, description }: { title: string; description: string }) {
  return <div className="space-y-6"><PageHeader eyebrow="Auction" title={title} description={description} /><StatusAlert tone="error" title="Could not open this listing">Return to the marketplace and choose another auction.</StatusAlert><Link to="/" className="button-secondary"><BackIcon /> Back to marketplace</Link></div>;
}

function Detail({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return <div className="muted-panel flex gap-3 p-4">{icon ? <span className="mt-0.5 text-violet-300">{icon}</span> : null}<div><dt className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-600">{label}</dt><dd className="mt-1 break-words text-sm font-semibold text-slate-200">{value}</dd></div></div>;
}

function BackIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m6-6-6 6 6 6"/></svg>; }
function RefreshIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6v5h-5M4 18v-5h5"/><path d="M18 9a7 7 0 0 0-12-2M6 15a7 7 0 0 0 12 2"/></svg>; }
function UserIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>; }
function CrownIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m4 7 4 4 4-7 4 7 4-4-2 11H6L4 7Z"/><path d="M7 21h10"/></svg>; }
function BidIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m5 13 6-6 6 6-6 6-6-6Z"/><path d="m13 5 2-2 6 6-2 2M3 21h12"/></svg>; }
function LockIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>; }
