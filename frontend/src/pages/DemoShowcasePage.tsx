import { useMemo, useState } from "react";
import { Link } from "react-router";
import { DEMO_AUCTIONS, DEMO_CATEGORIES } from "../demo/catalog";
import { DemoAuctionCard } from "../components/DemoAuctionCard";
import { PageHeader } from "../components/PageHeader";

export function DemoShowcasePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("popular");
  const examples = useMemo(() => DEMO_AUCTIONS.filter(item =>
    (category === "all" || item.category === category) &&
    `${item.title} ${item.description} ${item.category} ${item.seller}`.toLowerCase().includes(search.trim().toLowerCase())
  ).sort((a,b) => sort === "price-low" ? a.price-b.price : sort === "price-high" ? b.price-a.price : sort === "ending" ? a.endingHours-b.endingHours : b.bids-a.bids), [search,category,sort]);
  return <div className="space-y-7">
    <Link className="button-ghost" to="/">← Exit demo / return to marketplace</Link>
    <div role="note" className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm"><strong>DEMO SHOWCASE — SIMULATED ONLY.</strong> All 24 listings, sellers, bids, and timers are fictional. No wallet, gas, ETH transfers, custody or blockchain transactions are involved.</div>
    <PageHeader eyebrow="Interactive sandbox" title="Explore 24 example auctions" description="Practice searching, filtering, following and bidding without connecting a wallet." />
    <div className="surface-card grid gap-3 p-4 sm:grid-cols-3">
      <label className="form-label">Search<input className="form-control" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find an example..." /></label>
      <label className="form-label">Category<select className="form-control" value={category} onChange={e=>setCategory(e.target.value)}><option value="all">All categories</option>{DEMO_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
      <label className="form-label">Sort<select className="form-control" value={sort} onChange={e=>setSort(e.target.value)}><option value="popular">Most popular</option><option value="price-low">Lowest pretend bid</option><option value="price-high">Highest pretend bid</option><option value="ending">Ending soon (display)</option></select></label>
    </div>
    <div className="flex items-center justify-between"><span className="text-sm opacity-70">{examples.length} of {DEMO_AUCTIONS.length} examples</span><button type="button" className="button-ghost" onClick={()=>{setSearch("");setCategory("all");setSort("popular")}}>Clear filters</button></div>
    {examples.length ? <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{examples.map(item=><DemoAuctionCard key={item.id} item={item}/>)}</div> : <div className="surface-card p-8 text-center">No matching demo examples.</div>}
  </div>;
}
