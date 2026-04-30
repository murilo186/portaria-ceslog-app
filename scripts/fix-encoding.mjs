import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const textExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
  ".html",
  ".md",
  ".yml",
  ".yaml",
  ".env",
]);
const ignoredDirectories = new Set([".git", "node_modules", "dist", "build", "coverage", ".next"]);

let normalizedCount = 0;

function walk(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) {
        continue;
      }

      walk(fullPath);
      continue;
    }

    const extension = path.extname(entry.name);
    if (!textExtensions.has(extension)) {
      continue;
    }

    const fileBuffer = fs.readFileSync(fullPath);
    const hasBom = fileBuffer.length >= 3 && fileBuffer[0] === 0xef && fileBuffer[1] === 0xbb && fileBuffer[2] === 0xbf;

    if (!hasBom) {
      continue;
    }

    const withoutBom = fileBuffer.subarray(3);
    fs.writeFileSync(fullPath, withoutBom);
    normalizedCount += 1;
  }
}

walk(repoRoot);
console.log(`Arquivos normalizados para UTF-8 sem BOM: ${normalizedCount}`);