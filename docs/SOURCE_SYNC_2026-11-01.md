# BlockBid v4 source sync

Date: 2026-11-01. This branch imports the optional-demo/tutorial package for continued development. It does not implement additional improvements or merge into main.

## Source and scope

- Input: `BlockBid_Optional_Demo_Tutorial_v4_2026-11-01.zip`.
- ZIP SHA-256: `36743c65961655c6e70807f1dabc7dc239e96f46ac043320e7a79021d9597bdd`.
- Imported 116 source/configuration/documentation/assets files from that ZIP. Root generated `types/` files (16) and the root `type` compiler scratch file were excluded. The authored `frontend/src/types/blockBid.ts` is included.
- Existing documentation branch history is preserved as the parent. Its source-import guide is retained. This record and the research baseline summary are added; README/source-guide status wording is updated for the import.
- No `.git`, dependencies, build output, actual `.env`, local deployment journals, private keys or wallet data is published. `.env.example` contains only placeholders and localhost configuration.
- Pattern scanning found no credential candidates in the imported payload; this is a bounded scan, not a guarantee that every possible secret format was detected.
- All ten Solidity source files exactly match the C01/C02 audited bytes, including the eight protected support/interface files. No source logic was edited during this sync.

## Verification actually obtained

Windows; bundled Node 24.22.1. The package's root and frontend lockfiles exactly match the C01 snapshot. Frontend verification used an isolated copy with copied archived dependencies, not a new `npm ci` installation.

| Check | Result |
|---|---|
| `node scripts/check-abi.mjs` | PASS, 16 critical mutability checks |
| `node node_modules/typescript/bin/tsc -b --force --pretty false` | PASS |
| `node node_modules/vite/bin/vite.js build` | PASS, 263 modules; JS 681.93 kB / gzip 211.14 kB |
| Solidity hash comparison | PASS, 10 of 10 files identical to audited snapshot |
| Full frontend ABI vs C01 verified artifact | See import manifest verification; no fresh compiler claim |

Build warning: main JavaScript chunk exceeds 500 kB. Browser tutorial/demo interactions, wallet flows, clean dependency installation and contract compilation/tests were not rerun in this sync. An initial staging filter mistakenly omitted the authored frontend types file; it was corrected before upload and all frontend checks were rerun successfully. No application fix was needed.

Prior documentation such as BUILD_VERIFICATION.json and the v4 preparation handoffs describes earlier environments. This dated record supersedes their frontend build status for the imported payload, within the limits above.

## Open baseline issues

- C01 contract test run: 23 passed, 1 failed because the test expected a one-hour minimum while Solidity permits five minutes. This sync preserves that discrepancy. Root `npm test` is still a placeholder; it is not a working test entry point.
- No NFT/physical asset custody or working disputes. Timed ETH escrow alone does not guarantee delivery.
- Rejecting fee/seller receivers and mutable settlement fees remain C02 findings.
- Package metadata declares ISC while Solidity files declare MIT. Existing notices are preserved; no new repository-wide license is asserted. Asset provenance and license clarification remain review items.
- Solidity, tests and client behavior need separate, scoped improvement work. No deployment or merge is authorized by this sync.

The manifest records the original ZIP members and their hashes. It deliberately omits machine-specific paths and local audit logs.
