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

import { fetchJson } from "@main/utils/http";
import { IRISCORD_USER_AGENT } from "@shared/iriscordUserAgent";
import { IpcEvents } from "@shared/IpcEvents";
import { execFile as cpExecFile } from "child_process";
import { existsSync } from "fs";
import { ipcMain } from "electron";
import { homedir } from "os";
import { join } from "path";
import { promisify } from "util";

import gitHash from "~git-hash";
import gitRemote from "~git-remote";

import { serializeErrors } from "./common";

const execFile = promisify(cpExecFile);

const isFlatpak = process.platform === "linux" && !!process.env.FLATPAK_ID;

if (process.platform === "darwin") process.env.PATH = `/usr/local/bin:${process.env.PATH}`;

function resolveSrcDir() {
    const localAppData = process.env.LOCALAPPDATA || join(homedir(), "AppData", "Local");
    const candidates = [
        process.env.IRISCORD_SOURCE_DIR,
        process.env.Iriscord_SOURCE_DIR,
        join(localAppData, "Iriscord", "source"),
        join(__dirname, ".."),
        join(__dirname, "../.."),
    ].filter((d): d is string => !!d);

    for (const dir of candidates) {
        if (existsSync(join(dir, ".git"))) return dir;
    }

    return join(__dirname, "..");
}

const Iriscord_SRC_DIR = resolveSrcDir();
const hasGitRepo = existsSync(join(Iriscord_SRC_DIR, ".git"));

function git(...args: string[]) {
    const opts = { cwd: Iriscord_SRC_DIR };

    if (isFlatpak) return execFile("flatpak-spawn", ["--host", "git", ...args], opts);
    else return execFile("git", args, opts);
}

function normalizeRemoteUrl(url: string) {
    return url.trim()
        .replace(/git@(.+):/, "https://$1/")
        .replace(/\.git$/, "");
}

async function getRepoFromGit() {
    const res = await git("remote", "get-url", "origin");
    return normalizeRemoteUrl(res.stdout);
}

async function getRepo() {
    if (hasGitRepo) {
        try {
            return await getRepoFromGit();
        } catch { }
    }

    return `https://github.com/${gitRemote}`;
}

async function calculateGitChangesFromApi() {
    const data = await fetchJson<{ commits: { sha: string; author: { login: string; }; commit: { message: string; }; }[]; }>(
        `https://api.github.com/repos/${gitRemote}/compare/${gitHash}...HEAD`,
        {
            headers: {
                Accept: "application/vnd.github+json",
                "User-Agent": IRISCORD_USER_AGENT
            }
        }
    );

    return data.commits.map(c => ({
        hash: c.sha.slice(0, 7),
        author: c.author?.login ?? "unknown",
        message: c.commit.message.split("\n")[0]
    }));
}

async function calculateGitChangesFromGit() {
    await git("fetch");

    const branch = (await git("branch", "--show-current")).stdout.trim();

    const existsOnOrigin = (await git("ls-remote", "origin", branch)).stdout.length > 0;
    if (!existsOnOrigin) return [];

    const res = await git("log", `HEAD...origin/${branch}`, "--pretty=format:%an/%h/%s");

    const commits = res.stdout.trim();
    return commits ? commits.split("\n").map(line => {
        const [author, hash, ...rest] = line.split("/");
        return {
            hash, author,
            message: rest.join("/").split("\n")[0]
        };
    }) : [];
}

async function calculateGitChanges() {
    if (hasGitRepo) {
        try {
            return await calculateGitChangesFromGit();
        } catch { }
    }

    return calculateGitChangesFromApi();
}

async function pull() {
    if (!hasGitRepo) {
        throw new Error("Cannot pull updates: Iriscord was installed without a local git checkout. Re-run the installer from a fresh build or clone the repo.");
    }

    const res = await git("pull");
    return res.stdout.includes("Fast-forward");
}

async function build() {
    const opts = { cwd: Iriscord_SRC_DIR };

    const command = isFlatpak ? "flatpak-spawn" : "node";
    const args = isFlatpak ? ["--host", "node", "scripts/build/build.mjs"] : ["scripts/build/build.mjs"];

    if (IS_DEV) args.push("--dev");

    const res = await execFile(command, args, opts);

    return !res.stderr.includes("Build failed");
}

ipcMain.handle(IpcEvents.GET_REPO, serializeErrors(getRepo));
ipcMain.handle(IpcEvents.GET_UPDATES, serializeErrors(calculateGitChanges));
ipcMain.handle(IpcEvents.UPDATE, serializeErrors(pull));
ipcMain.handle(IpcEvents.BUILD, serializeErrors(build));
