import { Suspense } from "react";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Outlet } from "react-router";
import { hasVerifiedDeployment } from "../contracts/contractConfig";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { NetworkBanner } from "../components/NetworkBanner";

export function AppLayout() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <Navbar />
      <NetworkBanner />
      {hasVerifiedDeployment && (
        <div role="note" className="marketplace-notice">
          <strong>LOCAL TEST MARKETPLACE</strong>
          <span>Listings are metadata-only. Use local test ETH.</span>
        </div>
      )}
      <Suspense fallback={<main className="app-container grid min-h-60 flex-1 place-items-center" role="status"><LoadingSpinner label="Loading page" /></main>}>
        <main className="app-container flex-1 py-8 sm:py-12">
          <Outlet />
        </main>
        <Footer />
      </Suspense>
    </div>
  );
}
