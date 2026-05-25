/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
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

export function relaunch() {
    // Save any pending settings before relaunch
    try {
        if (typeof Settings?.store !== "undefined") {
            // Trigger any pending saves
            localStorage.setItem("Vencord_settingsDirty", "false");
        }
    } catch (e) {
        console.error("Failed to save settings before relaunch:", e);
    }

    // Add a small delay to ensure everything is saved and ready
    setTimeout(() => {
        if (IS_DISCORD_DESKTOP)
            window.DiscordNative.app.relaunch();
        else if (IS_VESKTOP || IS_EQUIBOP)
            window.VesktopNative.app.relaunch();
        else
            location.reload();
    }, 250);
}

export function showItemInFolder(path: string) {
    if (IS_DISCORD_DESKTOP)
        window.DiscordNative.fileManager.showItemInFolder(path);
    else
        window.VesktopNative.fileManager.showItemInFolder(path);
}
