import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const maximum = 250;
const ignored = new Set([".git", "node_modules", ".next", "out", "build", "coverage", "dist"]);
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".scss", ".ps1", ".json", ".jsonc", ".yaml", ".yml", ".toml"]);
const violations = [];

async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignored.has(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await visit(file);
      continue;
    }
    if (!entry.isFile() || !extensions.has(path.extname(entry.name))) continue;
    const relative = path.relative(root, file).replaceAll("\\", "/");
    if (/(^|\/)(package-lock|npm-shrinkwrap|pnpm-lock)\.(json|yaml)$/.test(relative)) continue;
    if (/^(data|fixtures)\//.test(relative) && /\.jsonc?$/.test(entry.name)) continue;
    const contents = await readFile(file, "utf8");
    const lines = contents.length === 0 ? 0 : contents.split("\n").length - (contents.endsWith("\n") ? 1 : 0);
    if (lines > maximum) violations.push({ file: path.relative(root, file), lines });
  }
}

await visit(root);
if (violations.length) {
  for (const violation of violations) {
    console.error(violation.file + ": " + violation.lines + " lines (limit " + maximum + ")");
  }
  process.exitCode = 1;
} else {
  console.log("All code/config files are at or below " + maximum + " lines.");
}
