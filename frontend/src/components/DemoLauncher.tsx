import { useEffect, useState } from "react";
import { Link } from "react-router";

type Panel = "demo" | "tutorial";
const steps = [
  { title: "Discover", detail: "Explore 24 fictional listings. Search, select a category and sort the results to practice finding an auction." },
  { title: "Inspect", detail: "Open a demo item to see its description, pretend price, seller, timer and simulated activity." },
  { title: "Practice a bid", detail: "Place a pretend bid. It only updates this browser's local simulation; no ETH, wallet, gas or contract is involved." },
  { title: "Watch and reset", detail: "Save a demo item to the local watchlist, then use Reset example to start over. Exit Demo at any time." },
];

export function DemoLauncher({ label = "Try Demo" }: { label?: string }) {
  const [panel, setPanel] = useState<Panel | null>(null);
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!panel) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setPanel(null); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [panel]);
  const open = (next: Panel) => { setStep(0); setPanel(next); };
  return <>
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className="button-secondary px-4 py-2" onClick={() => open("demo")}>{label}</button>
      <button type="button" className="button-ghost px-3 py-2" onClick={() => open("tutorial")}>Watch Tutorial</button>
    </div>
    {panel && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setPanel(null); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="demo-dialog-title" className="surface-card-strong w-full max-w-lg space-y-5 rounded-3xl border border-violet-400/20 p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-violet-400">BlockBid interactive demo</p><h2 id="demo-dialog-title" className="mt-2 text-2xl font-black">{panel === "demo" ? "Explore without risk" : "How BlockBid works"}</h2></div><button type="button" aria-label="Close demo popup" onClick={() => setPanel(null)} className="button-ghost px-3 py-2">✕</button></div>
        {panel === "demo" ? <><p className="opacity-80">Try 24 sample auctions with searching, filtering, favorites and pretend bids. All listings, prices, timers and sellers are fictional.</p><p className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm"><strong>Simulation only:</strong> no wallet, transaction, ETH, escrow or real asset.</p><Link to="/demo" onClick={() => setPanel(null)} className="button-primary flex w-full justify-center px-5 py-3">Enter Demo Marketplace →</Link><button type="button" className="button-ghost w-full" onClick={() => open("tutorial")}>View 4-step tutorial</button></> : <><p className="text-xs uppercase tracking-widest opacity-60">Step {step+1} of {steps.length}</p><div className="rounded-xl border border-violet-300/20 bg-violet-400/10 p-5"><h3 className="text-xl font-bold">{steps[step].title}</h3><p className="mt-3 leading-7 opacity-80">{steps[step].detail}</p></div><div className="flex flex-wrap gap-3"><button type="button" className="button-secondary px-5 py-2" disabled={step===0} onClick={() => setStep(n=>Math.max(0,n-1))}>Back</button>{step<steps.length-1?<button type="button" className="button-primary flex-1 px-5 py-2" onClick={() => setStep(n=>Math.min(steps.length-1,n+1))}>Next →</button>:<Link to="/demo" onClick={()=>setPanel(null)} className="button-primary flex-1 px-5 py-2 text-center">Practice now →</Link>}</div></>}
      </section>
    </div>}
  </>;
}
