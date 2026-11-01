// Zero-dependency missing import guard and demo isolation smoke check.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../src/", import.meta.url));
const extensions = ["", ".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".svg", ".png", ".webp", ".jpg", ".jpeg", "/index.ts", "/index.tsx"];
const fileTypes = new Set([".ts", ".tsx", ".js", ".jsx"]);
const problems = [];
let checked = 0;
function filesAt(path) {
  for (const item of readdirSync(path)) {
    const full = join(path, item);
    if (statSync(full).isDirectory()) filesAt(full);
    else if (fileTypes.has(extname(item))) verify(full);
  }
}
function verify(path) {
  const content = readFileSync(path, "utf8");
  const re = /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["'](\.[^"']+)["']/g;
  for (const match of content.matchAll(re)) {
    const target = resolve(dirname(path), match[1]);
    if (!extensions.some((ending) => existsSync(target + ending))) {
      problems.push(path.slice(root.length) + ": missing " + match[1]);
    }
    checked++;
  }
}
filesAt(root);
for (const path of ["pages/DemoShowcasePage.tsx", "pages/DemoAuctionDetailsPage.tsx", "components/DemoAuctionCard.tsx", "demo/catalog.ts", "demo/localSimulation.ts"]) {
  const content = readFileSync(join(root, path), "utf8");
  if (/\b(?:eth_requestAccounts|placeBid\s*\(|getWriteContract\s*\(|window\.ethereum|blockBidService|WalletContext|useWallet|\/contracts\/)/.test(content)) {
    problems.push(path + ": demo must not call wallet or contract services");
  }
}
if (problems.length) {
  for (const problem of problems) console.error("ERROR: " + problem);
  process.exitCode = 1;
} else {
  console.log("Source guard passed: " + checked + " relative imports resolved; demo pages contain no wallet/contract calls.");
}
