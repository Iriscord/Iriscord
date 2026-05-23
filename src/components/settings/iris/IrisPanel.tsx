/*
 * Iriscord settings panel section
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { ReactNode } from "react";

export function IrisPanel({
    label,
    title,
    children,
    className,
}: {
    label?: string;
    title?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={["iris-panel", className].filter(Boolean).join(" ")}>
            {label && <p className="iris-panel-title">{label}</p>}
            {title && <h3 className="iris-panel-heading">{title}</h3>}
            {children}
        </section>
    );
}
