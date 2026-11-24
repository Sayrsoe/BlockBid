# BlockBid development baseline

BlockBid contains a Solidity auction contract and a frontend preview. Open Marketplace to see deployment availability, or choose **Preview a listing** to try the listing form. The draft stays in the current tab and clears on navigation or reload. Publishing and wallet access require a verified deployment. Listings describe digital metadata only.

## Run locally on Windows

Select Node 24 and run these commands from the repository root.

```powershell
npm --prefix frontend ci --no-audit --no-fund
npm --prefix frontend run test:foundation
npm --prefix frontend run build
npm --prefix frontend run preview -- --host 127.0.0.1 --port 5173 --strictPort
```

Open `http://127.0.0.1:5173`. The [frontend guide](frontend/README.md) describes image limits, scheduling and same-origin metadata.

## Verification boundaries

The build checks source imports, the checked-in ABI, TypeScript and production assets. Contract execution on the reviewed Windows host is blocked by application control for the pinned native runtime. The client alias uses port 8545 while the approved local RPC endpoint uses port 31337. The inherited duration test also expects a longer minimum than the five-minute contract minimum. Contract behavior, wallet flows and deployment require separate verification.

The [historical project notes](docs/) describe earlier setup and import work.
