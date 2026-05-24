/*
 * Iriscord native Discord installer (no external Iriscord CLI)
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./checkNodeVersion.js";

import {
    closeSync,
    copyFileSync,
    existsSync,
    mkdirSync,
    openSync,
    readdirSync,
    renameSync,
    rmSync,
    writeFileSync,
    writeSync
} from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";

import {
    DATA_DIR_NAME,
    DISCORD_BRANCHES,
    DIST_FILES,
    GITHUB_REPO,
    PRODUCT,
    RELEASES_API,
    RELEASES_FALLBACK
} from "./installConfig.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const args = process.argv.slice(2);
const flags = new Set(args.filter(a => a.startsWith("-")));
const branchArg = args.find((a, i) => args[i - 1] === "-branch") || "auto";

const isInstall = flags.has("--install") || (!flags.has("--uninstall") && !flags.has("--repair"));
const isUninstall = flags.has("--uninstall");
const isRepair = flags.has("--repair");

function log(level, msg) {
    const prefix = { INFO: "INFO ", OK: "OK   ", WARN: "WARN ", ERR: "ERROR" }[level] || "";
    console.log(`${prefix} ${msg}`);
}

function resolveDataDir() {
    if (process.env.IRISCORD_USER_DATA_DIR) return resolve(process.env.IRISCORD_USER_DATA_DIR);
    if (process.env.IRISCORD_USER_DATA_DIR) return resolve(process.env.IRISCORD_USER_DATA_DIR);

    const base = process.env.DISCORD_USER_DATA_DIR
        ? join(process.env.DISCORD_USER_DATA_DIR, "..")
        : join(process.env.APPDATA || join(homedir(), "AppData", "Roaming"));

    for (const name of [DATA_DIR_NAME, "Iriscord", "IriscordData"]) {
        const p = join(base, name);
        if (existsSync(p)) return p;
    }
    return join(base, DATA_DIR_NAME);
}

const isDevInstall = process.env.IRISCORD_DEV_INSTALL === "1"
    || process.env.IRISCORD_DEV_INSTALL === "1";

const dataDir = resolveDataDir();
const filesDir = join(dataDir, "dist");
const patcherPath = join(filesDir, "patcher.js").replace(/\\/g, "/");

function findDiscordInstalls() {
    const localAppData = process.env.LOCALAPPDATA;
    if (!localAppData) return [];

    const installs = [];
    const branches = branchArg === "auto"
        ? Object.entries(DISCORD_BRANCHES)
        : [[branchArg, DISCORD_BRANCHES[branchArg]]].filter(([, dir]) => dir);

    for (const [branch, folder] of branches) {
        const root = join(localAppData, folder);
        if (!existsSync(root)) continue;

        const parsed = parseDiscordRoot(root, branch);
        if (parsed) installs.push(parsed);
    }
    return installs;
}

function parseDiscordRoot(root, branch) {
    let appPath = "";
    let isPatched = false;

    for (const ent of readdirSync(root, { withFileTypes: true })) {
        if (!ent.isDirectory() || !ent.name.startsWith("app-")) continue;
        const resources = join(root, ent.name, "resources");
        if (!existsSync(resources)) continue;
        const app = join(resources, "app");
        if (app > appPath) {
            appPath = app;
            isPatched = existsSync(join(resources, "_app.asar"));
        }
    }

    if (!appPath) return null;
    return {
        branch,
        root,
        resourcesDir: join(appPath, ".."),
        appPath,
        isPatched
    };
}

/** @see Iriscord/Installer app_asar.go WriteAppAsar */
function writeAppAsar(outFile, patcher) {
    const packageJson = '{\n\t"name": "discord",\n\t"main": "index.js"\n}';
    const indexJs = `require(${JSON.stringify(patcher)})`;

    const header = JSON.stringify({
        files: {
            "index.js": { size: Buffer.byteLength(indexJs), offset: "0" },
            "package.json": {
                size: Buffer.byteLength(packageJson),
                offset: String(Buffer.byteLength(indexJs))
            }
        }
    });
    let headerString = header;
    const dataSize = 4;
    const alignedSize = (headerString.length + dataSize - 1) & ~(dataSize - 1);
    const headerSize = alignedSize + 8;
    const headerObjectSize = alignedSize + dataSize;
    const diff = alignedSize - headerString.length;
    if (diff > 0) headerString += "0".repeat(diff);

    const fileContents = indexJs + packageJson;
    const fd = openSync(outFile, "w");
    try {
        const writeU32 = n => {
            const b = Buffer.alloc(4);
            b.writeInt32LE(n, 0);
            writeSync(fd, b);
        };
        writeU32(dataSize);
        writeU32(headerSize);
        writeU32(headerObjectSize);
        writeU32(headerString.length);
        writeSync(fd, headerString, "utf8");
        writeSync(fd, fileContents, "utf8");
    } finally {
        closeSync(fd);
    }
}

function patchAppAsar(resourcesDir) {
    const appAsar = join(resourcesDir, "app.asar");
    const backup = join(resourcesDir, "_app.asar");

    if (!existsSync(appAsar) && !existsSync(backup)) {
        throw new Error(`app.asar not found in ${resourcesDir}`);
    }

    if (existsSync(appAsar)) {
        if (existsSync(backup)) rmSync(appAsar, { force: true });
        else renameSync(appAsar, backup);
    }

    writeAppAsar(appAsar, patcherPath);
}

