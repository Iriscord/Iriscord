/*
 * Iriscord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
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

export const enum IpcEvents {
    INIT_FILE_WATCHERS = "IriscordInitFileWatchers",

    OPEN_QUICKCSS = "IriscordOpenQuickCss",
    GET_QUICK_CSS = "IriscordGetQuickCss",
    SET_QUICK_CSS = "IriscordSetQuickCss",
    QUICK_CSS_UPDATE = "IriscordQuickCssUpdate",

    GET_SETTINGS = "IriscordGetSettings",
    SET_SETTINGS = "IriscordSetSettings",

    GET_THEMES_LIST = "IriscordGetThemesList",
    GET_THEME_DATA = "IriscordGetThemeData",
    GET_THEME_SYSTEM_VALUES = "IriscordGetThemeSystemValues",
    THEME_UPDATE = "IriscordThemeUpdate",

    OPEN_EXTERNAL = "IriscordOpenExternal",
    OPEN_THEMES_FOLDER = "IriscordOpenThemesFolder",
    OPEN_SETTINGS_FOLDER = "IriscordOpenSettingsFolder",
    OPEN_PLUGINS_FOLDER = "IriscordOpenPluginsFolder",
    SAVE_USER_PLUGIN = "IriscordSaveUserPlugin",

    GET_UPDATES = "IriscordGetUpdates",
    GET_REPO = "IriscordGetRepo",
    UPDATE = "IriscordUpdate",
    BUILD = "IriscordBuild",

    OPEN_MONACO_EDITOR = "IriscordOpenMonacoEditor",
    GET_MONACO_THEME = "IriscordGetMonacoTheme",

    GET_PLUGIN_IPC_METHOD_MAP = "IriscordGetPluginIpcMethodMap",

    CSP_IS_DOMAIN_ALLOWED = "IriscordCspIsDomainAllowed",
    CSP_REMOVE_OVERRIDE = "IriscordCspRemoveOverride",
    CSP_REQUEST_ADD_OVERRIDE = "IriscordCspRequestAddOverride",

    GET_RENDERER_CSS = "IriscordGetRendererCss",
    RENDERER_CSS_UPDATE = "IriscordRendererCssUpdate",
    PRELOAD_GET_RENDERER_JS = "IriscordPreloadGetRendererJs",

    SUPPORTS_WINDOWS_MATERIAL = "IriscordSupportsWindowsMaterial",
}
