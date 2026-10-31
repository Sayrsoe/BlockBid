# BlockBid Frontend

Premium dark-galaxy React interface for the BlockBid decentralized auction marketplace.

## Local setup

1. Keep the Hardhat node running from the project root:

   ```bash
   npx hardhat node
   ```

2. Deploy the contract:

   ```bash
   npx hardhat ignition deploy ./ignition/modules/BlockBidMarketplace.ts --network localhost
   ```

3. Copy `.env.example` to `.env` and replace `VITE_BLOCKBID_ADDRESS` with the deployed contract address.

4. Copy the latest Hardhat artifact to:

   ```text
   frontend/src/contracts/BlockBidMarketplace.json
   ```

5. Install and run:

   ```bash
   npm install
   npm run typecheck
   npm run dev
   ```

6. Add the Hardhat network to MetaMask:

   ```text
   RPC URL: http://127.0.0.1:8545
   Chain ID: 31337
   Currency: ETH
   ```

## Included UI

- Dark universe / galaxy visual system
- Responsive glass navigation and wallet controls
- Marketplace hero, contract statistics, search, filters, and sorting
- Premium auction cards with images, status badges, live countdowns, and bid data
- Compact four-step Create Auction wizard
- Drag-and-drop image upload with validation and preview
- Pricing, scheduling shortcuts, inline validation, and final review
- MetaMask transaction-status modal
- Local image and metadata storage through IndexedDB
- Auction details with bidding, seller actions, escrow information, and bid history
- Wallet dashboard with listings, bids, wins, refunds, and seller-claim indicators
- Loading skeletons, empty states, success messages, and error handling

## Local metadata

The Create Auction wizard does not expose an image URL or metadata URI. It stores the uploaded image and generated JSON in the browser's IndexedDB and sends only a compact URI to the contract:

```text
blockbid-local://auction/<unique-id>
```

This is ideal for the local classroom prototype. The image is available only in the same browser profile where it was uploaded. Do not clear that browser's site data before presenting.

A public deployment can replace the IndexedDB service with IPFS without changing the Solidity contract.

## Notes

- The Solidity contracts are not modified by this frontend package.
- The contract enforces a minimum auction duration of one hour and a minimum bid increment of 0.001 ETH.
- A restarted Hardhat node erases local chain state. Redeploy and update the contract address after a restart.
