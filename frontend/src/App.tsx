import { Suspense, lazy } from "react";
import { LoadingSpinner } from "./components/LoadingSpinner";
const DemoShowcasePage = lazy(() => import("./pages/DemoShowcasePage").then(m => ({ default: m.DemoShowcasePage })));
const DemoAuctionDetailsPage = lazy(() => import("./pages/DemoAuctionDetailsPage").then(m => ({ default: m.DemoAuctionDetailsPage })));
import { Route, Routes } from "react-router";
const AdminPage = lazy(() => import("./pages/AdminPage").then(m => ({ default: m.AdminPage })));
const StatisticsPage = lazy(() => import("./pages/StatisticsPage").then(m => ({ default: m.StatisticsPage })));
import { AppLayout } from "./layouts/AppLayout";
const AuctionDetailsPage = lazy(() => import("./pages/AuctionDetailsPage").then(m => ({ default: m.AuctionDetailsPage })));
const CreateAuctionPage = lazy(() => import("./pages/CreateAuctionPage").then(m => ({ default: m.CreateAuctionPage })));
const DashboardPage = lazy(() => import("./pages/DashboardPage").then(m => ({ default: m.DashboardPage })));
const MarketplacePage = lazy(() => import("./pages/MarketplacePage").then(m => ({ default: m.MarketplacePage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then(m => ({ default: m.NotFoundPage })));

export default function App() {
  return (
    <Suspense fallback={<div className="flex min-h-60 items-center justify-center" role="status" aria-live="polite"><LoadingSpinner label="Loading page" /></div>}>
      <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<MarketplacePage />} />
        <Route path="demo" element={<DemoShowcasePage />} />
        <Route path="demo/:demoId" element={<DemoAuctionDetailsPage />} />
        <Route path="auction/:auctionId" element={<AuctionDetailsPage />} />
        <Route path="create" element={<CreateAuctionPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      </Routes>
    </Suspense>
  );
}
