import { isAddress, ZeroAddress } from "ethers";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { PageHeader } from "../components/PageHeader";
import { StatusAlert } from "../components/StatusAlert";
import { TransactionToast } from "../components/TransactionToast";
import { WalletButton } from "../components/WalletButton";
import { useBlockBid } from "../hooks/useBlockBid";
import { useContractTransaction } from "../hooks/useContractTransaction";
import { useWallet } from "../hooks/useWallet";
import {
  getContractOwner,
  getFeeRecipient,
  getPlatformFeeBps,
  isContractPaused,
  readContractError,
} from "../services/blockBidService";
import type { TransactionCallbacks, TransactionResult } from "../types/blockBid";
import { shortenAddress } from "../utils/address";
import { formatBasisPoints } from "../utils/format";

interface AdminData {
  owner: string;
  feeRecipient: string;
  platformFeeBps: number;
  paused: boolean;
}

export function AdminPage() {
  const { account, isConnected, isCorrectNetwork, switchNetwork } = useWallet();
  const actions = useBlockBid();
  const { transaction, run, reset } = useContractTransaction();
  const [data, setData] = useState<AdminData | null>(null);
  const [feePercent, setFeePercent] = useState("");
  const [feeRecipient, setFeeRecipient] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [renouncePhrase, setRenouncePhrase] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const transactionBusy =
    transaction.phase === "awaiting-signature" || transaction.phase === "pending";

  const loadAdmin = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [owner, recipient, platformFeeBps, paused] = await Promise.all([
        getContractOwner(),
        getFeeRecipient(),
        getPlatformFeeBps(),
        isContractPaused(),
      ]);
      setData({ owner, feeRecipient: recipient, platformFeeBps, paused });
      setFeePercent((platformFeeBps / 100).toString());
      setFeeRecipient(recipient);
    } catch (loadError) {
      setError(readContractError(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAdmin();
  }, [loadAdmin]);

  async function runAdminAction(
    label: string,
    action: (callbacks: TransactionCallbacks) => Promise<TransactionResult>,
  ) {
    setError(null);
    const result = await run(label, (onSubmitted) => action({ onSubmitted }));
    if (result) {
      setRenouncePhrase("");
      setNewOwner("");
      await loadAdmin();
    }
  }

  function submitFee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = Number(feePercent);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 10) {
      setError("Platform fee must be between 0% and 10%.");
      return;
    }

    const feeBps = Math.round(parsed * 100);
    void runAdminAction("Update platform fee", (callbacks) =>
      actions.setPlatformFee(feeBps, callbacks),
    );
  }

  function submitRecipient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAddress(feeRecipient) || feeRecipient === ZeroAddress) {
      setError("Enter a valid non-zero fee recipient address.");
      return;
    }

    void runAdminAction("Update fee recipient", (callbacks) =>
      actions.setFeeRecipient(feeRecipient, callbacks),
    );
  }

  function submitOwner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAddress(newOwner) || newOwner === ZeroAddress) {
      setError("Enter a valid non-zero owner address.");
      return;
    }

    void runAdminAction("Transfer ownership", (callbacks) =>
      actions.transferMarketplaceOwnership(newOwner, callbacks),
    );
  }

  const isOwner =
    Boolean(account && data) && account!.toLowerCase() === data!.owner.toLowerCase();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Contract administration"
        title="Marketplace controls"
        description="Owner-only controls for the deployed BlockBidMarketplace contract."
        action={
          <button
            type="button"
            className="button-secondary"
            onClick={() => void loadAdmin()}
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner size="sm" label="Refreshing" /> : null}
            Refresh
          </button>
        }
      />

      {error ? (
        <StatusAlert tone="error" title="Admin request failed">
          {error}
        </StatusAlert>
      ) : null}

      {isLoading && !data ? (
        <div className="surface-card grid min-h-64 place-items-center p-8 text-theme-muted">
          <LoadingSpinner label="Reading contract configuration" />
        </div>
      ) : data ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AdminMetric label="Owner" value={shortenAddress(data.owner, 6)} />
            <AdminMetric label="Fee recipient" value={shortenAddress(data.feeRecipient, 6)} />
            <AdminMetric label="Platform fee" value={formatBasisPoints(data.platformFeeBps)} />
            <AdminMetric label="Contract state" value={data.paused ? "Paused" : "Operational"} />
          </section>

          {!isConnected ? (
            <StatusAlert
              tone="info"
              title="Connect the owner wallet"
              action={<WalletButton />}
            >
              Configuration is readable without a wallet, but updates require the current contract owner.
            </StatusAlert>
          ) : !isCorrectNetwork ? (
            <StatusAlert
              tone="error"
              title="Wrong network"
              action={
                <button
                  type="button"
                  className="button-primary"
                  onClick={() => void switchNetwork()}
                >
                  Switch network
                </button>
              }
            >
              Switch MetaMask before submitting an owner transaction.
            </StatusAlert>
          ) : !isOwner ? (
            <StatusAlert tone="error" title="Connected wallet is not the owner">
              The owner is {data.owner}. Connect that wallet to use these controls.
            </StatusAlert>
          ) : (
            <>
              <section className="grid gap-6 lg:grid-cols-2">
                <form className="surface-card space-y-5 p-6 sm:p-8" onSubmit={submitFee}>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-theme-accent">
                      Platform economics
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-theme-primary">Platform fee</h2>
                    <p className="mt-2 text-sm leading-6 text-theme-muted">
                      Enter a percentage. The contract stores the value in basis points and enforces a 10% maximum.
                    </p>
                  </div>
                  <label className="form-label">
                    Fee percentage
                    <div className="relative">
                      <input
                        className="form-control pr-12"
                        type="number"
                        min="0"
                        max="10"
                        step="0.01"
                        value={feePercent}
                        onChange={(event) => setFeePercent(event.target.value)}
                        required
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-sm font-bold text-theme-muted">
                        %
                      </span>
                    </div>
                  </label>
                  <button type="submit" className="button-primary" disabled={transactionBusy}>
                    Save platform fee
                  </button>
                </form>

                <form className="surface-card space-y-5 p-6 sm:p-8" onSubmit={submitRecipient}>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-theme-accent">
                      Fee destination
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-theme-primary">Fee recipient</h2>
                    <p className="mt-2 text-sm leading-6 text-theme-muted">
                      Finalized auction fees are transferred to this address.
                    </p>
                  </div>
                  <label className="form-label">
                    Recipient address
                    <input
                      className="form-control font-mono"
                      value={feeRecipient}
                      onChange={(event) => setFeeRecipient(event.target.value.trim())}
                      required
                    />
                  </label>
                  <button type="submit" className="button-primary" disabled={transactionBusy}>
                    Save fee recipient
                  </button>
                </form>
              </section>

              <section className="surface-card p-6 sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-theme-accent">
                      Operational state
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-theme-primary">
                      {data.paused ? "Marketplace is paused" : "Marketplace is operational"}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-theme-muted">
                      Pausing blocks auction creation, bidding, cancellation, and metadata edits. Refund claims remain available.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={data.paused ? "button-primary" : "button-secondary"}
                    disabled={transactionBusy}
                    onClick={() =>
                      void runAdminAction(
                        data.paused ? "Unpause marketplace" : "Pause marketplace",
                        (callbacks) =>
                          data.paused
                            ? actions.unpauseMarketplace(callbacks)
                            : actions.pauseMarketplace(callbacks),
                      )
                    }
                  >
                    {data.paused ? "Unpause marketplace" : "Pause marketplace"}
                  </button>
                </div>
              </section>

              <section className="surface-card border-red-200 p-6 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
                  Ownership
                </p>
                <div className="mt-5 grid gap-8 lg:grid-cols-2">
                  <form className="space-y-4" onSubmit={submitOwner}>
                    <div>
                      <h2 className="text-xl font-bold text-theme-primary">Transfer ownership</h2>
                      <p className="mt-2 text-sm leading-6 text-theme-muted">
                        The new owner immediately receives all owner-only permissions.
                      </p>
                    </div>
                    <label className="form-label">
                      New owner address
                      <input
                        className="form-control font-mono"
                        value={newOwner}
                        onChange={(event) => setNewOwner(event.target.value.trim())}
                        placeholder="0x..."
                        required
                      />
                    </label>
                    <button type="submit" className="button-secondary" disabled={transactionBusy}>
                      Transfer ownership
                    </button>
                  </form>

                  <div className="space-y-4 rounded-2xl bg-red-50 p-5">
                    <div>
                      <h2 className="text-xl font-bold text-red-950">Renounce ownership</h2>
                      <p className="mt-2 text-sm leading-6 text-red-800">
                        This permanently removes all owner-only administration. Type RENOUNCE to enable the transaction.
                      </p>
                    </div>
                    <label className="form-label text-red-900">
                      Confirmation phrase
                      <input
                        className="form-control border-red-200"
                        value={renouncePhrase}
                        onChange={(event) => setRenouncePhrase(event.target.value)}
                        placeholder="RENOUNCE"
                      />
                    </label>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={transactionBusy || renouncePhrase !== "RENOUNCE"}
                      onClick={() =>
                        void runAdminAction("Renounce ownership", (callbacks) =>
                          actions.renounceMarketplaceOwnership(callbacks),
                        )
                      }
                    >
                      Renounce ownership permanently
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}
        </>
      ) : null}

      <TransactionToast transaction={transaction} onDismiss={reset} />
    </div>
  );
}

function AdminMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-5">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-theme-muted">{label}</p>
      <p className="mt-3 break-all font-bold text-theme-primary">{value}</p>
    </div>
  );
}
