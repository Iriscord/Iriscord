// Iriscord d3c6d28
// Standalone: false
// Platform: win32
// Updater Disabled: false
"use strict";function S(e,r=300){let o;return function(...a){clearTimeout(o),o=setTimeout(()=>{e(...a)},r)}}var i=require("electron/renderer");var s=require("electron/renderer");function t(e,...r){return s.ipcRenderer.invoke(e,...r)}function n(e,...r){return s.ipcRenderer.sendSync(e,...r)}var l={},u=n("IriscordGetPluginIpcMethodMap");for(let[e,r]of Object.entries(u)){let o=l[e]={};for(let[a,m]of Object.entries(r))o[a]=(...p)=>t(m,...p)}var d={themes:{uploadTheme:async(e,r)=>{throw new Error("uploadTheme is WEB only")},deleteTheme:async e=>{throw new Error("deleteTheme is WEB only")},getThemesList:()=>t("IriscordGetThemesList"),getThemeData:e=>t("IriscordGetThemeData",e),getSystemValues:()=>t("IriscordGetThemeSystemValues"),openFolder:()=>t("IriscordOpenThemesFolder")},updater:{getUpdates:()=>t("IriscordGetUpdates"),update:()=>t("IriscordUpdate"),rebuild:()=>t("IriscordBuild"),getRepo:()=>t("IriscordGetRepo")},settings:{get:()=>n("IriscordGetSettings"),set:(e,r)=>t("IriscordSetSettings",e,r),openFolder:()=>t("IriscordOpenSettingsFolder")},plugins:{openFolder:()=>t("IriscordOpenPluginsFolder"),save:(e,r)=>t("IriscordSaveUserPlugin",e,r)},quickCss:{get:()=>t("IriscordGetQuickCss"),set:e=>t("IriscordSetQuickCss",e),addChangeListener(e){s.ipcRenderer.on("IriscordQuickCssUpdate",(r,o)=>e(o))},addThemeChangeListener(e){s.ipcRenderer.on("IriscordThemeUpdate",()=>e())},openFile:()=>t("IriscordOpenQuickCss"),openEditor:()=>t("IriscordOpenMonacoEditor"),getEditorTheme:()=>n("IriscordGetMonacoTheme")},native:{getVersions:()=>process.versions,supportsWindowsMaterial:()=>n("IriscordSupportsWindowsMaterial"),openExternal:e=>t("IriscordOpenExternal",e),getRendererCss:()=>t("IriscordGetRendererCss"),onRendererCssUpdate:e=>{}},csp:{isDomainAllowed:(e,r)=>t("IriscordCspIsDomainAllowed",e,r),removeOverride:e=>t("IriscordCspRemoveOverride",e),requestAddOverride:(e,r,o)=>t("IriscordCspRequestAddOverride",e,r,o)},pluginHelpers:l};i.contextBridge.exposeInMainWorld("IriscordNative",d);i.contextBridge.exposeInMainWorld("IriscordNative",d);if(location.protocol!=="data:"){t("IriscordInitFileWatchers");{try{let r=()=>Promise.reject(Object.assign(new DOMException("Operation not allowed","NotAllowedError"),{code:0}));Object.defineProperty(navigator,"credentials",{configurable:!0,enumerable:!0,get(){return{get:r,create:r,store:r,preventSilentAccess:()=>Promise.resolve()}}}),window.PublicKeyCredential=void 0}catch{}let e=`
            (function() {
                const _reject = () => Promise.reject(Object.assign(new DOMException('Operation not allowed', 'NotAllowedError'), { code: 0 }));
                try {
                    // Disable WebAuthn detection entirely
                    Object.defineProperty(window, 'PublicKeyCredential', {
                        configurable: true,
                        enumerable: true,
                        writable: true,
                        value: undefined
                    });
                    
                    // Override credentials API
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
        `;try{let r=document.createElement("script");r.textContent=e,(document.head||document.documentElement).appendChild(r),r.remove()}catch{i.webFrame.executeJavaScript(e)}i.webFrame.executeJavaScript(n("IriscordPreloadGetRendererJs")),require(process.env.DISCORD_PRELOAD)}}else i.contextBridge.exposeInMainWorld("setCss",S(d.quickCss.set)),i.contextBridge.exposeInMainWorld("getCurrentCss",d.quickCss.get),i.contextBridge.exposeInMainWorld("getTheme",d.quickCss.getEditorTheme);
//# sourceURL=file:///IriscordPreload
//# sourceMappingURL=iriscord://preload.js.map
