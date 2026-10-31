import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Link } from "react-router";
import { DemoLauncher } from "../components/DemoLauncher";
import { AuctionCard } from "../components/AuctionCard";
import { EmptyState } from "../components/EmptyState";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { PageHeader } from "../components/PageHeader";
import { StatusAlert } from "../components/StatusAlert";
import { getAllAuctions, readContractError } from "../services/blockBidService";
import {
  AUCTION_CATEGORY_LABELS,
  AuctionCategory,
  AuctionStatus,
  type Auction,
  type AuctionMetadata,
} from "../types/blockBid";
import { loadAuctionMetadata, metadataTitle } from "../utils/metadata";

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: String(AuctionStatus.Active), label: "Active" },
  { value: String(AuctionStatus.Ended), label: "Ended" },
  { value: String(AuctionStatus.Finalized), label: "Finalized" },
  { value: String(AuctionStatus.Cancelled), label: "Cancelled" },
] as const;

type SortOption = "newest" | "ending" | "highest" | "bids";

export function MarketplacePage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [metadata, setMetadata] = useState<Record<string, AuctionMetadata | null>>({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAuctions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const values = await getAllAuctions();
      const sorted = values.sort((left, right) => Number(right.auctionId - left.auctionId));
      setAuctions(sorted);

      const entries = await Promise.all(
        sorted.map(async (auction) => [auction.auctionId.toString(), await loadAuctionMetadata(auction.metadataURI)] as const),
      );
      setMetadata(Object.fromEntries(entries));
    } catch (loadError) {
      setError(readContractError(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAuctions();
  }, [loadAuctions]);

  const now = Date.now();
  const activeCount = auctions.filter(
    (auction) => auction.status === AuctionStatus.Active && Number(auction.endTime) * 1_000 > now,
  ).length;
  const totalBids = auctions.reduce((sum, auction) => sum + auction.totalBids, 0);
  const finalizedCount = auctions.filter((auction) => auction.status === AuctionStatus.Finalized).length;

  const filteredAuctions = useMemo(() => {
    const query = search.trim().toLowerCase();
    const values = auctions.filter((auction) => {
      const itemMetadata = metadata[auction.auctionId.toString()] ?? null;
      const searchable = [
        metadataTitle(itemMetadata, auction.auctionId),
        itemMetadata?.description,
        AUCTION_CATEGORY_LABELS[auction.category],
        auction.seller,
        auction.auctionId.toString(),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesStatus = statusFilter === "all" || auction.status === Number(statusFilter);
      const matchesCategory = categoryFilter === "all" || auction.category === Number(categoryFilter);
      return matchesSearch && matchesStatus && matchesCategory;
    });

    return values.sort((left, right) => {
      if (sort === "ending") return Number(left.endTime - right.endTime);
      if (sort === "highest") {
        const leftValue = left.currentHighestBid > 0n ? left.currentHighestBid : left.startingPrice;
        const rightValue = right.currentHighestBid > 0n ? right.currentHighestBid : right.startingPrice;
        return leftValue === rightValue ? 0 : leftValue > rightValue ? -1 : 1;
      }
      if (sort === "bids") return right.totalBids - left.totalBids;
      return Number(right.auctionId - left.auctionId);
    });
  }, [auctions, categoryFilter, metadata, search, sort, statusFilter]);

  return (
    <div className="space-y-12">
      <section className="surface-card-strong cosmic-border relative overflow-hidden px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
        <div className="pointer-events-none absolute inset-0 galaxy-grid opacity-45" />
        <div className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-violet-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-36 left-1/3 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute right-[12%] top-1/2 hidden h-56 w-56 -translate-y-1/2 rounded-full border border-violet-200/10 lg:block">
          <div className="absolute inset-5 rounded-full border border-cyan-200/10" />
          <div className="absolute inset-12 rounded-full bg-gradient-to-br from-violet-500/25 to-cyan-400/10 blur-sm" />
          <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_35px_rgba(255,255,255,.85)]" />
          <div className="absolute -left-2 top-1/2 h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_20px_rgba(103,232,249,.9)]" />
        </div>

        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/15 bg-violet-500/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-200">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,.8)]" />
            Trustless bidding · Transparent settlement
          </div>
          <h1 className="mt-5 max-w-2xl bg-gradient-to-r from-white via-violet-100 to-cyan-200 bg-clip-text text-4xl font-black tracking-[-0.04em] text-transparent sm:text-5xl lg:text-6xl">
            Auctions across the digital universe.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            Create listings, bid with local ETH, recover outbid funds, and settle every winner through transparent smart-contract logic.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <DemoLauncher label="Try Interactive Demo" />
            <Link to="/create" className="button-primary px-5 py-3">
              <RocketIcon /> Create auction
            </Link>
            <Link to="/dashboard" className="button-secondary px-5 py-3">
              Open dashboard <ArrowIcon />
            </Link>
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            <HeroStat label="Auctions" value={String(auctions.length)} />
            <HeroStat label="Live now" value={String(activeCount)} />
            <HeroStat label="Total bids" value={String(totalBids)} />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <PageHeader
          eyebrow="Marketplace"
          title="Explore on-chain auctions"
          description="Every listing below is read directly from the deployed BlockBidMarketplace contract."
          action={
            <button type="button" className="button-secondary" onClick={() => void loadAuctions()} disabled={isLoading}>
              {isLoading ? <LoadingSpinner size="sm" label="Refreshing" /> : <RefreshIcon />}
              Refresh
            </button>
          }
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard label="Active auctions" value={String(activeCount)} accent="violet" />
          <MetricCard label="Finalized sales" value={String(finalizedCount)} accent="cyan" />
          <MetricCard label="Recorded bids" value={String(totalBids)} accent="emerald" />
        </div>

        <div className="surface-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,.7fr))] sm:p-5">
          <label className="form-label">
            Search
            <div className="relative">
              <SearchIcon />
              <input
                className="form-control pl-10"
                value={search}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
                placeholder="Title, description, seller, or ID"
              />
            </div>
          </label>

          <label className="form-label">
            Status
            <select className="form-control" value={statusFilter} onChange={(event: ChangeEvent<HTMLSelectElement>) => setStatusFilter(event.target.value)}>
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>

          <label className="form-label">
            Category
            <select className="form-control" value={categoryFilter} onChange={(event: ChangeEvent<HTMLSelectElement>) => setCategoryFilter(event.target.value)}>
              <option value="all">All categories</option>
              {Object.values(AuctionCategory)
                .filter((value): value is number => typeof value === "number")
                .map((value) => <option key={value} value={value}>{AUCTION_CATEGORY_LABELS[value as AuctionCategory]}</option>)}
            </select>
          </label>

          <label className="form-label">
            Sort
            <select className="form-control" value={sort} onChange={(event: ChangeEvent<HTMLSelectElement>) => setSort(event.target.value as SortOption)}>
              <option value="newest">Newest</option>
              <option value="ending">Ending soon</option>
              <option value="highest">Highest bid</option>
              <option value="bids">Most bids</option>
            </select>
          </label>
        </div>

        {error ? <StatusAlert tone="error" title="Could not load the marketplace">{error}</StatusAlert> : null}

        {isLoading ? (
          <AuctionSkeletons />
        ) : filteredAuctions.length === 0 ? (
          <EmptyState
            icon={<AuctionIcon />}
            title={auctions.length === 0 ? "No auctions in this galaxy yet" : "No matching auctions found"}
            description={auctions.length === 0 ? "Create the first listing and launch it onto the local blockchain." : "Try a different search, category, status, or sorting option."}
            action={<Link to="/create" className="button-primary">Create the first auction</Link>}
          />
        ) : (
          <>
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{filteredAuctions.length} result{filteredAuctions.length === 1 ? "" : "s"}</span>
              {(search || statusFilter !== "all" || categoryFilter !== "all") ? (
                <button type="button" className="button-ghost px-2 py-1 text-xs" onClick={() => { setSearch(""); setStatusFilter("all"); setCategoryFilter("all"); }}>
                  Clear filters
                </button>
              ) : null}
            </div>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredAuctions.map((auction) => (
                <AuctionCard key={auction.auctionId.toString()} auction={auction} metadata={metadata[auction.auctionId.toString()] ?? null} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] px-3 py-3 backdrop-blur"><p className="text-xl font-black text-white sm:text-2xl">{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p></div>;
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent: "violet" | "cyan" | "emerald" }) {
  const classes = { violet: "from-violet-500/16 text-violet-200", cyan: "from-cyan-400/12 text-cyan-200", emerald: "from-emerald-400/12 text-emerald-200" }[accent];
  return <div className={`surface-card bg-gradient-to-br ${classes} to-transparent p-5`}><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-white">{value}</p></div>;
}

function AuctionSkeletons() {
  return <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{[0,1,2,3,4,5].map((value) => <div key={value} className="surface-card overflow-hidden"><div className="skeleton aspect-[16/10]"/><div className="space-y-4 p-5"><div className="skeleton h-3 w-24 rounded"/><div className="skeleton h-6 w-2/3 rounded"/><div className="skeleton h-16 rounded-2xl"/><div className="skeleton h-10 rounded-xl"/></div></div>)}</div>;
}

function SearchIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>; }
function RefreshIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6v5h-5M4 18v-5h5"/><path d="M18 9a7 7 0 0 0-12-2M6 15a7 7 0 0 0 12 2"/></svg>; }
function RocketIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 5c2.5-2.5 5.5-2 5.5-2s.5 3-2 5.5l-4 4-4-4 4.5-3.5Z"/><path d="m9.5 8.5-4 .5-2 2 5 1m4 4 .5 4 2-2 1-5m-8 1-2 2"/></svg>; }
function ArrowIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>; }
function AuctionIcon() { return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m4 15 5-5m1-1 4-4 5 5-4 4m-7-3 5 5"/><path d="M4 20h12M14 17l5 5"/></svg>; }
