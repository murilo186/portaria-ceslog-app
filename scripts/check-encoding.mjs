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
const suspiciousMojibakePattern = /Ã[\x80-\xBF]/;

const bomFiles = [];
const mojibakeFiles = [];

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
    if (hasBom) {
      bomFiles.push(path.relative(repoRoot, fullPath));
    }

    const fileText = fileBuffer.toString("utf8");
    if (suspiciousMojibakePattern.test(fileText)) {
      mojibakeFiles.push(path.relative(repoRoot, fullPath));
    }
  }
}

walk(repoRoot);

if (bomFiles.length > 0) {
  console.error("Arquivos com BOM (UTF-8 com BOM detectado):");
  for (const file of bomFiles) {
    console.error(`- ${file}`);
  }
}

if (mojibakeFiles.length > 0) {
  console.error("Arquivos com possível mojibake (padrão de bytes mal decodificados):");
  for (const file of mojibakeFiles) {
    console.error(`- ${file}`);
  }
}

if (bomFiles.length > 0 || mojibakeFiles.length > 0) {
  process.exit(1);
}

console.log("Encoding OK: UTF-8 sem BOM e sem sinais de mojibake detectados.");
