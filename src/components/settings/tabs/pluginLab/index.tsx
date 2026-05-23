/*
 * Iriscord Plugin Lab — create & test plugins inside Discord
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import * as DataStore from "@api/DataStore";
import {
    applyLabPatch,
    applyLabPlugin,
    compileLabPlugin,
    isLabActive,
    LAB_PLUGIN_ID,
    PLUGIN_LAB_TEMPLATE,
    stopLabPlugin
} from "@api/PluginLab";
import { Divider } from "@components/Divider";
import { ReplacementInput } from "@components/settings/tabs/patchHelper/ReplacementInput";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { PRODUCT_NAME } from "@shared/branding";
import { classNameFactory } from "@utils/css";
import { copyWithToast } from "@utils/discord";
import { Margins } from "@utils/margins";
import { canonicalizeMatch, canonicalizeReplace } from "@utils/patches";
import { ReplaceFn } from "@utils/types";
import { search } from "@webpack";
import { Button, Forms, TextArea, TextInput, Toasts, useEffect, useState } from "@webpack/common";

const cl = classNameFactory("vc-plugin-lab-");
const DRAFT_KEY = "Iriscord_pluginLab_draft";
const NAME_KEY = "Iriscord_pluginLab_name";

function toast(message: string, type: "success" | "error" = "success") {
    Toasts.show({
        message,
        type,
        id: Toasts.genId(),
        options: { position: Toasts.Position.BOTTOM }
    });
}

function PatchQuickTest() {
    const [find, setFind] = useState("");
    const [match, setMatch] = useState("");
    const [replacement, setReplacement] = useState<string | ReplaceFn>("");
    const [parsedFind, setParsedFind] = useState<string | RegExp>("");
    const [findError, setFindError] = useState<string>();
    const [matchError, setMatchError] = useState<string>();
    const [replacementError, setReplacementError] = useState<string>();

    function onFindChange(v: string) {
        setFind(v);
        try {
            setParsedFind(JSON.parse(v));
        } catch {
            setParsedFind(v);
        }
        setFindError(void 0);
    }

    function onMatchChange(v: string) {
        setMatch(v);
        try {
            canonicalizeMatch(v);
            setMatchError(void 0);
        } catch (e) {
            setMatchError((e as Error).message);
        }
    }

    function testPatch() {
        if (findError || matchError || replacementError || !find || !match) {
            toast("Fill in find and match first.", "error");
            return;
        }

        try {
            const candidates = search(parsedFind);
            const keys = Object.keys(candidates);
            if (keys.length === 0) {
                toast("No module matched yet — open the Discord screen that uses this code, then try again.", "error");
                return;
            }
            if (keys.length > 1) {
                toast(`Found ${keys.length} modules — make your find string more specific.`, "error");
                return;
            }

            applyLabPatch({
                find: parsedFind,
                replacement: {
                    match: canonicalizeMatch(match),
                    replace: canonicalizeReplace(replacement, `Vencord.Plugins.plugins[${JSON.stringify(LAB_PLUGIN_ID)}]`) as string
                }
            });

            toast("Patch is live — switch channels or reopen the view you are patching.");
        } catch (e) {
            toast(e instanceof Error ? e.message : String(e), "error");
        }
    }

    return (
        <section>
            <Forms.FormTitle tag="h5">Quick patch test</Forms.FormTitle>
            <Forms.FormText className={Margins.bottom8}>
                Try one patch in real time. No rebuild — navigate Discord so the target module loads.
            </Forms.FormText>

            <Forms.FormTitle tag="h5" className={Margins.top8}>Find</Forms.FormTitle>
            <TextInput type="text" value={find} onChange={onFindChange} error={findError} />

            <Forms.FormTitle tag="h5" className={Margins.top8}>Match</Forms.FormTitle>
            <TextInput type="text" value={match} onChange={onMatchChange} error={matchError} />

            <ReplacementInput
                replacement={replacement}
                setReplacement={setReplacement}
                replacementError={replacementError}
            />

            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <Button onClick={testPatch}>Test patch live</Button>
                <Button variant="secondary" onClick={stopLabPlugin}>Stop</Button>
            </div>
        </section>
    );
}

function PluginWorkshop() {
    const [pluginName, setPluginName] = useState("MyPlugin");
    const [source, setSource] = useState(PLUGIN_LAB_TEMPLATE);
    const [status, setStatus] = useState<string | null>(null);
    const [active, setActive] = useState(isLabActive());

    useEffect(() => {
        Promise.all([
            DataStore.get(DRAFT_KEY) as Promise<string | undefined>,
            DataStore.get(NAME_KEY) as Promise<string | undefined>
        ]).then(([draft, name]) => {
            if (draft) setSource(draft);
            if (name) setPluginName(name);
        });
    }, []);

    useEffect(() => {
        const t = setTimeout(() => {
            DataStore.set(DRAFT_KEY, source);
            DataStore.set(NAME_KEY, pluginName);
        }, 500);
        return () => clearTimeout(t);
    }, [source, pluginName]);

    function refreshStatus() {
        setActive(isLabActive());
    }

    async function testLive() {
        const { plugin, error } = compileLabPlugin(source);
        if (error || !plugin) {
            setStatus(error ?? "Invalid plugin");
            toast(error ?? "Invalid plugin", "error");
            return;
        }

        const result = applyLabPlugin(plugin);
        setStatus(result.message);
        refreshStatus();
        toast(result.ok ? "Running in Discord" : result.message, result.ok ? "success" : "error");
    }

    function stop() {
        stopLabPlugin();
        setStatus("Stopped.");
        refreshStatus();
        toast("Plugin Lab stopped.");
    }

    async function saveToLibrary() {
        const safeName = pluginName.replace(/[^a-zA-Z0-9_-]/g, "");
        if (!safeName) {
            toast("Enter a valid plugin name.", "error");
            return;
        }

        const { error } = compileLabPlugin(source);
        if (error) {
            toast(error, "error");
            return;
        }

        try {
            await VencordNative.plugins.save(safeName, source);
            toast(`Saved to userplugins/${safeName}. Run pnpm build, then relaunch Discord.`);
            setStatus(`Saved to library as "${safeName}". Rebuild Iriscord to keep it permanently.`);
        } catch (e) {
            toast(e instanceof Error ? e.message : String(e), "error");
        }
    }

    return (
        <section>
            <Forms.FormTitle tag="h5">Plugin workshop</Forms.FormTitle>
            <Forms.FormText className={Margins.bottom8}>
                Write a full plugin below. <strong>Test live</strong> runs patches and <code>start()</code> immediately.
                <strong> Save to library</strong> writes to your plugins folder (requires <code>pnpm build</code>).
            </Forms.FormText>

            <Forms.FormTitle tag="h5">Plugin name</Forms.FormTitle>
            <TextInput
                className={Margins.bottom8}
                value={pluginName}
                onChange={setPluginName}
                placeholder="MyPlugin"
            />

            <Forms.FormTitle tag="h5">Source</Forms.FormTitle>
            <TextArea
                className={cl("editor")}
                value={source}
                onChange={setSource}
                rows={18}
            />

            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <Button onClick={testLive}>Test live</Button>
                <Button variant="secondary" onClick={stop}>Stop</Button>
                <Button variant="secondary" onClick={() => { setSource(PLUGIN_LAB_TEMPLATE); toast("Template reset."); }}>
                    Reset template
                </Button>
                <Button variant="secondary" onClick={() => copyWithToast(source)}>Copy source</Button>
                {!IS_WEB && (
                    <Button onClick={saveToLibrary}>Save to library</Button>
                )}
            </div>

            {active && (
                <Forms.FormText className={Margins.top8} style={{ color: "var(--text-positive)" }}>
                    Lab session active — patches / start() are running.
                </Forms.FormText>
            )}

            {status && (
                <Forms.FormText className={Margins.top8}>{status}</Forms.FormText>
            )}
        </section>
    );
}

function PluginLabTab() {
    return (
        <SettingsTab>
            <Forms.FormTitle tag="h5">Plugin Lab</Forms.FormTitle>
            <Forms.FormText className={Margins.bottom16}>
                Create and test {PRODUCT_NAME} plugins without leaving Discord. Patches and <code>start()</code> can run in real time;
                saving to your library still needs a rebuild.
            </Forms.FormText>

            <PatchQuickTest />

            <Divider className={Margins.top20} />

            <PluginWorkshop />
        </SettingsTab>
    );
}

export default wrapTab(PluginLabTab, "Plugin Lab");
