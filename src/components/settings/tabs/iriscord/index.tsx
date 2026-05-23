/*
 * Iriscord main settings tab
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { openNotificationLogModal } from "@api/Notifications/notificationLog";
import { useSettings } from "@api/Settings";
import { Divider } from "@components/Divider";
import { FormSwitch } from "@components/FormSwitch";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import SettingsPlugin from "@plugins/_core/settings";
import { PRODUCT_NAME } from "@shared/branding";
import { IS_WINDOWS } from "@utils/constants";
import { Margins } from "@utils/margins";
import { relaunch } from "@utils/native";
import { Button, ConfirmModal, Forms, openModal, Select } from "@webpack/common";

import { MacOSVibrancySettings } from "./MacVibrancySettings";
import { NotificationSection } from "./NotificationSettings";
import { WindowsMaterialSettings } from "./WindowsMaterialSettings";

type KeysOfType<Object, Type> = {
    [K in keyof Object]: Object[K] extends Type ? K : never;
}[keyof Object];

function SettingsLocationSelect() {
    const pluginSettings = SettingsPlugin.settings.use(["settingsLocation"]);
    const options = SettingsPlugin.settings.def.settingsLocation.options;

    return (
        <section>
            <Forms.FormTitle tag="h5">Settings sidebar position</Forms.FormTitle>
            <Forms.FormText className={Margins.bottom8}>
                Choose where {PRODUCT_NAME} appears in Discord&apos;s settings navigation.
            </Forms.FormText>
            <Select
                options={options}
                select={v => { pluginSettings.settingsLocation = v; }}
                isSelected={v => v === pluginSettings.settingsLocation}
                serialize={String}
                closeOnSelect
            />
        </section>
    );
}

function ClientSwitches() {
    const settings = useSettings(["useQuickCss", "enableReactDevtools", "frameless", "winNativeTitleBar", "transparent", "winCtrlQ", "disableMinSize"]);

    const items = [
        { key: "useQuickCss", title: "Enable Custom CSS", description: "Load QuickCSS alongside your themes." },
        !IS_WEB && { key: "enableReactDevtools", title: "Enable React Developer Tools", restartRequired: true },
        !IS_WEB && (!IS_DISCORD_DESKTOP || !IS_WINDOWS ? {
            key: "frameless",
            title: "Disable the window frame",
            restartRequired: true
        } : {
            key: "winNativeTitleBar",
            title: "Use Windows' native title bar instead of Discord's custom one",
            restartRequired: true
        }),
        !IS_WEB && {
            key: "transparent",
            title: "Enable window transparency",
            description: "Requires a theme that supports transparency. Stops the window from being resizable as a side effect.",
            restartRequired: true
        },
        IS_DISCORD_DESKTOP && { key: "disableMinSize", title: "Disable minimum window size", restartRequired: true },
        !IS_WEB && IS_WINDOWS && {
            key: "winCtrlQ",
            title: "Register Ctrl+Q as shortcut to close Discord (Alternative to Alt+F4)",
            restartRequired: true
        },
    ] satisfies Array<false | {
        key: KeysOfType<typeof settings, boolean>;
        title: string;
        description?: string;
        restartRequired?: boolean;
    }>;

    return items.map(item => {
        if (!item) return null;
        const { key, title, description, restartRequired } = item;

        return (
            <FormSwitch
                key={key}
                title={title}
                description={description}
                value={settings[key]}
                onChange={v => {
                    settings[key] = v;
                    if (restartRequired) {
                        openModal(props => (
                            <ConfirmModal
                                {...props}
                                title="Restart Required"
                                subtitle="A restart is required to apply this change"
                                confirmText="Restart now"
                                cancelText="Later!"
                                variant="primary"
                                onConfirm={relaunch}
                            />
                        ));
                    }
                }}
            />
        );
    });
}

function IriscordSettings() {
    return (
        <SettingsTab>
            <section>
                <Forms.FormTitle tag="h5">General</Forms.FormTitle>
                <Forms.FormText className={Margins.bottom16}>
                    {PRODUCT_NAME} is a lightweight Discord client mod. Configure the client below, or use the Plugins and Themes tabs for extensions and appearance.
                </Forms.FormText>
            </section>

            <section>
                <Forms.FormTitle tag="h5">Quick actions</Forms.FormTitle>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <Button onClick={openNotificationLogModal}>Notification log</Button>
                    <Button onClick={() => IriscordNative.quickCss.openEditor()}>Edit QuickCSS</Button>
                    {!IS_WEB && (
                        <>
                            <Button onClick={relaunch}>Relaunch Discord</Button>
                            <Button onClick={() => IriscordNative.settings.openFolder()}>Open data folder</Button>
                            <Button onClick={() => IriscordNative.plugins.openFolder()}>Open plugins folder</Button>
                        </>
                    )}
                </div>
            </section>

            <Divider className={Margins.top20} />

            <SettingsLocationSelect />

            <Divider className={Margins.top20} />

            <section>
                <Forms.FormTitle tag="h5">Client</Forms.FormTitle>
                <ClientSwitches />
            </section>

            <MacOSVibrancySettings />
            <WindowsMaterialSettings />

            <NotificationSection />
        </SettingsTab>
    );
}

export default wrapTab(IriscordSettings, "Iriscord Settings");
