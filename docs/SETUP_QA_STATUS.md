# BlockBid setup + VS Code checks — 2026-11-01

## Scope
- Simplified project README and complete Windows/VS Code quickstart.
- Added `.vscode/tasks.json` and `.vscode/extensions.json` to the clean source ZIP.
- Added a `localhost` HTTP network in the root Hardhat 3 config for clarity.
- Ignored and excluded stale `ignition/deployments/chain-31337` state from the clean ZIP.
- No Solidity contract/interface/library file edited. No NFT escrow / real-funds deployment.

## Checks performed
- `node frontend/scripts/check-abi.mjs`: PASS (16 critical functions).
- VS Code JSON files: parsed successfully.
- `npm ci --offline` in frontend: BLOCKED (npm cache missing ws package), not a functional build result.
- Global `tsc` without installed node_modules: BLOCKED (missing React/ethers/module packages); cannot claim a passing fresh type-check.
- Root Hardhat tests, Vite build, MetaMask flow, and UI screenshots: NOT RUN due to missing dependencies/network.
- Checked public `Sayrsoe/BlockBid` main: README only, single initial commit at time of documentation.
- Recommend running `npm ci`, `npm run build`, Hardhat tests and browser QA on Windows before merging/source publication.

## GitHub documentation publication
- Separate documentation-only feature branch / draft PR if created; it cannot represent a full source import.
- Main should remain unchanged until an independently reviewed merge.
