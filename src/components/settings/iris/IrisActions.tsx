/*
 * Iriscord settings action buttons
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { ComponentType, ReactNode } from "react";

export interface IrisActionProps {
    Icon: ComponentType<{ className?: string }>;
    label: ReactNode;
    onClick?: () => void;
    primary?: boolean;
    disabled?: boolean;
}

export function IrisAction({ Icon, label, onClick, primary, disabled }: IrisActionProps) {
    return (
        <button
            type="button"
            className={["iris-action-btn", primary && "iris-action-btn-primary"].filter(Boolean).join(" ")}
            onClick={onClick}
            disabled={disabled}
        >
            <Icon />
            <span>{label}</span>
        </button>
    );
}

export function IrisActions({ children }: { children: ReactNode }) {
    return <div className="iris-actions">{children}</div>;
}
