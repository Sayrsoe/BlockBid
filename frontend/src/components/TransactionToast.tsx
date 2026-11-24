import type { TransactionState } from "../hooks/useContractTransaction";
import { LoadingSpinner } from "./LoadingSpinner";

interface TransactionToastProps {
  transaction: TransactionState;
  onDismiss: () => void;
}

export function TransactionToast({ transaction, onDismiss }: TransactionToastProps) {
  if (transaction.phase === "idle") {
    return null;
  }

  const isWorking =
    transaction.phase === "awaiting-signature" || transaction.phase === "pending";
  const tone =
    transaction.phase === "error"
      ? "border-red-200 bg-red-50 text-red-950"
      : transaction.phase === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-950"
        : "border-brand-200 bg-white text-slate-950";

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 w-[min(24rem,calc(100vw-2.5rem))] rounded-2xl border p-4 shadow-2xl ${tone}`}
      role={transaction.phase === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {isWorking ? (
            <LoadingSpinner label={transaction.label} />
          ) : transaction.phase === "success" ? (
            <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-600 text-sm font-bold text-white">
              ✓
            </span>
          ) : (
            <span className="grid h-6 w-6 place-items-center rounded-full bg-red-600 text-sm font-bold text-white">
              !
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold">{transaction.label}</p>
          <p className="mt-1 text-sm leading-5 opacity-80">{transaction.message}</p>
          {transaction.hash ? (
            <p className="mt-2 truncate font-mono text-xs opacity-70">{transaction.hash}</p>
          ) : null}
        </div>
        {!isWorking ? (
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm font-bold opacity-60 hover:opacity-100"
            onClick={onDismiss}
            aria-label="Dismiss transaction status"
          >
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
}
