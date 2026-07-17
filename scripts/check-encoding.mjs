import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const roots = ["src", "public", "docs", "scripts"];
const extraFiles = ["CHANGELOG.md", "PROJECT_ANALYSIS.md"];
const extensions = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".css", ".sql", ".md", ".html"]);
const mojibakePatterns = [
  "\u00c3",
  "\u00c2",
  "\u00e2\u20ac",
  "\ufffd",
  "\u00ef\u00bf\u00bd",
];

const extensionOf = (path) => {
  const match = /\.[^.]+$/.exec(path);
  return match?.[0] ?? "";
};

const walk = (dir, files = []) => {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === "dist" || entry === ".git") continue;
      walk(path, files);
    } else if (extensions.has(extensionOf(path))) {
      files.push(path);
    }
  }
  return files;
};

const files = [
  ...roots.flatMap((root) => {
    try {
      return walk(root);
    } catch {
      return [];
    }
  }),
  ...extraFiles,
];

const findings = [];

for (const file of files) {
  let content = "";
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (file.endsWith(join("features", "importExport", "parser.ts")) && line.includes("return /")) {
      return;
    }
    if (mojibakePatterns.some((pattern) => line.includes(pattern))) {
      findings.push(`${relative(process.cwd(), file)}:${index + 1}: ${line.trim()}`);
    }
  });
}

if (findings.length > 0) {
  console.error("Mojibake/Encoding-Muster gefunden:");
  console.error(findings.slice(0, 80).join("\n"));
  if (findings.length > 80) console.error(`... ${findings.length - 80} weitere Treffer`);
  process.exit(1);
}

console.log("Encoding check passed.");
