/*
 * Removes legacy "pnpm" config from package.json (pnpm 10 reads pnpm-workspace.yaml instead).
 * Safe to run repeatedly. Used by bootstrap.ps1 and install.ps1.
 */
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const root = process.argv[2] ? process.argv[2] : process.cwd();
const pkgPath = join(root, "package.json");

if (!existsSync(pkgPath)) {
    console.error("package.json not found in", root);
    process.exit(1);
}

const raw = readFileSync(pkgPath, "utf8");
const pkg = JSON.parse(raw);

if (!pkg.pnpm) {
    process.exit(0);
}

delete pkg.pnpm;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 4) + "\n", "utf8");
console.log("Removed legacy pnpm field from package.json");
