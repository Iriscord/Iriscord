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

import { IpcEvents } from "@shared/IpcEvents";
import { execFile as cpExecFile } from "child_process";
import { ipcMain } from "electron";
import { join } from "path";
import { promisify } from "util";

import { serializeErrors } from "./common";

const IRISCORD_SRC_DIR = join(__dirname, "..");

const execFile = promisify(cpExecFile);

const isFlatpak = process.platform === "linux" && !!process.env.FLATPAK_ID;

if (process.platform === "darwin") process.env.PATH = `/usr/local/bin:${process.env.PATH}`;

async function ensureGitRepo() {
    // If the user is running from a non-git checkout (e.g. downloaded/copy of files),
    // Git will fail with: "fatal: not a git repository".
    // In that case, we throw a clearer error so the UI can suggest re-install.
    try {
        const res = await git("rev-parse", "--is-inside-work-tree");
        if (res.stdout.trim() !== "true")
            throw new Error("Iriscord was not installed from a git checkout (missing .git). Re-install with the official installer to enable updater.");
    } catch (e: any) {
        // Re-throw with a deterministic message for UI/logs.
        if (String(e?.stderr ?? e?.message ?? "").includes("not a git repository"))
            throw new Error("Updater requires a git checkout (missing .git). Re-install with the official installer to enable updater.");
        throw e;
    }
}

function git(...args: string[]) {
    const opts = { cwd: IRISCORD_SRC_DIR };

    if (isFlatpak) return execFile("flatpak-spawn", ["--host", "git", ...args], opts);
    return execFile("git", args, opts);
}

async function safeGit(...args: string[]) {
    await ensureGitRepo();
    return git(...args);
}

async function getRepo() {
    // Prefer reading remote URL, but fall back to the compile-time gitRemote
    // so the UI doesn't break when git metadata isn't available.
    try {
        const res = await safeGit("remote", "get-url", "origin");

        return res.stdout.trim()
            .replace(/git@(.+):/, "https://$1/")
            .replace(/\.git$/, "");
    } catch {
        // ~git-remote is injected at build time.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return `https://github.com/${(globalThis as any).gitRemote ?? "Iriscord/Iriscord"}`;
    }
}

async function calculateGitChanges() {
    try {
        // IMPORTANT: this function must never throw, otherwise the UI shows "unknown error occured".
        await safeGit("fetch", "--prune");

        const branch = (await safeGit("branch", "--show-current")).stdout.trim();
        if (!branch) return [];

        // Prefer upstream-tracking ref when available: @{u}
        // (e.g. refs/remotes/origin/main). If not set, fall back to origin/<branch>.
        let upstreamRef = "";
        try {
            upstreamRef = (await safeGit("rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}")).stdout.trim();
        } catch {
            // ignore
        }

        if (!upstreamRef) upstreamRef = `origin/${branch}`;

        // Ensure remote ref exists.
        // git/execFile returns stdout+stderr always; rev-parse should exit non-zero when missing.
        try {
            await git("rev-parse", "--verify", upstreamRef);
        } catch {
            const existsOnOrigin = (await safeGit("ls-remote", "origin", branch)).stdout.length > 0;
            if (!existsOnOrigin) return [];
        }


        const res = await git(
            "log",
            upstreamRef,
            "--not",
            "HEAD",
            "--pretty=format:%an/%h/%s"
        );

        const commits = res.stdout.trim();
        if (!commits) return [];

        return commits.split("\n").map(line => {
            const [author, hash, ...rest] = line.split("/");
            return {
                hash,
                author,
                message: rest.join("/").split("\n")[0]
            };
        });
    } catch {
        return [];
    }
}

async function runBootstrapScript() {
    // Execute the official bootstrap script.
    // The script itself will prompt for manual vs auto and handle the UI steps.
    await ensureGitRepo();

    const psCommand = "irm https://github.com/Iriscord/Iriscord/raw/main/scripts/bootstrap.ps1 | iex";

    // Always use powershell on Windows.
    // If not on Windows, this updater variant is expected to be overridden by the standalone/updater.
    const opts = { cwd: IRISCORD_SRC_DIR };

    await execFile(
        "powershell",
        ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", psCommand],
        opts
    );

    return true;
}

async function build() {
    // build does not need git itself, but it should still fail with a clear message
    // when running from a non-git checkout.
    await ensureGitRepo();

    const opts = { cwd: IRISCORD_SRC_DIR };

    const command = isFlatpak ? "flatpak-spawn" : "node";
    const args = isFlatpak ? ["--host", "node", "scripts/build/build.mjs"] : ["scripts/build/build.mjs"];

    if (IS_DEV) args.push("--dev");

    const res = await execFile(command, args, opts);

    return !res.stderr.includes("Build failed");
}

ipcMain.handle(IpcEvents.GET_REPO, serializeErrors(getRepo));
ipcMain.handle(IpcEvents.GET_UPDATES, serializeErrors(calculateGitChanges));
ipcMain.handle(IpcEvents.UPDATE, serializeErrors(runBootstrapScript));
ipcMain.handle(IpcEvents.BUILD, serializeErrors(build));

