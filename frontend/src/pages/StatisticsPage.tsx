import { useCallback, useEffect, useState } from "react";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { PageHeader } from "../components/PageHeader";
import { StatusAlert } from "../components/StatusAlert";
import {
  getFeeRecipient,
  getPlatformOverview,
  readContractError,
} from "../services/blockBidService";
import type { PlatformOverview } from "../types/blockBid";
import { shortenAddress } from "../utils/address";
import { formatBasisPoints, formatEth } from "../utils/format";

interface StatisticsData {
  overview: PlatformOverview;
  feeRecipient: string;
}

export function StatisticsPage() {
  const [data, setData] = useState<StatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatistics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [overview, feeRecipient] = await Promise.all([
        getPlatformOverview(),
        getFeeRecipient(),
      ]);
      setData({ overview, feeRecipient });
    } catch (loadError) {
      setError(readContractError(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatistics();
  }, [loadStatistics]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Analytics"
        title="Marketplace statistics"
        description="A live client-side summary built only from BlockBid contract reads and bid histories."
        action={
          <button
            type="button"
            className="button-secondary"
            onClick={() => void loadStatistics()}
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner size="sm" label="Refreshing" /> : null}
            Refresh
          </button>
        }
      />

      {error ? (
        <StatusAlert tone="error" title="Could not load statistics">
          {error}
        </StatusAlert>
      ) : null}

      {isLoading && !data ? (
        <div className="surface-card grid min-h-64 place-items-center p-8 text-theme-muted">
          <LoadingSpinner label="Reading marketplace activity" />
        </div>
      ) : data ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Total auctions" value={String(data.overview.totalAuctions)} />
            <MetricCard label="Active auctions" value={String(data.overview.activeAuctions)} />
            <MetricCard label="Ended auctions" value={String(data.overview.endedAuctions)} />
            <MetricCard label="Total users" value={String(data.overview.totalUsers)} />
            <MetricCard
              label="Platform fee"
              value={formatBasisPoints(data.overview.platformFeeBps)}
            />
          </section>

          <section className="surface-card p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-theme-accent">
                  Activity overview
                </p>
                <h2 className="mt-2 text-2xl font-black text-theme-primary">
                  Contract-derived marketplace health
                </h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <OverviewRow label="Scheduled auctions" value={data.overview.pendingAuctions} />
                  <OverviewRow label="Cancelled auctions" value={data.overview.cancelledAuctions} />
                  <OverviewRow label="Total bids" value={data.overview.totalBids} />
                  <OverviewRow
                    label="Settled auction volume"
                    value={formatEth(data.overview.totalVolume)}
                  />
                </div>
              </div>

              <div className="rounded-3xl bg-ink-900 p-6 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-300">
                  Platform configuration
                </p>
                <dl className="mt-5 space-y-5">
                  <ConfigRow
                    label="Contract state"
                    value={data.overview.paused ? "Paused" : "Operational"}
                  />
                  <ConfigRow
                    label="Fee rate"
                    value={formatBasisPoints(data.overview.platformFeeBps)}
                  />
                  <ConfigRow
                    label="Fee recipient"
                    value={shortenAddress(data.feeRecipient, 6)}
                  />
                </dl>
              </div>
            </div>
          </section>

          <StatusAlert tone="info" title="How these statistics are calculated">
            The deployed MVP statistics getters are intentionally deferred, so this page derives totals by reading every existing auction and its on-chain bid history. No placeholder records are used.
          </StatusAlert>
        </>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-5">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-theme-muted">{label}</p>
      <p className="mt-3 text-3xl font-black text-theme-primary">{value}</p>
    </div>
  );
}

function OverviewRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <p className="text-sm text-theme-muted">{label}</p>
      <p className="mt-2 text-xl font-black text-theme-primary">{value}</p>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 font-bold text-white">{value}</dd>
    </div>
  );
}
