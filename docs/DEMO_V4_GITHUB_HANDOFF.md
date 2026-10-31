# BlockBid v4 — Optional Demo and Tutorial

## Product behavior
- On `/`, only local-chain marketplace listings are shown; no fictional auction cards are mixed in.
- A Try Demo popup offers access to `/demo`, with 24 clearly fictional listings, category/search/sort, pretend bids and watchlist.
- Watch Tutorial opens a four-step interactive walkthrough; from it, visitors can enter `/demo`.
- `/demo/:demoId` is isolated and clearly simulated; its back link returns to `/demo`.
- Existing appearance system and real-chain functionality preserved. Solidity and its protected support files unchanged.

## Review notes
Updated frontend files: `src/App.tsx`, `src/components/Navbar.tsx`, `src/components/DemoLauncher.tsx` (new), `src/pages/MarketplacePage.tsx`, `src/pages/DemoShowcasePage.tsx` (new), `src/pages/DemoAuctionDetailsPage.tsx`, `src/layouts/AppLayout.tsx`.

Quick Windows check from `frontend`: `npm ci`, `npm run check:abi`, `npm run typecheck`, `npm run build`, `npm run dev`. Verify popup, Escape/close, tutorial next/back, all demo filters and bids, mobile navbar, appearance modes and no wallet request on demo paths.

## Validation and limitations
All relative imports were checked for corresponding local source paths. Full TypeScript and Vite build were NOT completed here because the container provides Node 22.16 (React Router needs >=22.22) and npm offline cache is missing dependencies. Full Windows browser/contract tests pending.

## GitHub handoff
GitHub `main` remains README-only. The clean v4 source ZIP must first be imported to a new feature branch with `.git`, `node_modules`, `dist`, local `ignition/deployments`, and `.env` excluded. Publish a draft PR for independent review; do not merge without owner approval.
