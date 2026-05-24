/*
 * Iriscord — a Discord client mod built on Iriscord foundations
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/** User-facing product name */
export const PRODUCT_NAME = "Iriscord";

/** Short name for compact UI (tooltips, badges) */
export const PRODUCT_SHORT_NAME = "Iris";

/** Config / data directory name (sibling to Discord userData) */
export const DATA_DIR_NAME = "Iriscord";

/** Legacy Iriscord data directory name — used for one-time migration */
export const LEGACY_DATA_DIR_NAME = "Iriscord";

export const LEGACY_DATA_DIR_ALT_NAME = "IriscordData";

/** Default cloud API (override via settings) */
export const DEFAULT_CLOUD_API_URL = "https://api.iriscord.dev/";

/** Project URLs — update when publishing your fork */
export const PROJECT_HOMEPAGE = "https://github.com/iriscord/iriscord";
export const PROJECT_DOWNLOAD = "https://iriscord.dev/download";
export const PROJECT_PLUGINS = "https://iriscord.dev/plugins";
export const PROJECT_DISCORD_INVITE = "https://discord.gg/iriscord";

/** Iriscord brand palette (purple / black cyber aesthetic) */
export const BRAND_COLORS = {
    iris: "#a855f7",
    irisGlow: "#c084fc",
    irisDeep: "#7c3aed",
    void: "#0a0a0f",
    surface: "#12121a",
    accent: "#e879f9",
} as const;
