#!/usr/bin/env node
/**
 * Replaces user-facing Iriscord branding strings in source (not API identifiers).
 * Run: node scripts/rebrand-user-facing.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const ROOT = join(import.meta.dirname, "..");
const SKIP_DIRS = new Set(["node_modules", "dist", ".git", "packages/iriscord-types/node_modules"]);
const SKIP_FILES = new Set([
    "scripts/build/inject/react.mjs",
]);
const EXT = new Set([".ts", ".tsx", ".mjs", ".js", ".css", ".html", ".md", ".json"]);

const REPLACEMENTS = [
    [/Iriscord Settings/g, "Iriscord Settings"],
    [/Iriscord Updater/g, "Iriscord Updater"],
    [/Iriscord Cloud/g, "Iriscord Cloud"],
    [/Iriscord has been updated/g, "Iriscord has been updated"],
    [/A Iriscord update is available/g, "An Iriscord update is available"],
    [/Iriscord QuickCSS Editor/g, "Iriscord QuickCSS Editor"],
    [/Iriscord Host Permissions/g, "Iriscord Host Permissions"],
    [/Iriscord Settings Backup/g, "Iriscord Settings Backup"],
    [/Invalid Settings\. Is this even a Iriscord Settings file/g, "Invalid Settings. Is this even an Iriscord Settings file"],
    [/Support the development of Iriscord/g, "Support the development of Iriscord"],
    [/contributed to Iriscord/g, "contributed to Iriscord"],
    [/Development build of Iriscord/g, "Development build of Iriscord"],
    [/Iriscord Reporter/g, "Iriscord Reporter"],
    [/includeIriscordInfoWhenCopying/g, "includeIriscordInfoWhenCopying"],
    [/Also copy Iriscord info/g, "Also copy Iriscord info"],
    [/Where to put the Iriscord settings section/g, "Where to put the Iriscord settings section"],
    [/panelTitle: "Iriscord"/g, 'panelTitle: "Iriscord"'],
    [/title: "Iriscord"/g, 'title: "Iriscord"'],
    [/useTitle: \(\) => "Iriscord Settings"/g, 'useTitle: () => "Iriscord Settings"'],
    [/wrapTab\(IriscordSettings/g, "wrapTab(IriscordSettings"],
    [/function IriscordSettings/g, "function IriscordSettings"],
    [/The cutest Discord client mod/g, "A modern Discord client mod — powered by Iris"],
    [/https:\/\/Iriscord\.dev\//g, "https://iriscord.dev/"],
    [/https:\/\/api\.Iriscord\.dev\//g, "https://api.iriscord.dev/"],
    [/\*\.Iriscord\.dev/g, "*.iriscord.dev"],
    [/badges\.Iriscord\.dev/g, "badges.iriscord.dev"],
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
    const rel = file.replace(ROOT + "\\", "").replace(ROOT + "/", "");
    if (SKIP_FILES.has(rel)) continue;
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
