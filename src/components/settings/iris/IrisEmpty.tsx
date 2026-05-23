/*
 * Empty state for Iriscord settings lists
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { ReactNode } from "react";

import { IrisMark } from "./IrisMark";

export function IrisEmpty({ title, children }: { title: string; children?: ReactNode }) {
    return (
        <div className="iris-empty">
            <IrisMark className="iris-empty-icon" />
            <h4>{title}</h4>
            {children && <p>{children}</p>}
        </div>
    );
}
