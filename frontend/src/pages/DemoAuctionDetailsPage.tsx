import { useState } from "react";
import { Link, useParams } from "react-router";
import { getDemoAuction } from "../demo/catalog";
import { emptyDemoState, incrementDemoBid, readDemoState, resetDemoState, saveDemoState } from "../demo/localSimulation";
export function DemoAuctionDetailsPage() {
 const { demoId } = useParams();
 const item = getDemoAuction(demoId ?? "");
 const [state, setState] = useState(() => item ? readDemoState(item.id) : emptyDemoState());
 const [message,setMessage] = useState("");
 if (!item) return <div className="surface-card p-8"><h1>Example not found</h1><Link className="button-secondary mt-5" to="/demo">Return to examples</Link></div>;
 const change = (next: typeof state) => { setState(next); saveDemoState(item.id,next); };
 return <div className="space-y-7">
  <Link to="/demo" className="button-ghost">← Demo showcase</Link>
  <div role="note" className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm"><strong>INTERACTIVE SIMULATION — NOT A REAL AUCTION.</strong> These items, sellers, bids and timers are fictitious. This page never connects a wallet, sends ETH or calls a smart contract.</div>
  <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_22rem]">
    <div className="space-y-6">
      <div className={`demo-art demo-art-${item.gradient} relative flex aspect-[16/10] items-center justify-center rounded-3xl`}><span className="demo-orb"/><span className="relative z-10 text-center text-4xl font-black text-white drop-shadow-lg">{item.title}</span></div>
      <div className="surface-card space-y-3 p-6"><p className="text-xs font-bold uppercase tracking-wider text-violet-400">{item.category}</p><h1 className="text-3xl font-black">{item.title}</h1><p className="opacity-70">{item.description}</p><p className="text-sm opacity-60">Fictitious seller: {item.seller}. This showcase does not establish ownership, provenance or delivery.</p></div>
      <div className="surface-card p-6"><h2 className="text-xl font-bold">Simulated activity</h2><p className="mt-2 text-sm opacity-70">{item.bids} fixture bids + {state.addedBids} local pretend bids. This history is not on-chain and cannot be used as proof of activity.</p></div>
    </div>
    <aside className="surface-card h-fit space-y-5 p-6"><p className="text-xs font-bold uppercase tracking-widest text-violet-400">Practice bidding</p><div><p className="text-sm opacity-65">Simulated leading bid</p><p className="mt-1 text-4xl font-black">{(item.price + state.extraEth).toFixed(2)} ETH</p></div><p className="text-sm opacity-65">{item.bids + state.addedBids} pretend bids · demo timer ~{item.endingHours}h, auto-resetting · never settles</p>
       <button type="button" className="button-primary w-full" disabled={state.addedBids >= 1000} onClick={() => { const next=incrementDemoBid(item,state); change(next); setMessage(`Simulated bid accepted locally: ${(item.price + next.extraEth).toFixed(2)} ETH. No transaction occurred.`); }}>Place pretend bid +5% (approx.)</button>
       <button type="button" className="button-secondary w-full" onClick={() => {change({...state,watched:!state.watched});setMessage(state.watched?"Removed from demo watchlist.":"Added to demo watchlist on this device.");}}>{state.watched?"♥ Unwatch example":"♡ Watch example"}</button>
       <button type="button" className="button-ghost w-full" onClick={() => {resetDemoState(item.id);setState(emptyDemoState());setMessage("Example reset on this device.");}}>Reset example</button>
       <p role="status" aria-live="polite" className="text-sm text-emerald-400">{message}</p>
       <p className="text-xs opacity-60">No wallet required. No escrow, transactions, refunds, physical products, or NFT transfers.</p>
    </aside>
  </div>
 </div>;
}
