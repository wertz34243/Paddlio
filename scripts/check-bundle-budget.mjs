import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const distDir = path.join(root, "dist");
const assetsDir = path.join(distDir, "assets");
const failures = [];

if (!fs.existsSync(assetsDir)) {
  console.log("Bundle budget check skipped: dist/assets does not exist. Run npm.cmd run build first.");
  process.exit(0);
}

const assets = fs.readdirSync(assetsDir).map((name) => ({
  name,
  size: fs.statSync(path.join(assetsDir, name)).size,
}));

const mainJs = assets
  .filter((asset) => /^index-.*\.js$/.test(asset.name))
  .sort((a, b) => b.size - a.size)[0];
const indexHtml = fs.existsSync(path.join(distDir, "index.html"))
  ? fs.readFileSync(path.join(distDir, "index.html"), "utf8")
  : "";
const xlsxChunk = assets.find((asset) => /^xlsx-.*\.js$/.test(asset.name));

if (!mainJs) {
  failures.push("No main index JS chunk found.");
} else if (mainJs.size > 650_000) {
  failures.push(`Main JS chunk too large: ${mainJs.name} is ${mainJs.size} bytes, budget is 650000 bytes.`);
}

if (!xlsxChunk) {
  failures.push("XLSX is not isolated in its own chunk.");
} else if (indexHtml.includes(xlsxChunk.name)) {
  failures.push(`XLSX chunk ${xlsxChunk.name} is referenced by index.html and would load initially.`);
}

for (const asset of assets) {
  const isKnownVendor = /^xlsx-.*\.js$/.test(asset.name) || /^supabase-.*\.js$/.test(asset.name);
  const isMain = mainJs && asset.name === mainJs.name;
  if (asset.name.endsWith(".js") && !isKnownVendor && !isMain && asset.size > 250_000) {
    failures.push(`Feature JS chunk too large: ${asset.name} is ${asset.size} bytes, budget is 250000 bytes.`);
  }
}

if (failures.length > 0) {
  console.error("Bundle budget check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Bundle budget check passed. Main JS: ${mainJs?.name ?? "n/a"} ${mainJs?.size ?? 0} bytes.`);
