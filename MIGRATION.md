# Migrating from Iriscord to Iriscord

Iriscord is built on Iriscord. Most plugins, settings, and workflows carry over with minimal changes.

## Settings & data folder

| Iriscord | Iriscord |
|---------|----------|
| `%AppData%/Iriscord` or `../Iriscord` | `%AppData%/Iriscord` |
| `IriscordData` (some installs) | Same files, auto-detected |

**On first launch**, Iriscord uses your existing Iriscord folder if `Iriscord` does not exist yet. To fully switch:

1. Close Discord.
2. Copy `%AppData%/Iriscord` → `%AppData%/Iriscord` (optional; auto-detection already reads Iriscord).
3. Install Iriscord over your Discord install (`pnpm inject` or Iriscord installer).

Environment variables:

| Legacy | Iriscord |
|--------|----------|
| `IRISCORD_USER_DATA_DIR` | `IRISCORD_USER_DATA_DIR` (either still works) |

## Plugin compatibility

Third-party Iriscord plugins that use:

```js
Iriscord.Plugins.plugins.MyPlugin
Iriscord.Webpack.Common.React
IriscordNative.settings.openFolder()
```

continue to work — Iriscord exposes **`Iriscord`** and **`IriscordNative`** as aliases to **`Iriscord`** / **`IriscordNative`**.

New plugins should prefer:

```js
Iriscord.Plugins.plugins.MyPlugin
IriscordNative.quickCss.openEditor()
```

## Settings keys

Internal Discord settings panel keys (e.g. `iriscord_section`, `iriscord_plugins`) are unchanged so saved UI state and deep links keep working.

The setting `includeIriscordInfoWhenCopying` is renamed to **`includeIriscordInfoWhenCopying`** in new installs; old values may need re-enabling in **Settings → Settings plugin**.

## Cloud sync

Default cloud URL is `https://api.iriscord.dev/`. Iriscord cloud (`api.iriscord.dev`) is not used unless you set it manually in **Cloud** settings.

## Build artifacts

Output bundles still use filenames like `renderer.js` and `patcher.js` for installer compatibility. The global object is **`Iriscord`** with a **`Iriscord`** alias.

## Uninstalling Iriscord

After Iriscord works:

1. Run Iriscord uninstaller if you used it, **or** restore stock Discord via Iriscord’s uninstall flow.
2. Remove old `Iriscord` data only if you copied everything to `Iriscord` and no longer need backups.

## Getting help

Open issues on your Iriscord repository. For upstream plugin bugs, check whether they reproduce on stock Iriscord first.
