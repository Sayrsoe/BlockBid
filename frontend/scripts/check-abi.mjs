import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const artifactUrl = new URL("../src/contracts/BlockBidMarketplace.json", import.meta.url);
const artifact = JSON.parse(readFileSync(fileURLToPath(artifactUrl), "utf8"));
const functions = new Map(artifact.abi.filter((item) => item.type === "function").map((item) => [item.name, item]));
const expected = {
  createAuction: "nonpayable", placeBid: "payable", cancelAuction: "nonpayable", endAuction: "nonpayable",
  finalizeAuction: "nonpayable", claimRefund: "nonpayable", claimProceeds: "nonpayable", editAuctionMetadata: "nonpayable",
  setPlatformFee: "nonpayable", setFeeRecipient: "nonpayable", pause: "nonpayable", unpause: "nonpayable",
  getAuction: "view", getTotalAuctions: "view", getBidHistory: "view", getPendingRefund: "view",
};
for (const [name, mutability] of Object.entries(expected)) {
  const found = functions.get(name)?.stateMutability;
  if (found !== mutability) throw new Error(`ABI drift: ${name} must be ${mutability}, got ${found ?? "missing"}`);
}
console.log(`ABI mutability smoke test passed (${Object.keys(expected).length} functions)`);
