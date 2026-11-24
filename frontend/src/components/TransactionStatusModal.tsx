import { LoadingSpinner } from "./LoadingSpinner";

type TransactionStage =
  | "idle"
  | "preparing"
  | "wallet"
  | "confirming"
  | "success"
  | "error";

interface TransactionStatusModalProps {
  stage: TransactionStage;
  error?: string | null;
  hash?: string | null;
  onClose?: () => void;
}

const stageContent: Record<Exclude<TransactionStage, "idle" | "error">, { title: string; description: string }> = {
  preparing: {
    title: "Preparing your auction",
    description: "Saving the item image and generating local metadata.",
  },
  wallet: {
    title: "Confirm in MetaMask",
    description: "Review the auction transaction in your wallet to continue.",
  },
  confirming: {
    title: "Waiting for confirmation",
    description: "Your transaction was submitted and is being confirmed on the local chain.",
  },
  success: {
    title: "Auction launched",
    description: "The auction was created successfully. Opening the listing now.",
  },
};

export type { TransactionStage };

export function TransactionStatusModal({ stage, error, hash, onClose }: TransactionStatusModalProps) {
  if (stage === "idle") return null;

  const failed = stage === "error";
  const content = failed
    ? {
        title: "Transaction failed",
        description: error || "The auction could not be created. Your form has been preserved.",
      }
    : stageContent[stage];

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/75 px-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="transaction-title">
      <div className="surface-card-strong cosmic-border relative w-full max-w-md overflow-hidden p-7 text-center sm:p-8">
        <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/20 blur-3xl" />
        <div className={`relative mx-auto grid h-16 w-16 place-items-center rounded-2xl border ${failed ? "border-red-400/20 bg-red-400/10 text-red-300" : stage === "success" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-violet-400/20 bg-violet-400/10 text-violet-200"}`}>
          {failed ? <ErrorIcon /> : stage === "success" ? <CheckIcon /> : <LoadingSpinner label={content.title} />}
        </div>

        <h2 id="transaction-title" className="relative mt-5 text-2xl font-black text-white">
          {content.title}
        </h2>
        <p className="relative mt-2 text-sm leading-6 text-slate-400">{content.description}</p>

        {hash ? (
          <div className="relative mt-5 rounded-2xl border border-white/[0.07] bg-black/25 p-3 text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Transaction hash</p>
            <p className="mt-1 break-all font-mono text-xs text-slate-300">{hash}</p>
          </div>
        ) : null}

        {failed && onClose ? (
          <button type="button" className="button-secondary relative mt-6 w-full" onClick={onClose}>
            Return to form
          </button>
        ) : null}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 8v5M12 17h.01" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}
