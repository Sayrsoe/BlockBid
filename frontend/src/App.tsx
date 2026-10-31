import { DemoShowcasePage } from "./pages/DemoShowcasePage";
import { DemoAuctionDetailsPage } from "./pages/DemoAuctionDetailsPage";
import { Route, Routes } from "react-router";
import { AdminPage } from "./pages/AdminPage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { AppLayout } from "./layouts/AppLayout";
import { AuctionDetailsPage } from "./pages/AuctionDetailsPage";
import { CreateAuctionPage } from "./pages/CreateAuctionPage";
import { DashboardPage } from "./pages/DashboardPage";
import { MarketplacePage } from "./pages/MarketplacePage";
import { NotFoundPage } from "./pages/NotFoundPage";

export default function App() {
  return (
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
  );
}
