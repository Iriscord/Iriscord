#!/usr/bin/env node
/**
 * Replaces user-facing Vencord branding strings in source (not API identifiers).
 * Run: node scripts/rebrand-user-facing.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const ROOT = join(import.meta.dirname, "..");
const SKIP_DIRS = new Set(["node_modules", "dist", ".git", "packages/iriscord-types/node_modules"]);
const EXT = new Set([".ts", ".tsx", ".mjs", ".js", ".css", ".html", ".md", ".json"]);

const REPLACEMENTS = [
    [/Vencord Settings/g, "Iriscord Settings"],
    [/Vencord Updater/g, "Iriscord Updater"],
    [/Vencord Cloud/g, "Iriscord Cloud"],
    [/Vencord has been updated/g, "Iriscord has been updated"],
    [/A Vencord update is available/g, "An Iriscord update is available"],
    [/Vencord QuickCSS Editor/g, "Iriscord QuickCSS Editor"],
    [/Vencord Host Permissions/g, "Iriscord Host Permissions"],
    [/Vencord Settings Backup/g, "Iriscord Settings Backup"],
    [/Invalid Settings\. Is this even a Vencord Settings file/g, "Invalid Settings. Is this even an Iriscord Settings file"],
    [/Support the development of Vencord/g, "Support the development of Iriscord"],
    [/contributed to Vencord/g, "contributed to Iriscord"],
    [/Development build of Vencord/g, "Development build of Iriscord"],
    [/Vencord Reporter/g, "Iriscord Reporter"],
    [/includeVencordInfoWhenCopying/g, "includeIriscordInfoWhenCopying"],
    [/Also copy Vencord info/g, "Also copy Iriscord info"],
    [/Where to put the Vencord settings section/g, "Where to put the Iriscord settings section"],
    [/panelTitle: "Vencord"/g, 'panelTitle: "Iriscord"'],
    [/title: "Vencord"/g, 'title: "Iriscord"'],
    [/useTitle: \(\) => "Vencord Settings"/g, 'useTitle: () => "Iriscord Settings"'],
    [/wrapTab\(VencordSettings/g, "wrapTab(IriscordSettings"],
    [/function VencordSettings/g, "function IriscordSettings"],
    [/The cutest Discord client mod/g, "A modern Discord client mod — powered by Iris"],
    [/https:\/\/vencord\.dev\//g, "https://iriscord.dev/"],
    [/https:\/\/api\.vencord\.dev\//g, "https://api.iriscord.dev/"],
    [/\*\.vencord\.dev/g, "*.iriscord.dev"],
    [/badges\.vencord\.dev/g, "badges.iriscord.dev"],
];

function walk(dir, files = []) {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (SKIP_DIRS.has(name) && dir === ROOT) continue;
        const st = statSync(p);
        if (st.isDirectory()) {
            if (SKIP_DIRS.has(name)) continue;
            walk(p, files);
        } else if (EXT.has(extname(name))) {
            files.push(p);
        }
    }
    return files;
}

let changed = 0;
for (const file of walk(ROOT)) {
    if (file.includes("rebrand-user-facing")) continue;
    let content = readFileSync(file, "utf8");
    const orig = content;
    for (const [re, sub] of REPLACEMENTS) {
        content = content.replace(re, sub);
    }
    if (content !== orig) {
        writeFileSync(file, content);
        changed++;
        console.log("updated:", file.replace(ROOT + "\\", "").replace(ROOT + "/", ""));
    }
}
console.log(`Done. ${changed} files updated.`);
