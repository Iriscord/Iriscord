/*
 * Iriscord installer configuration
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export const PRODUCT = "Iriscord";
export const DATA_DIR_NAME = "Iriscord";

/** GitHub repo for releases and raw bootstrap files */
export const GITHUB_REPO = process.env.IRISCORD_GITHUB_REPO || "iriscord/iriscord";

export const RELEASES_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
export const RELEASES_FALLBACK = process.env.IRISCORD_RELEASES_FALLBACK || "";

export const RAW_BASE = `https://github.com/${GITHUB_REPO}/raw/main`;

/** Dist files copied into %AppData%/Iriscord/dist on install */
export const DIST_FILES = [
    "patcher.js",
    "patcher.js.map",
    "preload.js",
    "preload.js.map",
    "renderer.js",
    "renderer.js.map",
    "renderer.css",
    "renderer.css.map",
    "iriscordDesktopRenderer.js",
    "iriscordDesktopRenderer.js.map",
    "iriscordDesktopPreload.js",
    "iriscordDesktopPreload.js.map",
    "iriscordDesktopMain.js",
    "iriscordDesktopMain.js.map"
];

export const DISCORD_BRANCHES = {
    stable: "Discord",
    ptb: "DiscordPTB",
    canary: "DiscordCanary",
    dev: "DiscordDevelopment"
};
