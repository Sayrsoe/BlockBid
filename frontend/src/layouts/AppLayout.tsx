import { Outlet } from "react-router";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { NetworkBanner } from "../components/NetworkBanner";

export function AppLayout() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[34rem] galaxy-grid opacity-60" />
      <div className="pointer-events-none fixed -left-36 top-52 -z-10 h-80 w-80 rounded-full bg-violet-700/10 blur-3xl" />
      <div className="pointer-events-none fixed -right-32 top-24 -z-10 h-96 w-96 rounded-full bg-cyan-500/[0.07] blur-3xl" />
      <Navbar />
      <NetworkBanner />
      <div role="note" className="demo-notice"><strong>LOCAL TEST MARKETPLACE</strong><span>Real-contract listings are metadata-only. No custody or delivery guarantee. Use only local/test ETH. The optional showcase is a separate simulation.</span></div>
      <main className="app-container flex-1 py-8 sm:py-12">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
