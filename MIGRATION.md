# Migrating from Vencord to Iriscord

Iriscord is built on Vencord. Most plugins, settings, and workflows carry over with minimal changes.

## Settings & data folder

| Vencord | Iriscord |
|---------|----------|
| `%AppData%/Vencord` or `../Vencord` | `%AppData%/Iriscord` |
| `VencordData` (some installs) | Same files, auto-detected |

**On first launch**, Iriscord uses your existing Vencord folder if `Iriscord` does not exist yet. To fully switch:

1. Close Discord.
2. Copy `%AppData%/Vencord` → `%AppData%/Iriscord` (optional; auto-detection already reads Vencord).
3. Install Iriscord over your Discord install (`pnpm inject` or Iriscord installer).

Environment variables:

| Legacy | Iriscord |
|--------|----------|
| `VENCORD_USER_DATA_DIR` | `IRISCORD_USER_DATA_DIR` (either still works) |

## Plugin compatibility

Third-party Vencord plugins that use:

```js
Vencord.Plugins.plugins.MyPlugin
Vencord.Webpack.Common.React
VencordNative.settings.openFolder()
```

continue to work — Iriscord exposes **`Vencord`** and **`VencordNative`** as aliases to **`Iriscord`** / **`IriscordNative`**.

New plugins should prefer:

```js
Iriscord.Plugins.plugins.MyPlugin
IriscordNative.quickCss.openEditor()
```

## Settings keys

Internal Discord settings panel keys (e.g. `vencord_section`, `vencord_plugins`) are unchanged so saved UI state and deep links keep working.

The setting `includeVencordInfoWhenCopying` is renamed to **`includeIriscordInfoWhenCopying`** in new installs; old values may need re-enabling in **Settings → Settings plugin**.

## Cloud sync

Default cloud URL is `https://api.iriscord.dev/`. Vencord cloud (`api.vencord.dev`) is not used unless you set it manually in **Cloud** settings.

## Build artifacts

Output bundles still use filenames like `renderer.js` and `patcher.js` for installer compatibility. The global object is **`Iriscord`** with a **`Vencord`** alias.

## Uninstalling Vencord

After Iriscord works:

1. Run Vencord uninstaller if you used it, **or** restore stock Discord via Iriscord’s uninstall flow.
2. Remove old `Vencord` data only if you copied everything to `Iriscord` and no longer need backups.

## Getting help

Open issues on your Iriscord repository. For upstream plugin bugs, check whether they reproduce on stock Vencord first.
