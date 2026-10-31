import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BlockBidMarketplaceModule = buildModule(
  "BlockBidMarketplaceModule",
  (m) => {
    const feeRecipient = m.getAccount(0);

    const marketplace = m.contract("BlockBidMarketplace", [
      feeRecipient,
    ]);

    return { marketplace };
  }
);

export default BlockBidMarketplaceModule;