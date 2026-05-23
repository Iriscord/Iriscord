# Iriscord

**A modern Discord client mod — powered by Iris**

Iriscord is a full rebrand and extension of the [Iriscord](https://github.com/Vendicated/Iriscord) codebase. It keeps compatibility with the Iriscord plugin ecosystem while delivering its own identity, settings experience, and exclusive features.

## Features

- Easy to install (same injection model as Iriscord)
- Iriscord plugin compatibility via `window.Iriscord` and `IriscordNative` aliases
- Custom CSS and themes 
- Privacy-friendly defaults (blocks Discord analytics & crash reporting)
- Cross-platform: Windows, Linux, macOS, and browser builds
- Optional transparency, acrylic/Mica (Windows), and vibrancy (macOS)

## Installing

### Windows (one command)

Open PowerShell and run:

```powershell
irm https://github.com/Iriscord/Iriscord/raw/main/scripts/bootstrap.ps1 | iex
```

This downloads the full Iriscord source to `%LocalAppData%\Iriscord\source` and opens the interactive installer. **Node.js** and **pnpm** are required ([nodejs.org](https://nodejs.org/)). Use menu option **9** to run `pnpm install`, then **1** to install (which builds and patches Discord).

### From source (developers)

```bash
pnpm install
pnpm build
```

**Windows:** double-click `install.cmd` or:

```powershell
.\install.ps1                    # interactive menu
.\install.ps1 -Install -Launch   # dev install + open Discord
pnpm inject                      # same as: node scripts/installDiscord.mjs --install
```

Iriscord uses its **own installer** (`scripts/installDiscord.mjs`) — it does **not** download Iriscord’s installer.

### GitHub releases

For the one-liner to install without building locally, publish a release with `dist` assets (`patcher.js`, `renderer.js`, etc.). Until then, clone the repo, run `pnpm build`, then install.

See [MIGRATION.md](./MIGRATION.md) if you are moving from Iriscord.

## Development

```bash
pnpm install
pnpm watch          # rebuild on change (Discord desktop)
pnpm buildWeb       # browser extension / userscript
pnpm test           # build + lint + typecheck
```

Settings and data are stored in `%AppData%/Iriscord` (or `~/Iriscord` on Linux/macOS). Existing **Iriscord** folders are detected automatically on first launch.

## Project layout

| Path | Purpose |
|------|---------|
| `src/` | Renderer, main process, plugins |
| `src/shared/branding.ts` | Product name, URLs, brand colors |
| `src/plugins/` | Built-in plugins (Iriscord + Iriscord) |
| `scripts/build/` | esbuild pipelines |
| `browser/` | Web extension / userscript entry |

## Branding

- **Product name:** Iriscord  
- **Short name:** Iris  
- **Global API:** `window.Iriscord` (legacy: `window.Iriscord`)  
- **Native bridge:** `IriscordNative` (legacy: `IriscordNative`)

## Disclaimer

Discord is a trademark of Discord Inc. Iriscord is not affiliated with or endorsed by Discord Inc.

Client modifications may violate Discord’s Terms of Service. Use at your own risk; avoid abusive plugins and sharing screenshots of modded clients in servers that disallow them.

## License

GPL-3.0-or-later — see upstream Iriscord for full copyright notices.
