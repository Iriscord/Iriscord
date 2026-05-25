/*
 * Luacord — Updater utilities (renderer-side)
 * Wraps IPC calls vers le main process (http.ts)
 */

import { Logger } from "./Logger";
import { IpcRes } from "./types";

export const UpdateLogger = /* #__PURE__ */ new Logger("Updater", "white");
export let isOutdated  = false;
export let isNewer     = false;
export let updateError: any;
export let changes: Record<"hash" | "author" | "message", string>[] = [];

async function Unwrap<T>(p: Promise<IpcRes<T>>): Promise<T> {
    const res = await p;
    if (res.ok) return res.value as T;
    updateError = res.error;
    throw res.error;
}

/**
 * Demande au main process s'il y a une version plus récente.
 * Met à jour isOutdated et changes.
 */
export async function checkForUpdates(): Promise<boolean> {
    changes = await Unwrap(VencordNative.updater.getUpdates());
    return (isOutdated = changes.length > 0);
}

/**
 * Télécharge le Setup.exe (étape 1).
 * Retourne true si le téléchargement a réussi.
 */
export async function update(): Promise<boolean> {
    if (!isOutdated) return true;
    const ok = await Unwrap(VencordNative.updater.update());
    if (ok) isOutdated = false;
    return ok;
}

/**
 * Launches the downloaded installer (step 2).
 * The app will close and restart automatically after installation.
 */
export async function rebuild(): Promise<boolean> {
    return Unwrap(VencordNative.updater.rebuild());
}

export const getRepo = () => Unwrap(VencordNative.updater.getRepo());

/**
 * Checks for updates on startup and prompts the user to update.
 */
export async function maybePromptToUpdate(confirmMessage: string, checkForDev = false) {
    if (IS_WEB || IS_UPDATER_DISABLED) return;
    if (checkForDev && IS_DEV) return;

    try {
        const outdated = await checkForUpdates();
        if (outdated) {
            // Automatic update without confirmation
            const downloaded = await update();
            if (downloaded) await rebuild();
        }
    } catch (err) {
        UpdateLogger.error(err);
        alert("Update check failed. Check your connection or reinstall Luacord.");
    }
}
