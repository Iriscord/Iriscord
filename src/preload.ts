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

import { debounce } from "@shared/debounce";
import { IpcEvents } from "@shared/IpcEvents";
import { contextBridge, webFrame } from "electron/renderer";

import IriscordNative, { invoke, sendSync } from "./IriscordNative";

contextBridge.exposeInMainWorld("IriscordNative", IriscordNative);
// Iriscord plugin ecosystem compatibility
contextBridge.exposeInMainWorld("IriscordNative", IriscordNative);

// Discord
if (location.protocol !== "data:") {
    invoke(IpcEvents.INIT_FILE_WATCHERS);

    if (IS_DISCORD_DESKTOP) {
        // ── Passkey / WebAuthn suppression ────────────────────────────────────────
        // Discord calls navigator.credentials.get() which triggers the Windows
        // Security passkey dialog even before the renderer scripts load.
        //
        // Fix A: Synchronous override in the ISOLATED world (this preload context).
        // This MUST run before require(DISCORD_PRELOAD) so Discord's own preload
        // cannot call the real credentials API.
        try {
            const _passkeyReject = () =>
                Promise.reject(
                    Object.assign(new DOMException("Operation not allowed", "NotAllowedError"), { code: 0 })
                );
            Object.defineProperty(navigator, "credentials", {
                configurable: true,
                enumerable: true,
                get() {
                    return {
                        get: _passkeyReject,
                        create: _passkeyReject,
                        store: _passkeyReject,
                        preventSilentAccess: () => Promise.resolve(),
                    };
                },
            });
        } catch (_) { }

        // Fix B: Async override in the MAIN world so Discord's renderer JS also
        // sees a stubbed credentials object (webFrame.executeJavaScript runs in
        // the main world before page scripts execute).
        webFrame.executeJavaScript(`
            (function() {
                const _reject = () => Promise.reject(Object.assign(new DOMException('Operation not allowed', 'NotAllowedError'), { code: 0 }));
                try {
                    Object.defineProperty(window.navigator, 'credentials', {
                        configurable: true,
                        enumerable: true,
                        get() {
                            return {
                                get: _reject,
                                create: _reject,
                                store: _reject,
                                preventSilentAccess: () => Promise.resolve(),
                            };
                        }
                    });
                } catch(e) {}
            })();
        `);
        // ─────────────────────────────────────────────────────────────────────────

        webFrame.executeJavaScript(sendSync<string>(IpcEvents.PRELOAD_GET_RENDERER_JS));
        // Not supported in sandboxed preload scripts but Discord doesn't support it either so who cares
        require(process.env.DISCORD_PRELOAD!);
    }
} // Monaco popout
else {
    contextBridge.exposeInMainWorld("setCss", debounce(IriscordNative.quickCss.set));
    contextBridge.exposeInMainWorld("getCurrentCss", IriscordNative.quickCss.get);
    contextBridge.exposeInMainWorld("getTheme", IriscordNative.quickCss.getEditorTheme);
}
