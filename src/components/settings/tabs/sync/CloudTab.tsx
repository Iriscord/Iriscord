/*
 * Iriscord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 * This file was modified to temporarily disable Cloud features.
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

import { Paragraph } from "@components/Paragraph";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";

import { BaseText } from "@components/BaseText";
import { Flex } from "@components/Flex";
import { Divider } from "@components/Divider";
import { Margins } from "@utils/margins";

function CloudTab() {
    return (
        <SettingsTab>
            <Flex flexDirection="column" gap="1em">
                <BaseText tag="h5" size="lg" weight="semibold" className={Margins.bottom8}>
                    Cloud Integration (beta)
                </BaseText>
                <Divider />
                <Paragraph>
                    Cloud features are currently in beta and may not work reliably.
                </Paragraph>
                <Paragraph className={Margins.top8}>
                    This tab is intentionally disabled for now. Support will be available soon.
                </Paragraph>
            </Flex>
        </SettingsTab>
    );
}

export default wrapTab(CloudTab, "Cloud");

