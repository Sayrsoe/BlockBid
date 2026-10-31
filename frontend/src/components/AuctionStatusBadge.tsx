import { AuctionStatus, AUCTION_STATUS_LABELS } from "../types/blockBid";

const statusClasses: Record<AuctionStatus, string> = {
  [AuctionStatus.Created]: "border-slate-400/20 bg-slate-400/10 text-slate-300",
  [AuctionStatus.Active]: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  [AuctionStatus.Ended]: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  [AuctionStatus.Finalized]: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  [AuctionStatus.Cancelled]: "border-slate-400/20 bg-slate-400/10 text-slate-400",
  [AuctionStatus.Disputed]: "border-red-400/20 bg-red-400/10 text-red-300",
};

export function AuctionStatusBadge({ status }: { status: AuctionStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${statusClasses[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
      {AUCTION_STATUS_LABELS[status]}
    </span>
  );
}
