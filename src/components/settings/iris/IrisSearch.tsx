/*
 * Dark-themed search for Iriscord settings
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { TextInput } from "@webpack/common";

function SearchGlyph() {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.75" />
            <path d="M16 16l5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
    );
}

export function IrisSearch({
    value,
    onChange,
    placeholder = "Search…",
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    return (
        <div className="iris-search-wrap">
            <SearchGlyph />
            <TextInput
                className="iris-search"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
            />
        </div>
    );
}
