/*
 * Iriscord — manual plugins (Discord-native settings UI)
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { Divider } from "@components/Divider";
import ErrorBoundary from "@components/ErrorBoundary";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { PRODUCT_NAME } from "@shared/branding";
import { classNameFactory } from "@utils/css";
import { Margins } from "@utils/margins";
import { relaunch } from "@utils/native";
import { ChangeList } from "@utils/ChangeList";
import { useCleanupEffect } from "@utils/react";
import { Logger } from "@utils/Logger";
import { Button, ConfirmModal, Forms, openModal, TextInput, useMemo, useRef, useState } from "@webpack/common";

import Plugins, { PluginMeta } from "~plugins";

import { PluginCard } from "./PluginCard";

export const cl = classNameFactory("vc-plugins-");
export const logger = new Logger("PluginSettings", "#a6d189");

function isUserPlugin(name: string) {
    return PluginMeta[name]?.userPlugin === true;
}

function PluginSettings() {
    const changeRef = useRef<ChangeList<string>>(null);
    const changes = changeRef.current ??= new ChangeList<string>();

    useCleanupEffect(() => {
        if (changes.hasChanges) {
            openModal(props => (
                <ConfirmModal
                    {...props}
                    title="Restart required"
                    confirmText="Restart now"
                    cancelText="Later!"
                    variant="primary"
                    onConfirm={() => location.reload()}
                >
                    <p>Restart Discord to apply plugin changes.</p>
                </ConfirmModal>
            ));
        }
    }, []);

    const [search, setSearch] = useState("");

    const installedPlugins = useMemo(() =>
        Object.values(Plugins)
            .filter(p => isUserPlugin(p.name))
            .sort((a, b) => a.name.localeCompare(b.name)),
        []
    );

    const userPlugins = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return installedPlugins;
        return installedPlugins.filter(p =>
            p.name.toLowerCase().includes(q)
            || p.description.toLowerCase().includes(q)
        );
    }, [installedPlugins, search]);

    return (
        <SettingsTab>
            <Forms.FormTitle tag="h5">Plugins</Forms.FormTitle>
            <Forms.FormText>
                {PRODUCT_NAME} does not include pre-installed plugins. Add plugins manually to your plugins folder, rebuild Iriscord, then restart Discord.
            </Forms.FormText>

            <Forms.FormTitle tag="h5" className={Margins.top16}>Install a plugin</Forms.FormTitle>
            <Forms.FormText className={Margins.bottom8}>
                1. Open the plugins folder below.<br />
                2. Place each plugin in its own subfolder with an <code>index.ts</code> or <code>index.tsx</code> file.<br />
                3. Run <code>pnpm build</code> in your Iriscord project folder.<br />
                4. Relaunch Discord.
            </Forms.FormText>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {!IS_WEB && (
                    <Button onClick={() => VencordNative.plugins.openFolder()}>Open plugins folder</Button>
                )}
                <Button onClick={relaunch}>Relaunch Discord</Button>
            </div>

            <Divider className={Margins.top20} />

            <Forms.FormTitle tag="h5">Installed plugins</Forms.FormTitle>

            {installedPlugins.length === 0 ? (
                <Forms.FormText className={cl("empty")}>
                    No plugins installed. Follow the steps above to add plugins from your library folder.
                </Forms.FormText>
            ) : (
                <>
                    <ErrorBoundary noop>
                        <div className={cl("search")}>
                            <TextInput
                                type="text"
                                placeholder="Search plugins"
                                value={search}
                                onChange={setSearch}
                            />
                        </div>
                    </ErrorBoundary>

                    {userPlugins.length === 0 ? (
                        <Forms.FormText className={cl("empty")}>
                            No plugins match your search.
                        </Forms.FormText>
                    ) : (
                        <div className={cl("grid")}>
                            {userPlugins.map(p => (
                                <PluginCard
                                    key={p.name}
                                    plugin={p}
                                    disabled={p.required || p.isDependency}
                                    onRestartNeeded={(name, key) => changes.handleChange(`${name}.${key}`)}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </SettingsTab>
    );
}

export default wrapTab(PluginSettings, "Plugins");
