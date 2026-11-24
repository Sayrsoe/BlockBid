# Manual frontend smoke checklist (Windows / local test chain)

- [ ] `npm ci` from frontend and `npm run build` pass on supported Node.
- [ ] Home page, auction detail, creation wizard, dashboard, statistics, admin and 404 render.
- [ ] Mobile navigation offers all routes and Appearance control.
- [ ] All five appearance styles show readable foreground text, buttons, forms, cards and banners.
- [ ] System theme responds to OS color-scheme updates.
- [ ] Custom theme accents apply and persist after reload; inaccessible storage does not crash the UI.
- [ ] Keyboard Escape dismisses the appearance popup and focus-visible rings are visible.
- [ ] Connect wallet, disconnect, switch wrong network, reject signature, retry.
- [ ] Create auction with test ETH only, verify created auction ID and metadata in same browser.
- [ ] View legacy nested `blockbid-local://UUID` metadata on the same origin if present.
- [ ] Open `/statistics` and compare metrics with actual local on-chain state.
- [ ] Open `/admin` as non-owner, wrong network, and test owner; ensure access gating and no accidental irreversible actions.
- [ ] Verify create, bid, cancel, end, finalize, claimRefund, claimProceeds on **local chain**, including errors.
- [ ] Verify protected Solidity sources unchanged and no production/mainnet keys are present.
- [ ] Record browser screenshots at 1440px, 768px and 375px for each theme; check WCAG contrast.
