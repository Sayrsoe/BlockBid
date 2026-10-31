# BlockBid — Auction Marketplace Demo

BlockBid uses Solidity + Hardhat 3, React + Vite, and a unified frontend with Galaxy/Light/Warm/Slate/Custom/System themes.
**Demo only**: listings do not custody NFTs or physical goods. Use only local/test ETH.

## Start in VS Code (Windows)

**Important:** GitHub currently hosts the setup guide, but the full app source has not yet been imported. Extract the approved **BlockBid Demo VS Code Setup v2** ZIP from our ChatGPT project and open that **BlockBid/** folder in VS Code.

Install Node.js 24 LTS and Git. From the complete project root:

```powershell
npm ci
cd frontend
npm ci
cd ..
```

Open three VS Code terminals:

```powershell
# Terminal 1: keep running
npx hardhat node
```
```powershell
# Terminal 2: deploy
npx hardhat ignition deploy ignition/modules/BlockBidMarketplace.ts --network localhost
```
```powershell
# Terminal 3: frontend
cd frontend
npm run dev
```

Copy the deployed contract address into `frontend/.env` as `VITE_BLOCKBID_ADDRESS`. Create `.env` by copying `frontend/.env.example` and leave RPC `http://127.0.0.1:8545`, chain ID `31337`. Restart Vite after changing `.env`.

### [Full VS Code + Hardhat quick-start guide](docs/VS_CODE_START_HERE.md)

Never publish `.env`, real wallet secrets, `node_modules`, or local deployment journals. The documentation PR does not publish source code or modify `main`.
