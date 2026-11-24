# BlockBid — VS Code + Hardhat Quick Cheat Sheet (Windows)

> **Bookmark this GitHub file.** These steps apply to the full BlockBid project from the clean ZIP (or a future reviewed source import), **not** to a README-only repository checkout.

## 0 — Install once

- Download [Node.js 24 LTS](https://nodejs.org/en/download) (npm included), [Git](https://git-scm.com/downloads/win), and [VS Code](https://code.visualstudio.com/download).
- Install [Nomic Foundation Solidity](https://marketplace.visualstudio.com/items?itemName=NomicFoundation.hardhat-solidity), [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode), [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint), [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss).
- Use Node 24 LTS for compatibility. The current frontend's React Router 8 requires Node >=22.22.0; the container's 22.16.0 is too old. Verify in a **new** terminal:

```powershell
node -v
npm -v
git --version
```

## 1 — Open the correct folder

1. Extract the clean BlockBid source ZIP to a new directory. Keep the original ZIP as backup.
2. VS Code → **File → Open Folder** → choose `BlockBid/` containing `hardhat.config.ts` and `frontend/`.
3. Open **Terminal → New Terminal**. Open three terminals using the **+** control.

Do **not** run `npx hardhat --init` in this existing project. Run Hardhat commands from the root, not from `frontend/`.

## 2 — First-time dependency install (only once per clean checkout)

```powershell
# Terminal A — project root
npm ci

# Terminal B — frontend folder
cd frontend
npm ci
```

If `npm ci` reports Windows `EPERM`, close the running Vite/Node terminals, retry in a new VS Code terminal, then investigate which process holds `node_modules` open. Do not disable your antivirus or remove lockfiles as a first step.

## 3 — Start the local demo (every new session)

**Terminal 1 — Hardhat local node (keep it open):**

```powershell
npx hardhat node
```

Your local RPC is `http://127.0.0.1:8545`, chain ID `31337`. It prints disposable **development accounts**. Never use the printed example development keys with real funds.

**Terminal 2 — deploy the Marketplace after the node is running:**

```powershell
npx hardhat ignition deploy ignition/modules/BlockBidMarketplace.ts --network localhost
```

Copy the address shown beside `BlockBidMarketplaceModule#BlockBidMarketplace` in **Deployed Addresses**.

**Configure the frontend once (or after changing/restarting the chain):**

```powershell
cd frontend
Copy-Item .env.example .env
notepad .env
```

Edit this line in `frontend/.env`:

```dotenv
VITE_BLOCKBID_ADDRESS=0xPASTE_THE_ACTUAL_DEPLOYED_ADDRESS_HERE
VITE_TARGET_CHAIN_ID=31337
VITE_TARGET_RPC_URL=http://127.0.0.1:8545
```

Replace only the address placeholder with the *real* 42-character `0x...` contract address. `frontend/.env.example` already has the remaining network defaults. Keep `frontend/.env` local; **never push it to GitHub**.

**Terminal 3 — React frontend:**

```powershell
cd frontend
npm run dev
```

Open the local Vite URL printed in the terminal (often `http://localhost:5173`). After changing `.env`, restart Vite with `Ctrl+C` and `npm run dev`.

**MetaMask test network:** manually add network name `Hardhat Local`, RPC `http://127.0.0.1:8545`, chain ID `31337`, currency `ETH`. Use a disposable test wallet and only local ETH. Wallet and node should be on the same network.

**Important:** A local Hardhat node resets when stopped. An old deployment address or persisted Ignition journal may no longer be valid. This clean ZIP excludes old local deployment journals. If you restart a clean chain, redeploy and recopy the address as needed. For persistent/testnet deployments, follow a separately reviewed plan.

## 4 — Quick checks

```powershell
# Project root
npx hardhat compile
npx hardhat test

# Frontend folder
cd frontend
npm run check:abi
npm run build
npm run dev
```

`npm run check:abi` verifies 16 critical ABI mutabilities. The prior contract baseline had **23 passing, 1 failing** test; treat any current failures as issues to investigate, not automatic success.

### VS Code one-click tasks

With the `BlockBid/` root open, press `Ctrl+Shift+P`, choose **Tasks: Run Task**, and select `BlockBid: Hardhat Node`, `BlockBid: Deploy Local`, `BlockBid: Frontend Dev`, etc. Start the node first. These tasks do **not** automatically deploy or change GitHub when opening the project.

## 5 — Simple GitHub workflow

**Current important limitation:** `https://github.com/Sayrsoe/BlockBid` initially contained only `README.md`. `git clone` will not download the application until the full source has been pushed and approved. For now, run the extracted clean ZIP; the setup documentation on GitHub is a reference.

When the approved full source is available on a GitHub branch, the typical sequence is:

```powershell
git clone https://github.com/Sayrsoe/BlockBid.git
cd BlockBid
code .
git status
```

To work on an **approved feature branch**:

```powershell
git switch -c feature/my-change
# Edit and test your files in VS Code
git status
git add .
git commit -m "Describe the change"
git push -u origin feature/my-change
```

Before `git add .`, inspect `git status`, confirm private `.env`, secret files, `node_modules`, generated `artifacts`, and local `ignition/deployments` are ignored. Do not push or merge on `main` without your own review/approval. For initial source import, work from a fresh clone and copy the **clean** ZIP files into a new feature branch, not the original 164-MB archive with private/generated state.

## 6 — If something is not working

| Problem | What to check |
| --- | --- |
| `node` or `npm` not found | Reinstall Node 24 LTS, reopen VS Code, verify `node -v`. |
| `npm ci` EPERM | Close running Node/Vite tasks, inspect file locks; retry. |
| Hardhat deploy fails to connect | Is Terminal 1 still running? Does `http://127.0.0.1:8545` respond? |
| Wrong network in MetaMask | Chain ID 31337, HTTP RPC 127.0.0.1:8545. |
| Contract not found or empty auctions | Deploy on the **current** local node, copy its new contract address to `.env`, restart Vite. |
| Frontend build fails | Check Node version >=22.22 and fresh `npm ci`; run `npm run check:abi` and `npm run build`. |
| Listing image missing on another device | Demo metadata/images may be browser-local; IPFS backend not added yet. |
| `git clone` only contains a README | Full source has not yet been approved/imported to GitHub. Use your clean ZIP until then. |

## Links

- [Hardhat 3 docs](https://hardhat.org/docs/getting-started)
- [Hardhat Ignition localhost deployment](https://hardhat.org/ignition/docs/getting-started)
- [VS Code tasks](https://code.visualstudio.com/docs/debugtest/tasks)
- [BlockBid repository](https://github.com/Sayrsoe/BlockBid)
