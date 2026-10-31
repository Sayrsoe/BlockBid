# BlockBid MVP Test Suite

The old Counter template test was removed and replaced with `test/BlockBidMarketplace.ts`.

Run from the BlockBid project folder:

```bash
npx hardhat clean
npx hardhat compile
npx hardhat test
```

The suite covers deployment/configuration, auction creation, metadata editing, bidding, pull-payment refunds, anti-sniping, cancellation, reserve failure, escrow creation, escrow settlement, platform fees, pause behavior, access control, double-settlement protection, and explicitly deferred MVP features.
