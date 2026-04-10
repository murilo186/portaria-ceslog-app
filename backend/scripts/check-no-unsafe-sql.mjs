import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const rootDir = process.cwd();
const scanDirs = [join(rootDir, "src"), join(rootDir, "tests"), join(rootDir, "prisma")];
const fileExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs"]);
const unsafePattern = /\b(queryRawUnsafe|executeRawUnsafe)\b/;

function walk(dirPath, onFile) {
  const entries = readdirSync(dirPath);

  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      walk(fullPath, onFile);
      continue;
    }

    onFile(fullPath);
  }
}

const violations = [];

for (const directory of scanDirs) {
  walk(directory, (filePath) => {
    const extension = filePath.slice(filePath.lastIndexOf("."));

    if (!fileExtensions.has(extension)) {
      return;
    }

    const content = readFileSync(filePath, "utf8");
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      if (!unsafePattern.test(line)) {
        return;
      }

      violations.push({
        file: relative(rootDir, filePath),
        line: index + 1,
        text: line.trim(),
      });
    });
  });
}

if (violations.length > 0) {
  console.error("Unsafe SQL API detected. Use Prisma query builder or parameterized $queryRaw.");
  for (const item of violations) {
    console.error(`- ${item.file}:${item.line} -> ${item.text}`);
  }
  process.exit(1);
}

console.log("OK: no queryRawUnsafe/executeRawUnsafe usage found.");