function unpatchAppAsar(resourcesDir) {
    const appAsar = join(resourcesDir, "app.asar");
    const backup = join(resourcesDir, "_app.asar");
    const tmp = join(resourcesDir, "app.asar.tmp");

    if (!existsSync(backup)) {
        throw new Error("Discord does not appear to be patched (_app.asar missing)");
    }

    if (existsSync(appAsar)) {
        if (existsSync(tmp)) rmSync(tmp);
        renameSync(appAsar, tmp);
    }
    renameSync(backup, appAsar);
    if (existsSync(tmp)) rmSync(tmp, { force: true });
}

async function fetchJson(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": `${PRODUCT}-Installer (${GITHUB_REPO})` }
    });
    if (!res.ok) throw new Error(`${url} returned ${res.status}`);
    return res.json();
}

async function downloadFile(url, dest) {
    const res = await fetch(url, {
        headers: { "User-Agent": `${PRODUCT}-Installer` }
    });
    if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
    mkdirSync(dirname(dest), { recursive: true });
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(dest, buf);
}

function copyDistFrom(srcDir, destDir) {
    mkdirSync(destDir, { recursive: true });
    writeFileSync(join(destDir, "package.json"), "{}");
    let copied = 0;
    for (const name of DIST_FILES) {
        const src = join(srcDir, name);
        if (!existsSync(src)) continue;
        copyFileSync(src, join(destDir, name));
        copied++;
    }
    if (copied === 0 || !existsSync(join(destDir, "patcher.js"))) {
        throw new Error(`No dist files in ${srcDir}. Run pnpm build first.`);
    }
}

async function installLatestBuilds() {
    if (isDevInstall) {
        if (!existsSync(patcherPath)) {
            throw new Error(`Dev install: missing ${patcherPath}. Run pnpm build first.`);
        }
        log("INFO", `Using dev build at ${filesDir}`);
        return;
    }

    const localDist = process.env.IRISCORD_LOCAL_DIST
        ? resolve(process.env.IRISCORD_LOCAL_DIST)
        : join(REPO_ROOT, "dist");

    if (process.env.IRISCORD_USE_LOCAL_DIST === "1" && existsSync(join(localDist, "patcher.js"))) {
        copyDistFrom(localDist, filesDir);
        log("OK", `Copied build to ${filesDir}`);
        return;
    }

    mkdirSync(filesDir, { recursive: true });
    writeFileSync(join(filesDir, "package.json"), "{}");

    let release;
    try {
        release = await fetchJson(RELEASES_API);
    } catch (e) {
        if (RELEASES_FALLBACK) release = await fetchJson(RELEASES_FALLBACK);
        else throw new Error(`Could not fetch release: ${e.message}. Build locally or publish a GitHub release.`);
    }

    const assets = release.assets || [];
    const needed = DIST_FILES.filter(name =>
        assets.some(a => a.name === name)
    );

    if (needed.length === 0) {
        throw new Error("No dist assets found on latest GitHub release. Run pnpm build and publish a release.");
    }

    log("INFO", `Downloading ${PRODUCT} ${release.tag_name || release.name}...`);

    await Promise.all(needed.map(async name => {
        const asset = assets.find(a => a.name === name);
        if (!asset) return;
        await downloadFile(asset.browser_download_url, join(filesDir, name));
    }));

    log("OK", `Installed build to ${filesDir}`);
}

async function patchInstall(install) {
    log("INFO", `Patching ${install.root}...`);
    await installLatestBuilds();

    if (install.isPatched) {
        log("INFO", "Already patched - unpatching first...");
        unpatchAppAsar(install.resourcesDir);
    }

    patchAppAsar(install.resourcesDir);
    log("OK", `Successfully patched ${install.root}`);
}

async function unpatchInstall(install) {
    log("INFO", `Unpatching ${install.root}...`);
    if (!install.isPatched) {
        log("WARN", "Not patched - nothing to do");
        return;
    }
    unpatchAppAsar(install.resourcesDir);
    log("OK", `Successfully unpatched ${install.root}`);
}

async function main() {
    const installs = findDiscordInstalls();
    if (installs.length === 0) {
        throw new Error("No Discord installation found. Install Discord first.");
    }

    let targets = installs;
    if (branchArg !== "auto") {
        targets = installs.filter(i => i.branch === branchArg);
        if (targets.length === 0) {
            throw new Error(`No Discord ${branchArg} install found.`);
        }
    } else if (installs.length > 1 && isInstall) {
        targets = [installs[0]];
        log("INFO", `Multiple installs found - patching ${targets[0].root}`);
    }

    for (const install of targets) {
        if (process.platform === "win32") {
            const { execSync } = await import("child_process");
            const exe = `${DISCORD_BRANCHES[install.branch]}.exe`;
            try { execSync(`taskkill /IM ${exe} /F`, { stdio: "ignore" }); } catch { }
        }

        if (isUninstall) await unpatchInstall(install);
        else if (isRepair) {
            if (install.isPatched) await unpatchInstall(install);
            await patchInstall({ ...install, isPatched: false });
        } else await patchInstall(install);
    }

    console.log("Success!");
}

main().catch(err => {
    console.error("FATAL", err.message || err);
    process.exit(1);
});
