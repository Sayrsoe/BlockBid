# BlockBid v4 — Optional Demo and Tutorial (source handoff)

**Source status:** This feature branch imports the v4 source ZIP. Main is unchanged pending review. The original setup PR remains documentation-only. The procedure below is retained for reference; current verification is recorded in [SOURCE_SYNC_2026-11-01.md](SOURCE_SYNC_2026-11-01.md).

## Implemented in the v4 source ZIP

- Default marketplace: local-chain auctions only; demo cards no longer mixed into the homepage.
- **Try Demo** opens a welcome dialog and links to `/demo` with 24 fictional examples, filters and simulated bids.
- **Watch Tutorial** presents a four-step interactive walkthrough.
- Demo details live under `/demo/:demoId` and return to `/demo`.
- The React theme system remains shared; Solidity and protected files are unchanged.

## First source import — VS Code / PowerShell

1. Extract `BlockBid_Optional_Demo_Tutorial_v4_2026-11-01.zip` into a temporary folder.
2. In another folder, clone GitHub and create a review branch:

```powershell
git clone https://github.com/Sayrsoe/BlockBid.git
cd BlockBid
git switch -c feature/import-blockbid-demo-v4
```

3. Copy **contents** of the extracted ZIP's `BlockBid` directory into this clone, without replacing the clone's `.git` directory. Review changed files and hidden files before staging. Ensure `.env`, `node_modules`, `dist` and `ignition/deployments` are excluded.
4. From project root and `frontend`, run `npm ci`, Hardhat compilation/tests and `npm run check:abi && npm run typecheck && npm run build` using Node 24 LTS.
5. Check `git status`, stage only safe source, commit and push the feature branch, then open a **draft PR**. Do **not** merge before independent review.

## Validation

- ZIP integrity and local relative-import existence checked.
- The original offline preparation environment (Node 22.16, incomplete npm cache) could not build. The later Windows isolated frontend typecheck/build passed; see the dated sync record for limitations.
- The source-import feature branch now contains the application; main remains unchanged pending review.

