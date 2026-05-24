# Manual plugins

Iriscord ships **without** built-in plugins. Add your own here.

## Install a plugin

1. Create a folder: `src/userplugins/YourPluginName/`
2. Add `index.ts` or `index.tsx` with a Iriscord-style plugin export (`export default definePlugin({...})`).
3. From the project root run:

```bash
pnpm build
```

then

```bash
pnpm inject
```

4. Fully quit Discord, then open it again (or use **Relaunch Discord** in Iriscord settings).

You can copy plugins from the [Iriscord plugin tree](https://github.com/Vendicated/Iriscord/tree/main/src/plugins) into this folder.

## Open this folder from Discord

**Iriscord Settings → Plugins → Open Plugins Folder**
