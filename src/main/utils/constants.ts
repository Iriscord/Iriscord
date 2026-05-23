/*
 * Iriscord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { existsSync, mkdirSync } from "fs";
import { app } from "electron";
import { join } from "path";

import { DATA_DIR_NAME, LEGACY_DATA_DIR_ALT_NAME, LEGACY_DATA_DIR_NAME } from "../../shared/branding";

function resolveDataDir(): string {
    if (process.env.IRISCORD_USER_DATA_DIR) return process.env.IRISCORD_USER_DATA_DIR;
    if (process.env.Iriscord_USER_DATA_DIR) return process.env.Iriscord_USER_DATA_DIR;

    const base = process.env.DISCORD_USER_DATA_DIR
        ? join(process.env.DISCORD_USER_DATA_DIR, "..")
        : join(app.getPath("userData"), "..");

    const iriscordDir = join(base, DATA_DIR_NAME);
    if (existsSync(iriscordDir)) return iriscordDir;

    // Migrate from Iriscord install: prefer existing settings folder
    const legacy = join(base, LEGACY_DATA_DIR_NAME);
    if (existsSync(legacy)) return legacy;

    const legacyAlt = join(base, LEGACY_DATA_DIR_ALT_NAME);
    if (existsSync(legacyAlt)) return legacyAlt;

    return iriscordDir;
}

export const DATA_DIR = resolveDataDir();
export const SETTINGS_DIR = join(DATA_DIR, "settings");
export const THEMES_DIR = join(DATA_DIR, "themes");

/** Where to place plugins for manual install (see userplugins/README.md) */
export const USER_PLUGINS_DIR = (() => {
    const devSrc = join(DATA_DIR, "src", "userplugins");
    if (process.env.IRISCORD_DEV_INSTALL || process.env.Iriscord_DEV_INSTALL) {
        mkdirSync(devSrc, { recursive: true });
        return devSrc;
    }
    const dir = join(DATA_DIR, "userplugins");
    mkdirSync(dir, { recursive: true });
    return dir;
})();
export const QUICK_CSS_PATH = join(SETTINGS_DIR, "quickCss.css");
export const SETTINGS_FILE = join(SETTINGS_DIR, "settings.json");
export const NATIVE_SETTINGS_FILE = join(SETTINGS_DIR, "native-settings.json");
export const ALLOWED_PROTOCOLS = [
    "https:",
    "http:",
    "steam:",
    "spotify:",
    "com.epicgames.launcher:",
    "tidal:",
    "itunes:",
];

export const IS_VANILLA = /* @__PURE__ */ process.argv.includes("--vanilla");
