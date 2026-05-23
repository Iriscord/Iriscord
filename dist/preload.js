// Iriscord 4ce68a9
// Standalone: false
// Platform: win32
// Updater Disabled: false
"use strict";function c(e,o=300){let i;return function(...d){clearTimeout(i),i=setTimeout(()=>{e(...d)},o)}}var t=require("electron/renderer");var s=require("electron/renderer");function r(e,...o){return s.ipcRenderer.invoke(e,...o)}function n(e,...o){return s.ipcRenderer.sendSync(e,...o)}var g={},I=n("IriscordGetPluginIpcMethodMap");for(let[e,o]of Object.entries(I)){let i=g[e]={};for(let[d,m]of Object.entries(o))i[d]=(...l)=>r(m,...l)}var E={themes:{uploadTheme:async(e,o)=>{throw new Error("uploadTheme is WEB only")},deleteTheme:async e=>{throw new Error("deleteTheme is WEB only")},getThemesList:()=>r("IriscordGetThemesList"),getThemeData:e=>r("IriscordGetThemeData",e),getSystemValues:()=>r("IriscordGetThemeSystemValues"),openFolder:()=>r("IriscordOpenThemesFolder")},updater:{getUpdates:()=>r("IriscordGetUpdates"),update:()=>r("IriscordUpdate"),rebuild:()=>r("IriscordBuild"),getRepo:()=>r("IriscordGetRepo")},settings:{get:()=>n("IriscordGetSettings"),set:(e,o)=>r("IriscordSetSettings",e,o),openFolder:()=>r("IriscordOpenSettingsFolder")},plugins:{openFolder:()=>r("IriscordOpenPluginsFolder"),save:(e,o)=>r("IriscordSaveUserPlugin",e,o)},quickCss:{get:()=>r("IriscordGetQuickCss"),set:e=>r("IriscordSetQuickCss",e),addChangeListener(e){s.ipcRenderer.on("IriscordQuickCssUpdate",(o,i)=>e(i))},addThemeChangeListener(e){s.ipcRenderer.on("IriscordThemeUpdate",()=>e())},openFile:()=>r("IriscordOpenQuickCss"),openEditor:()=>r("IriscordOpenMonacoEditor"),getEditorTheme:()=>n("IriscordGetMonacoTheme")},native:{getVersions:()=>process.versions,supportsWindowsMaterial:()=>n("IriscordSupportsWindowsMaterial"),openExternal:e=>r("IriscordOpenExternal",e),getRendererCss:()=>r("IriscordGetRendererCss"),onRendererCssUpdate:e=>{}},csp:{isDomainAllowed:(e,o)=>r("IriscordCspIsDomainAllowed",e,o),removeOverride:e=>r("IriscordCspRemoveOverride",e),requestAddOverride:(e,o,i)=>r("IriscordCspRequestAddOverride",e,o,i)},pluginHelpers:g};t.contextBridge.exposeInMainWorld("IriscordNative",E);t.contextBridge.exposeInMainWorld("IriscordNative",E);location.protocol!=="data:"?(r("IriscordInitFileWatchers"),t.webFrame.executeJavaScript(`
            (function() {
                const _originalCredentials = window.navigator.credentials;
                const _reject = () => Promise.reject(Object.assign(new DOMException('Not allowed', 'NotAllowedError'), { code: 0 }));
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
        `),t.webFrame.executeJavaScript(n("IriscordPreloadGetRendererJs")),require(process.env.DISCORD_PRELOAD)):(t.contextBridge.exposeInMainWorld("setCss",c(E.quickCss.set)),t.contextBridge.exposeInMainWorld("getCurrentCss",E.quickCss.get),t.contextBridge.exposeInMainWorld("getTheme",E.quickCss.getEditorTheme));
//# sourceURL=file:///IriscordPreload
//# sourceMappingURL=iriscord://preload.js.map
