# BlockBid interactive showcase handoff — v3

## Scope and source
Based on approved unified frontend + VS Code Setup v2. React/TypeScript only. 24 static, explicitly fictitious example auctions in eight category groups. Original Solidity, contract ABI and local blockchain auction operations are untouched. Original real auctions remain under the **Local blockchain auctions** tab on the same marketplace page.

## Implementation
- `frontend/src/demo/catalog.ts`: 24 deterministic fixture records with fictional seller, price, bid counts, category, display-only looping time, and CSS illustration variants. No real item image copyright or ownership claim.
- `frontend/src/demo/localSimulation.ts`: separate browser-local state namespace; pretend bid, watch and reset, defensive parsing and bounded state; no wallet imports or network calls.
- `frontend/src/components/DemoAuctionCard.tsx`: 24 example cards, labeling every one SIMULATED / NO ETH.
- `frontend/src/pages/DemoAuctionDetailsPage.tsx`: dedicated /demo/demo-XX details with bid/watch/reset and disclaimer.
- `frontend/src/pages/MarketplacePage.tsx`: demo vs local blockchain tabs, search across demo text, category filters, sorting by popularity, price and ending time; live contract list preserved.
- `frontend/src/App.tsx`: distinct `/demo/:demoId` route; all appearance themes apply via shared context.
- `frontend/src/index.css`: reusable CSS-gradient demonstration artwork.

## Design and safeguards
No Solidity modifications. No pretend asset identified as owned or custody-backed. No real transactions, wallet calls, fake tx hashes or API calls triggered from demo view. No settlement: countdown is a **looping display value** rather than a realtime clock. Local bids are untrusted display state only. No changes to GitHub main.

## Reproduction
Root `npm ci` for Hardhat if testing blockchain, and in `frontend/` run `npm ci`, `npm run check:abi`, `npm run typecheck`, `npm run build`, `npm run dev`. The showcase works without Hardhat; local blockchain tab needs a deployed contract, and the existing app may issue a read-only RPC request on page load.

## Review checklist
- Verify all 24 demo cards and 8 categories; filter search and combinations; sorting; no matches.
- Inspect `/demo/demo-01`, pretend bid/watch/reset, storage reload. Test blocked localStorage and invalid values.
- Switch Galaxy, Crystal, Warm, Slate, Custom and System themes on both catalog and detail.
- Verify `/auction/:auctionId` and transaction flow still use old contract interface, no demo state leak.
- Verify no demo network/web3 writes; test with DevTools network and disconnected wallet.
- Run `npm ci && npm run build` on Windows; test browser and wallet manually.

## Checks actually run in this environment
- PASS: frontend `node scripts/check-abi.mjs` (16 functions).
- PASS: source-level checks find exactly 24 distinct demo records and no Web3 service import in demo interaction modules.
- PASS: SHA-256 comparison of every Solidity source file against unified v2 baseline; unchanged.
- PASS: ZIP CRC/integrity scan (130 files).
- BLOCKED: `npm run typecheck` was attempted but failed because React/ethers/Vite and other dependency packages are not installed in this container (1,282 dependency/type-resolution errors). It is not a passing typecheck and not evidence of a source-code defect.
- NOT RUN: full Vite build, browser tests, test-wallet/Hardhat smoke checks. Perform on Windows using `npm ci` in `frontend/`, then `npm run typecheck && npm run build`.
