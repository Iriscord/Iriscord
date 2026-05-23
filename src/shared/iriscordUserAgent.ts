/*
 * Iriscord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import gitHash from "~git-hash";
import gitRemote from "~git-remote";

export { gitHash, gitRemote };

import { PRODUCT_NAME, PROJECT_HOMEPAGE } from "./branding";

export const IRISCORD_USER_AGENT = `${PRODUCT_NAME}/${gitHash}${gitRemote ? ` (${PROJECT_HOMEPAGE})` : ""}`;
/** @deprecated Use IRISCORD_USER_AGENT */
export const Iriscord_USER_AGENT = IRISCORD_USER_AGENT;
