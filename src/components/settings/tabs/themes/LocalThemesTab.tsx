/*
 * Iriscord local themes
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Settings, useSettings } from "@api/Settings";
import { Margins } from "@utils/margins";
import { findLazy } from "@webpack";
import { Button, Forms, useEffect, useRef, useState } from "@webpack/common";
import type { ComponentType, Ref, SyntheticEvent } from "react";

import { UserThemeHeader } from "@main/themes";

import { ThemeCard } from "./ThemeCard";

type FileInput = ComponentType<{
    ref: Ref<HTMLInputElement>;
    onChange: (e: SyntheticEvent<HTMLInputElement>) => void;
    multiple?: boolean;
    filters?: { name?: string; extensions: string[]; }[];
}>;

const FileInput: FileInput = findLazy(m => m.prototype?.activateUploadDialogue && m.prototype.setRef);

function onLocalThemeChange(fileName: string, value: boolean) {
    if (value) {
        if (Settings.enabledThemes.includes(fileName)) return;
        Settings.enabledThemes = [...Settings.enabledThemes, fileName];
    } else {
        Settings.enabledThemes = Settings.enabledThemes.filter(f => f !== fileName);
    }
}

async function onFileUpload(e: SyntheticEvent<HTMLInputElement>) {
    e.stopPropagation();
    e.preventDefault();
    if (!e.currentTarget?.files?.length) return;

    const uploads = Array.from(e.currentTarget.files, file => {
        if (!file.name.endsWith(".css")) return;
        return new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                VencordNative.themes.uploadTheme(file.name, reader.result as string)
                    .then(resolve)
                    .catch(reject);
            };
            reader.readAsText(file);
        });
    });

    await Promise.all(uploads);
}

export function LocalThemesTab() {
    const settings = useSettings(["enabledThemes"]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [userThemes, setUserThemes] = useState<UserThemeHeader[] | null>(null);

    useEffect(() => {
        refreshLocalThemes();
    }, []);

    async function refreshLocalThemes() {
        setUserThemes(await VencordNative.themes.getThemesList());
    }

    return (
        <>
            <Forms.FormTitle tag="h5">Local themes</Forms.FormTitle>
            <Forms.FormText className={Margins.bottom8}>
                Place theme files in your themes folder, then refresh the list.
            </Forms.FormText>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {IS_WEB ? (
                    <>
                        <Button onClick={() => fileInputRef.current?.click?.()}>Upload theme</Button>
                        <FileInput
                            ref={fileInputRef}
                            onChange={async e => {
                                await onFileUpload(e);
                                refreshLocalThemes();
                            }}
                            multiple
                            filters={[{ extensions: ["css"] }]}
                        />
                    </>
                ) : (
                    <Button onClick={() => VencordNative.themes.openFolder()}>Open themes folder</Button>
                )}
                <Button onClick={refreshLocalThemes}>Refresh list</Button>
                <Button onClick={() => VencordNative.quickCss.openEditor()}>Edit QuickCSS</Button>
            </div>

            {userThemes?.length ? (
                <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}>
                    {userThemes.map(theme => (
                        <ThemeCard
                            key={theme.fileName}
                            enabled={settings.enabledThemes.includes(theme.fileName)}
                            onChange={enabled => onLocalThemeChange(theme.fileName, enabled)}
                            onDelete={async () => {
                                onLocalThemeChange(theme.fileName, false);
                                await VencordNative.themes.deleteTheme(theme.fileName);
                                refreshLocalThemes();
                            }}
                            theme={theme}
                        />
                    ))}
                </div>
            ) : (
                <Forms.FormText>No themes found. Add <code>.css</code> files to your themes folder.</Forms.FormText>
            )}
        </>
    );
}
