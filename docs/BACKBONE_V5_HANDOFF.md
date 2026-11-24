# BlockBid v5 — frontend backbone stabilization

This update is based on v4 draft PR #2 (head 2ff5423aed9d57cead70ba3bdb03ddced5b2d8da) and targets that feature branch for review. It does not modify GitHub main or any Solidity file.

## Implemented
- React lazy routes + Suspense for marketplace, demo, details, create, dashboard, statistics and admin.
- Bounded reads: up to 8 auction RPC calls, 6 bid-history calls and 6 metadata loads concurrently. Ordered results and first error are preserved. Further paging/indexing research is needed for large catalogs.
- Dependency-free relative import checker runs before Vite build and guards direct demo/contract isolation.
- Five Node built-in tests cover concurrency, failure behavior and 24 sample fixtures across eight categories.
- CI uses Node 24, locked npm install, source guard, ABI check, TypeScript and Vite build.

## Verified locally before publishing
- Source guard: 128 imports passed.
- ABI smoke: 16 checked functions passed.
- Foundation unit tests: 5/5 passed.
- Deliberately broken import was detected.
- All ten Solidity files remain byte-for-byte unchanged from v4.
- Full npm build was NOT executed here: local Node 22.16 is below React Router's >=22.22 requirement; offline cache is missing ws@8.21.0. Full Windows/CI build, Hardhat tests, wallet/MetaMask and browser E2E remain to be verified.

## Required independent review
Check CI on this exact head, full route/navigation and all themes, real local-chain auction flow with disposable ETH, and no wallet/RPC call on /demo. Do not merge until owner separately approves. Existing C01 test baseline had one duration-policy failure; C02 documented 17 security findings. NFT custody, finance/security policy and protected Solidity work remain outside scope.

References: React performance https://react.dev/reference/react/useMemo ; Vite performance https://vite.dev/guide/performance ; Vite code splitting https://vite.dev/guide/build .
