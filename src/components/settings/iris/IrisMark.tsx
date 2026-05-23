/*
 * Iriscord iris logo mark for settings UI
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export function IrisMark({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
            <ellipse cx="16" cy="16" rx="13" ry="8" stroke="currentColor" strokeWidth="1.5" opacity="0.9" />
            <circle cx="16" cy="16" r="4.5" fill="currentColor" />
            <circle cx="17.2" cy="14.8" r="1.2" fill="#0a0a0f" opacity="0.75" />
            <path
                d="M3 16c2.2-3.5 5.8-5.5 13-5.5S27.8 12.5 29 16"
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.25"
            />
        </svg>
    );
}
