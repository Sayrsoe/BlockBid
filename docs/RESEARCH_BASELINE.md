# Research baseline for future improvements

This summary carries forward the completed C01 (2026-10-27) and C02 (2026-10-28) research. Those audits used original `BlockBid(4).zip`, SHA-256 `a168fde82e1e4fe12a51c05be6a43bc88dca734024cf3509aeacbc7578580fcf`. The newer v4 frontend is not the old two-frontend audit target.

The old snapshot was a dirty GitLab-derived working tree; archived HEAD `6b0ec37ae175fa4ce1d1a27349cf8b6c619a802c` does not identify its exact working bytes. All ten v4 Solidity files match the audited bytes. Source publication here establishes a GitHub revision for the imported application, not a security certification.

## Evidence carried forward

- C01 direct solc 0.8.28 compilation reproduced optimized ABI and bytecode. Normal Hardhat compilation encountered a compiler-cache mutex timeout.
- C01 unchanged Hardhat suite recorded 23 passing and one failing duration-policy test.
- C02 delivered 17 findings, an ETH liability ledger, 37 ABI entries, two pinned comparable-project studies and 68 future adversarial test scenarios. C02 did not implement or execute those future tests.
- The v4 ABI already corrects the previous outer frontend's write-as-pure problem; the old C01 integration finding must not be treated as proof the same defect persists in this imported client.

## Suggested improvement order, not implementation approval

1. Choose the duration and anti-sniping rules; align the contract, tests and UI under explicit authorization for protected-file edits.
2. Define demo versus real-value product scope. No enforced asset delivery or working dispute process exists today.
3. Specify payout receiver recovery and per-auction fee terms; evaluate separate withdrawal credits and beneficiary-authorized destinations.
4. Add adversarial receivers, multi-auction conservation tests and exact-time boundary tests after approval.
5. Verify browser demo/tutorial and wallet behavior, metadata persistence, and a reproducible clean build before release.

At transaction boundaries, model ETH obligations as pending refunds + highest bids of auctions still marked Active (including expired-but-not-ended auctions) + Escrowed amounts. Do not count retained historical winning amounts twice or treat forced ETH surplus as revenue.

The complete historical reports remain in the user's research handoffs. This repository summary avoids publishing workstation paths or local command transcripts. No C03–C05 work or new product implementation is implied.
