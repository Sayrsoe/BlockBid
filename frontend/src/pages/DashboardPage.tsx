import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AuctionCard } from "../components/AuctionCard";
import { EmptyState } from "../components/EmptyState";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { PageHeader } from "../components/PageHeader";
import { StatusAlert } from "../components/StatusAlert";
import { WalletButton } from "../components/WalletButton";
import { useBlockBid } from "../hooks/useBlockBid";
import { useWallet } from "../hooks/useWallet";
import {
  getAuctionsByBidder,
  getAuctionsByIds,
  getAuctionsBySeller,
  getPendingRefund,
  readContractError,
} from "../services/blockBidService";
import { AuctionStatus, type Auction } from "../types/blockBid";
import { formatEth } from "../utils/format";
import { shortenAddress } from "../utils/address";

interface DashboardData {
  sellerAuctions: Auction[];
  bidAuctions: Auction[];
  pendingRefund: bigint;
}

type DashboardTab = "selling" | "bidding";

export function DashboardPage() {
  const { account, isConnected, isCorrectNetwork } = useWallet();
  const { claimRefund } = useBlockBid();
  const [data, setData] = useState<DashboardData | null>(null);
  const [tab, setTab] = useState<DashboardTab>("selling");
  const [isLoading, setIsLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!account) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [sellerIds, bidderIds, pendingRefund] = await Promise.all([
        getAuctionsBySeller(account),
        getAuctionsByBidder(account),
        getPendingRefund(account),
      ]);
      const [sellerAuctions, bidAuctions] = await Promise.all([
        getAuctionsByIds(sellerIds),
        getAuctionsByIds(bidderIds),
      ]);

      setData({
        sellerAuctions: sellerAuctions.sort((left, right) => Number(right.auctionId - left.auctionId)),
        bidAuctions: bidAuctions.sort((left, right) => Number(right.auctionId - left.auctionId)),
        pendingRefund,
      });
    } catch (loadError) {
      setError(readContractError(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  async function handleClaimRefund() {
    setIsClaiming(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await claimRefund();
      setSuccess(`Refund claimed · ${result.hash}`);
      await loadDashboard();
    } catch (claimError) {
      setError(readContractError(claimError));
    } finally {
      setIsClaiming(false);
    }
  }

  const stats = useMemo(() => {
    const sellerAuctions = data?.sellerAuctions ?? [];
    const bidAuctions = data?.bidAuctions ?? [];
    const normalizedAccount = account?.toLowerCase();

    return {
      listings: sellerAuctions.length,
      activeBids: bidAuctions.filter((auction) => auction.status === AuctionStatus.Active).length,
      won: bidAuctions.filter(
        (auction) =>
          auction.highestBidder.toLowerCase() === normalizedAccount &&
          [AuctionStatus.Ended, AuctionStatus.Finalized].includes(auction.status),
      ).length,
      claims: sellerAuctions.filter(
        (auction) => auction.status === AuctionStatus.Ended && !auction.sellerClaimed,
      ).length,
    };
  }, [account, data]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Wallet command center"
        title="Dashboard"
        description={account ? `On-chain activity for ${shortenAddress(account, 6)}.` : "Connect MetaMask to load your auctions, bids, refunds, and seller activity."}
        action={account ? <button type="button" className="button-secondary" onClick={() => void loadDashboard()} disabled={isLoading}>{isLoading ? <LoadingSpinner size="sm" label="Refreshing" /> : <RefreshIcon />} Refresh</button> : undefined}
      />

      {!isConnected ? (
        <EmptyState
          icon={<DashboardIcon />}
          title="Your dashboard is wallet-based"
          description="BlockBid uses the connected address instead of usernames and passwords. Connect MetaMask to enter your command center."
          action={<WalletButton />}
        />
      ) : (
        <>
          {error ? <StatusAlert tone="error" title="Dashboard request failed">{error}</StatusAlert> : null}
          {success ? <StatusAlert tone="success" title="Transaction confirmed">{success}</StatusAlert> : null}

          <section className="surface-card-strong cosmic-border relative overflow-hidden p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-500/18 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-violet-300/15 bg-violet-500/10 text-violet-200"><WalletIcon /></span>
                  <div><p className="eyebrow">Connected identity</p><p className="mt-1 font-mono text-sm font-semibold text-slate-200">{account}</p></div>
                </div>
                <p className="mt-5 max-w-xl text-sm leading-6 text-slate-400">Every card and balance here is resolved from your address and the deployed marketplace contract.</p>
              </div>

              <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.055] p-5 lg:min-w-72">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">Pending refund</p>
                <p className="mt-2 text-3xl font-black text-white">{data ? formatEth(data.pendingRefund) : "—"}</p>
                <button
                  type="button"
                  className="button-primary mt-4 w-full"
                  disabled={isLoading || isClaiming || !isCorrectNetwork || !data || data.pendingRefund === 0n}
                  onClick={() => void handleClaimRefund()}
                >
                  {isClaiming ? <LoadingSpinner size="sm" label="Claiming refund" /> : <RefundIcon />}
                  {isClaiming ? "Claiming" : "Claim refund"}
                </button>
              </div>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="My listings" value={stats.listings} icon={<ListingIcon />} accent="violet" />
            <SummaryCard label="Active bids" value={stats.activeBids} icon={<BidIcon />} accent="cyan" />
            <SummaryCard label="Auctions won" value={stats.won} icon={<TrophyIcon />} accent="emerald" />
            <SummaryCard label="Seller claims" value={stats.claims} icon={<ClaimIcon />} accent="amber" />
          </section>

          {isLoading && !data ? (
            <div className="surface-card grid min-h-56 place-items-center p-8 text-slate-400"><LoadingSpinner label="Loading dashboard" /></div>
          ) : (
            <section className="space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div><p className="eyebrow">Portfolio</p><h2 className="mt-2 text-2xl font-black text-white">Your auction activity</h2><p className="mt-2 text-sm text-slate-500">Open a listing to bid, cancel, end, finalize, or claim proceeds when eligible.</p></div>
                <div className="inline-flex rounded-2xl border border-white/[0.07] bg-white/[0.025] p-1">
                  <TabButton active={tab === "selling"} onClick={() => setTab("selling")}>Selling <span>{data?.sellerAuctions.length ?? 0}</span></TabButton>
                  <TabButton active={tab === "bidding"} onClick={() => setTab("bidding")}>Bidding <span>{data?.bidAuctions.length ?? 0}</span></TabButton>
                </div>
              </div>

              <AuctionSection
                auctions={tab === "selling" ? data?.sellerAuctions ?? [] : data?.bidAuctions ?? []}
                emptyTitle={tab === "selling" ? "No listings launched yet" : "No bids in orbit yet"}
                emptyMessage={tab === "selling" ? "Create your first auction and it will appear here." : "Place a bid in the marketplace and the auction will appear here."}
              />
            </section>
          )}
        </>
      )}
    </div>
  );
}

function AuctionSection({ auctions, emptyTitle, emptyMessage }: { auctions: Auction[]; emptyTitle: string; emptyMessage: string }) {
  return auctions.length === 0 ? (
    <div className="surface-card p-8 text-center"><p className="font-bold text-white">{emptyTitle}</p><p className="mt-2 text-sm text-slate-500">{emptyMessage}</p></div>
  ) : (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{auctions.map((auction) => <AuctionCard key={auction.auctionId.toString()} auction={auction} />)}</div>
  );
}

function SummaryCard({ label, value, icon, accent }: { label: string; value: number; icon: ReactNode; accent: "violet" | "cyan" | "emerald" | "amber" }) {
  const accentClasses = {
    violet: "border-violet-300/15 bg-violet-500/10 text-violet-200",
    cyan: "border-cyan-300/15 bg-cyan-400/10 text-cyan-200",
    emerald: "border-emerald-300/15 bg-emerald-400/10 text-emerald-200",
    amber: "border-amber-300/15 bg-amber-400/10 text-amber-200",
  }[accent];
  return <div className="surface-card flex items-center gap-4 p-5"><span className={`grid h-11 w-11 place-items-center rounded-xl border ${accentClasses}`}>{icon}</span><div><p className="text-2xl font-black text-white">{value}</p><p className="text-xs font-semibold text-slate-500">{label}</p></div></div>;
}

function TabButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return <button type="button" className={`rounded-xl px-4 py-2 text-sm font-bold transition ${active ? "bg-violet-500 text-white shadow-glow" : "text-slate-500 hover:text-white"}`} onClick={onClick}>{children}</button>;
}

function RefreshIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6v5h-5M4 18v-5h5"/><path d="M18 9a7 7 0 0 0-12-2M6 15a7 7 0 0 0 12 2"/></svg>; }
function DashboardIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>; }
function WalletIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7.5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3v-10a3 3 0 0 1 3-3h11"/><path d="M16 11.5h5v4h-5a2 2 0 1 1 0-4Z"/></svg>; }
function RefundIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7v5h5"/><path d="M6 18a8 8 0 1 0-2-6"/><path d="M12 7v10m3-7.5c0-1.2-1.3-2-3-2s-3 .8-3 2 1.3 2 3 2 3 .8 3 2-1.3 2-3 2-3-.8-3-2"/></svg>; }
function ListingIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 3h11l3 3v15H5V3Z"/><path d="M8 11h8M8 15h6M15 3v4h4"/></svg>; }
function BidIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m5 13 6-6 6 6-6 6-6-6Z"/><path d="m13 5 2-2 6 6-2 2M3 21h12"/></svg>; }
function TrophyIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 4h8v4a4 4 0 0 1-8 0V4Z"/><path d="M8 6H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4M12 12v5m-4 4h8m-6-4h4"/></svg>; }
function ClaimIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M5 19h14"/></svg>; }
