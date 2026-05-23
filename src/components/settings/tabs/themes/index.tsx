/*
 * Iriscord themes — local folder only, Discord-native UI
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { Divider } from "@components/Divider";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { PRODUCT_NAME } from "@shared/branding";
import { Margins } from "@utils/margins";
import { Forms } from "@webpack/common";

import { CspErrorCard } from "./CspErrorCard";
import { LocalThemesTab } from "./LocalThemesTab";

function ThemesTab() {
    return (
        <SettingsTab>
            <Forms.FormTitle tag="h5">Themes</Forms.FormTitle>
            <Forms.FormText className={Margins.bottom16}>
                {PRODUCT_NAME} does not ship with themes. Add <code>.css</code> theme files to your themes folder and enable them below.
            </Forms.FormText>

            <CspErrorCard />

            <Divider className={Margins.bottom16} />

            <LocalThemesTab />
        </SettingsTab>
    );
}

function UserscriptThemesTab() {
    return (
        <SettingsTab>
            <Forms.FormTitle tag="h5">Themes</Forms.FormTitle>
            <Forms.FormText>
                Themes are not supported on the userscript build. Use the desktop client or browser extension.
            </Forms.FormText>
        </SettingsTab>
    );
}

export default IS_USERSCRIPT
    ? wrapTab(UserscriptThemesTab, "Themes")
    : wrapTab(ThemesTab, "Themes");
