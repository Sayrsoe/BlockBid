# BlockBid — VS Code + Hardhat quick-start (Windows)

Bookmark this GitHub page. Commands require the **complete clean BlockBid source ZIP**, not the README-only GitHub checkout.

## 1. One-time installation

- Install [Node.js 24 LTS](https://nodejs.org/en/download), [VS Code](https://code.visualstudio.com/download), [Git](https://git-scm.com/downloads/win).
- VS Code extensions: Nomic Foundation Solidity, Prettier, ESLint, Tailwind CSS IntelliSense.
- Extract the approved clean ZIP. In VS Code choose File → Open Folder → **BlockBid/** (it must contain `hardhat.config.ts` and `frontend/`).
- Open the terminal. Check `node -v`, `npm -v`, `git --version`.
- React Router 8 requires Node **22.22.0+**; Node 24 LTS is recommended. Do **not** run `npx hardhat --init`.

## 2. Install packages, once

```powershell
# Project root
npm ci
# Frontend folder
cd frontend
npm ci
```

## 3. Start BlockBid in three terminals

**Terminal 1** (root; leave running):
```powershell
npx hardhat node
```
**Terminal 2** (root, after node is running):
```powershell
npx hardhat ignition deploy ignition/modules/BlockBidMarketplace.ts --network localhost
```
Copy the `BlockBidMarketplaceModule#BlockBidMarketplace` contract address from the deploy output.

**Terminal 3** (frontend folder):
```powershell
cd frontend
Copy-Item .env.example .env
notepad .env
```
Replace `VITE_BLOCKBID_ADDRESS` with the actual deployed `0x...` address. Use chain `31337` and RPC `http://127.0.0.1:8545`. Save and run:
```powershell
npm run dev
```
Open the Vite local URL, commonly http://localhost:5173. Restart Vite when `.env` changes.

Add a disposable **Hardhat Local** network in MetaMask: RPC `http://127.0.0.1:8545`, chain ID `31337`, ETH. Never fund demo accounts with real ETH. If you restart the chain, redeploy and recopy the contract address. The clean ZIP excludes stale local Ignition deployment journals.

## 4. Build and check

```powershell
# Project root
npx hardhat compile
npx hardhat test
# Then in frontend
cd frontend
npm run check:abi
npm run build
```

The ABI check covers 16 interface functions. Previous C01 tests had 23 passing and 1 failing test; re-run them locally before claiming a clean build.

## 5. VS Code shortcuts

Press `Ctrl+Shift+P` → **Tasks: Run Task** → select `BlockBid: Hardhat Node`, then `BlockBid: Deploy Local`, and `BlockBid: Frontend Dev`. Use the tasks included in the clean ZIP; they do not auto-run or change GitHub.

## 6. GitHub commands

**Current status:** `Sayrsoe/BlockBid` was README-only. Do not expect `git clone` to include the app until an independently reviewed source-import PR is merged.

After the source is published:
```powershell
git clone https://github.com/Sayrsoe/BlockBid.git
cd BlockBid
code .
git status
git switch -c feature/my-change
# edit files in VS Code, then
git add .
git commit -m "Describe the change"
git push -u origin feature/my-change
```

Inspect `git status` before staging. Keep `.env`, private keys, `node_modules`, build artifacts and Ignition deployment journals out of Git. The first source import should copy only files from the clean ZIP onto a separately reviewed feature branch.

## 7. Troubleshooting

| Problem | Fix |
| --- | --- |
| `node` / `npm` missing | Install Node 24 LTS; reopen VS Code |
| `npm ci` EPERM | Close Node/Vite terminals; inspect locked files; retry |
| Deploy connection refused | Start Terminal 1 on port 8545 |
| Wrong MetaMask network | Chain 31337; local RPC |
| Old address / empty auctions | Redeploy on current chain and update `.env` |
| Images missing on other devices | Browser-local demo metadata; cross-device storage not added |
| Cloned repo only has README | Source import isn't complete; use the clean ZIP |

Documentation: [Hardhat 3](https://hardhat.org/docs/getting-started), [Ignition localhost](https://hardhat.org/ignition/docs/getting-started), [VS Code tasks](https://code.visualstudio.com/docs/debugtest/tasks).
