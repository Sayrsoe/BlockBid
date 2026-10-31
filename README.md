# BlockBid — Decentralized Auction Marketplace (Demo)

A Solidity / Hardhat 3 + React / Vite auction **demo**. This source has one unified frontend with Galaxy, Light, Warm, Slate, Custom and System appearances. **Listings are metadata-only; NFTs/physical goods are not escrowed. Use only local/test ETH.**

## Quick start (Windows / VS Code)

Requirements: Git, VS Code and **Node.js 24 LTS**. Open the **project root** (the folder containing `hardhat.config.ts`) in VS Code.

**First time — install dependencies in two terminals:**

```powershell
npm ci
cd frontend
npm ci
cd ..
```

**Each time — use three VS Code terminals:**

```powershell
# Terminal 1 (project root): keep running
npx hardhat node
```

```powershell
# Terminal 2 (project root): deploy on local chain
npx hardhat ignition deploy ignition/modules/BlockBidMarketplace.ts --network localhost
```

```powershell
# Terminal 3 (frontend folder): start the site
cd frontend
npm run dev
```

After deploying, **copy the `BlockBidMarketplaceModule#BlockBidMarketplace` address printed by Ignition**. If you haven't created your local frontend config yet:

```powershell
cd frontend
Copy-Item .env.example .env
```

Edit `frontend/.env` and set `VITE_BLOCKBID_ADDRESS=<paste the printed address>`; leave the local RPC `http://127.0.0.1:8545` and chain ID `31337`. Restart `npm run dev` if `.env` changes. Connect MetaMask to the **Hardhat Local** network with a disposable test account.

**Before sharing code, run:**

```powershell
# From project root
npx hardhat compile
npx hardhat test
# From frontend
cd frontend
npm run check:abi
npm run build
```

**Detailed help:** [VS Code + Hardhat startup cheat sheet](docs/VS_CODE_START_HERE.md) · [Frontend smoke tests](docs/FRONTEND_SMOKE_CHECKLIST.md).

VS Code: **Terminal → Run Task** provides labeled options for chain, deploy, frontend and tests (when `.vscode/tasks.json` is present).

## GitHub source status

This source-import branch contains the v4 demo application and preserves the earlier setup documentation. Main remains unchanged pending review. See [the source sync record](docs/SOURCE_SYNC_2026-11-01.md) for provenance, current build checks and known limitations, and [the research baseline](docs/RESEARCH_BASELINE.md) for future improvement priorities.

## Safety

No real ETH. No guaranteed item/NFT delivery. Do not commit `.env`, private keys, wallet recovery phrases, `node_modules`, or old `ignition/deployments` journals. Protected Solidity libraries/interfaces must remain unchanged unless separately approved.
