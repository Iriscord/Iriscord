/*
 * Iriscord installer entry (native — no Iriscord CLI download)
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { spawnSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const installScript = join(__dirname, "installDiscord.mjs");

const argStart = process.argv.indexOf("--");
const args = argStart === -1 ? [] : process.argv.slice(argStart + 1);

const result = spawnSync(process.execPath, [installScript, ...args], {
    stdio: "inherit",
    env: process.env
});

process.exit(result.status ?? 1);
