import { Link } from "react-router";
import type { DemoAuction } from "../demo/catalog";
import { readDemoState } from "../demo/localSimulation";
export function DemoAuctionCard({ item }: { item: DemoAuction }) {
 const state = readDemoState(item.id);
 return <article className="surface-card group overflow-hidden transition-transform hover:-translate-y-1">
   <Link to={`/demo/${item.id}`} aria-label={`View simulated auction: ${item.title}`} className={`demo-art demo-art-${item.gradient} relative flex aspect-[16/10] items-center justify-center overflow-hidden`}>
     <span className="demo-orb" aria-hidden="true" />
     <span className="absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white">SIMULATED · NO ETH</span>
     <span className="relative z-10 max-w-[80%] text-center text-2xl font-black tracking-tight text-white/90 drop-shadow-lg">{item.title}</span>
   </Link>
   <div className="space-y-3 p-5">
     <p className="text-xs font-bold uppercase tracking-widest text-violet-400">{item.category}</p>
     <h3 className="text-lg font-bold">{item.title}</h3>
     <p className="min-h-10 text-sm opacity-65">{item.description}</p>
     <div className="flex justify-between gap-3 text-sm"><span>Demo bid: <strong>{(item.price + state.extraEth).toFixed(2)} ETH</strong></span><span>{item.bids + state.addedBids} bids</span></div>
     <div className="flex items-center justify-between gap-2 text-xs opacity-60"><span>Ends in ~{item.endingHours}h (looping)</span><span>{state.watched ? "♥ Watching" : "Showcase item"}</span></div>
     <Link className="button-secondary w-full" to={`/demo/${item.id}`}>Try demo auction →</Link>
   </div>
 </article>;
}
