import { lazy } from "react";
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
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<MarketplacePage />} />
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path="auction/:auctionId" element={<AuctionDetailsPage />} />
        <Route path="create" element={<CreateAuctionPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
