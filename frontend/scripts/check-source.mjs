import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const frontend = fileURLToPath(new URL("../", import.meta.url));
const src = join(frontend, "src");
const distMode = process.argv.includes("--dist");
const sourceTypes = new Set([".ts", ".tsx", ".js", ".jsx"]);
const extensions = ["", ...sourceTypes, ".json", ".css", "/index.ts", "/index.tsx"];
const retired = /DemoShowcasePage|DemoAuctionDetailsPage|DemoLauncher|DemoAuctionCard|blockbid:showcase:v1:|(?:^|["'/])(?:demo|showcase)(?:\/|["'])/i;
const problems = [];
let imports = 0;

function inspect(root, kind) {
  function visit(path) {
    const name = relative(root, path).split(sep).join("/");
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) {
      problems.push(kind + "/" + name + " is a link");
      return;
    }
    if (stat.isDirectory()) {
      if (name && ((kind === "public") || (kind === "dist" && name !== "assets") || /(?:^|\/)(?:demo|showcase|fixtures|scripts|tests?)(?:\/|$)/i.test(name))) {
        problems.push(kind + "/" + name + " is an unexpected directory");
      }
      for (const entry of readdirSync(path)) visit(join(path, entry));
      return;
    }
    const extension = extname(name);
    const expected = kind === "src" ? (sourceTypes.has(extension) || [".css", ".json"].includes(extension) || name === "contracts/contractConfig,ts")
      : kind === "public" ? name === "blockbid-mark.svg"
      : /^(?:index\.html|blockbid-mark\.svg|assets\/[\w.-]+-[\w-]+\.(?:css|js))$/.test(name);
    if (!stat.isFile() || !expected || retired.test(name)) {
      problems.push(kind + "/" + name + " is an unexpected file");
      return;
    }
    const content = readFileSync(path, "utf8");
    if (retired.test(content)) problems.push(name + " contains retired content");
    if (kind !== "src" || !sourceTypes.has(extension)) return;
    for (const [, specifier] of content.matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["'](\.[^"']+)["']/g)) {
      const target = resolve(dirname(path), specifier);
      const local = relative(src, target);
      if (!local || local === ".." || local.startsWith(".." + sep)) problems.push(name + " imports outside production sources");
      if (!extensions.some(suffix => existsSync(target + suffix))) problems.push(name + " cannot resolve " + specifier);
      imports++;
    }
  }
  visit(root);
}

if (distMode) {
  const dist = join(frontend, "dist");
  for (const name of ["index.html", "blockbid-mark.svg"]) {
    if (!existsSync(join(dist, name))) problems.push("Missing build file " + name);
  }
  inspect(dist, "dist");
} else {
  inspect(src, "src");
  inspect(join(frontend, "public"), "public");
  if (retired.test(readFileSync(join(frontend, "index.html"), "utf8"))) problems.push("Retired HTML entry");
}
if (problems.length) {
  console.error(problems.join("\n"));
  process.exitCode = 1;
} else {
  console.log(distMode ? "Production build inventory checked." : "Production source and public assets checked. Relative imports: " + imports);
}
