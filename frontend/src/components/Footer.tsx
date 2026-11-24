import { hasVerifiedDeployment } from "../contracts/contractConfig";

export function Footer() {
  return (
    <footer className="mt-10 border-t border-white/[0.07] bg-black/15">
      <div className="app-container flex flex-col gap-3 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-slate-300">© {new Date().getFullYear()} BlockBid</p>
          <p className="mt-1 text-xs">Local test marketplace · Listing metadata does not establish asset custody or delivery.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400">
          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${hasVerifiedDeployment ? "bg-emerald-400" : "bg-amber-400"}`} />
          {hasVerifiedDeployment ? "Verified local deployment" : "Frontend preview"}
        </div>
      </div>
    </footer>
  );
}
