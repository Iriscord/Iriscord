/*
 * Iriscord Plugin Lab — runtime test harness (no rebuild required for patches / start)
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addPatch } from "@api/PluginManager";
import { Logger } from "@utils/Logger";
import definePlugin, { Plugin, PluginDef } from "@utils/types";
import { patches } from "../webpack/patchWebpack";

export const LAB_PLUGIN_ID = "IriscordPluginLab";

const logger = new Logger("PluginLab", "#a855f7");

let labStarted = false;
let labStopFn: (() => void) | null = null;

export function isLabActive() {
    return labStarted || patches.some(p => p.plugin === LAB_PLUGIN_ID);
}

export function clearLabPatches() {
    for (let i = patches.length - 1; i >= 0; i--) {
        if (patches[i].plugin === LAB_PLUGIN_ID) {
            patches.splice(i, 1);
        }
    }
}

export function compileLabPlugin(source: string): { plugin?: PluginDef; error?: string } {
    const trimmed = source.trim();
    if (!trimmed) return { error: "Plugin source is empty." };

    try {
        let body = trimmed;
        if (/export\s+default\s+definePlugin\s*\(/.test(body)) {
            body = body.replace(/^\s*export\s+default\s+/, "return ");
        } else if (!body.startsWith("return ")) {
            body = `return ${body}`;
        }
        body = body.replace(/;\s*$/, "");

        const factory = new Function("definePlugin", `"use strict";\n${body}\n`);
        const plugin = factory(definePlugin) as PluginDef | undefined;

        if (!plugin || typeof plugin !== "object") {
            return { error: "Could not read a plugin. Use export default definePlugin({ ... })." };
        }
        if (!plugin.name || typeof plugin.name !== "string") {
            return { error: "Plugin needs a name field." };
        }

        return { plugin };
    } catch (e) {
        return { error: e instanceof Error ? e.message : String(e) };
    }
}

export function applyLabPlugin(plugin: PluginDef): { ok: boolean; message: string } {
    stopLabPlugin();

    const patchCount = plugin.patches?.length ?? 0;

    try {
        for (const patch of plugin.patches ?? []) {
            addPatch(patch, LAB_PLUGIN_ID);
        }

        if (plugin.start) {
            const ctx = { ...plugin, started: false } as Plugin;
            plugin.start.call(ctx);
            labStarted = true;
            labStopFn = plugin.stop ? () => plugin.stop!.call(ctx) : null;
        }

        const parts = [];
        if (patchCount) parts.push(`${patchCount} patch(es) armed`);
        if (plugin.start) parts.push("start() ran");
        return {
            ok: true,
            message: parts.length
                ? `${parts.join(", ")}. Patches apply when Discord loads matching modules — try changing channels or opening menus.`
                : "Nothing to apply — add patches or a start() function."
        };
    } catch (e) {
        clearLabPatches();
        logger.error("applyLabPlugin failed", e);
        return { ok: false, message: e instanceof Error ? e.message : String(e) };
    }
}

export function stopLabPlugin() {
    if (labStopFn) {
        try {
            labStopFn();
        } catch (e) {
            logger.error("Lab stop() failed", e);
        }
    }
    labStopFn = null;
    labStarted = false;

    clearLabPatches();
}

export function applyLabPatch(patch: Omit<import("@utils/types").Patch, "plugin">) {
    stopLabPlugin();
    addPatch(patch, LAB_PLUGIN_ID);
}

export const PLUGIN_LAB_TEMPLATE = `import definePlugin from "@utils/types";

export default definePlugin({
    name: "MyPlugin",
    description: "Test plugin from Plugin Lab",
    authors: [{ name: "Me", id: 0n }],

  // Patches apply live — navigate Discord to load modules
    patches: [
        {
            find: "REPLACE_ME",
            replacement: {
                match: /REPLACE_ME/,
                replace: "REPLACE_ME"
            }
        }
    ],

    start() {
        console.info("[MyPlugin] Plugin Lab: start() is live");
    },

    stop() {
        console.info("[MyPlugin] Plugin Lab: stopped");
    }
});
`;

// Satisfy bundler if tree-shaken
void definePlugin;
