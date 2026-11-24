# BlockBid frontend

## Run the frontend preview

From this checkout, select the approved Node 24 runtime, then run the commands below. The frontend uses the installed locked dependencies.

```powershell
npm --prefix frontend run typecheck
npm --prefix frontend run test:foundation
npm --prefix frontend run build
npm --prefix frontend run preview -- --host 127.0.0.1 --port 5173 --strictPort
```

Open `http://127.0.0.1:5173`. The marketplace, auction detail, dashboard, statistics, and admin routes explain that live data requires a verified local deployment. Choose **Preview a listing** to try the item, pricing and scheduling form. The draft lives in the current tab. A reload or leaving the route clears it.

## Item images and local storage

The listing form accepts still PNG, JPEG and WebP up to 5 MiB, with a maximum of 4,096 pixels per side and 8,388,608 pixels total. The form checks the header and browser decode before displaying an image.

Once the verified deployment and publishing flow are available, local metadata commits to IndexedDB before submission. The image and item text live on the same browser origin. A different browser or device may only have the auction ID and on-chain fields. Clearing site data can remove local metadata.

## Local chain

The G4 endpoint is `http://127.0.0.1:31337` with chain ID `31337`. The current pinned Hardhat client alias points to port `8545`. Live chain access and wallet requests require a reviewed endpoint and verified deployment identity. The current production build serves the frontend preview only.
