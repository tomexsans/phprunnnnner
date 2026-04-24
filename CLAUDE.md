# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start in development mode (passes --no-sandbox for Linux)
npm run build      # Build all three targets (main, preload, renderer) via electron-vite
npm run package    # Package as AppImage/deb (Linux), dmg (macOS), exe (Windows)
npm run typecheck  # Run vue-tsc --noEmit (no test suite exists)
npm run lint       # ESLint on .vue, .ts, .tsx files with auto-fix
```

There are no automated tests. Type-checking is the primary correctness gate.

## Architecture

This is an Electron + Vue 3 app built with `electron-vite`. The three entry points are:

- **`src/main/`** — Electron main process (Node.js). Registers IPC handlers and creates the frameless window.
- **`src/preload/index.ts`** — Exposes a typed `window.electronAPI` bridge via `contextBridge`. This is the only way the renderer communicates with the main process.
- **`src/renderer/src/`** — Vue 3 SPA (Vite + Tailwind + Pinia + Monaco Editor).

### IPC Layer

All cross-process calls flow through `window.electronAPI`, defined in `src/preload/index.ts`. The main process handlers live in `src/main/ipc/`:

| File | IPC channels |
|---|---|
| `phpRunner.ts` | `php:run`, `php:detect`, `laravel:validate` |
| `store.ts` | `store:get`, `store:set`, `store:getAll` |
| `dialog.ts` | `dialog:openDirectory` |

Window controls (`window:minimize/maximize/close`) are fired via `ipcRenderer.send` (one-way).

### PHP Execution Pipeline

`src/main/ipc/phpRunner.ts` handles all PHP execution:

1. PHP code is written to a temp file in `os.tmpdir()` — no shell injection risk.
2. A PHP preamble (`DUMP_HELPERS`) defining `__tinker_serialize`, `dump()`, and `dd()` is prepended to every script. These are injected before any user code or Laravel bootstrap.
3. `dump()`/`dd()` output is delimited by sentinel bytes (`\x02TDUMP\x03` ... `\x02ENDDUMP\x03`) so the renderer can distinguish structured dump data from plain stdout.
4. For Laravel connections, `buildLaravelScript()` bootstraps the app via `vendor/autoload.php` + `bootstrap/app.php` before running user code.
5. On Flatpak, all process spawning is routed through `flatpak-spawn --host`.

### Output Parsing

`src/renderer/src/composables/useOutputParser.ts` splits raw PHP stdout into `OutputSegment[]` using the sentinel regex. Each segment is either `{ kind: 'text' }` or `{ kind: 'dump', value: DumpValue }`.

`DumpValue` is a discriminated union (defined in `src/renderer/src/types/index.ts`) that the recursive `DumpNode.vue` component renders as a collapsible tree.

### State Management

Two Pinia stores:

- **`useSettingsStore`** (`src/renderer/src/stores/settings.ts`) — App settings, connections list, active connection. Persisted to `electron-store` via `store:get/set`.
- **`useEditorStore`** (`src/renderer/src/stores/editor.ts`) — Tabs, run state, last result, saved files. Tabs auto-persist via a `watch` that fires `saveTabs()` after initial load.

Settings must be explicitly saved by the user (Save button in SettingsPanel); tab state is auto-saved on every change.

### Renderer Component Tree

```
MainView.vue
├── TitleBar.vue          (custom frameless window controls)
├── TabBar.vue            (multi-tab management)
├── Toolbar.vue           (Run button, connection selector, settings/saved files toggles)
├── MonacoEditor.vue      (Monaco editor, emits @run and @save)
├── OutputPanel.vue       (renders OutputSegment[] via DumpNode.vue)
├── SettingsPanel.vue     (slide-in settings + ConnectionsSection.vue)
├── SavedFilesPanel.vue   (slide-in saved snippets list)
└── SaveNameDialog.vue    (modal for naming untitled files on save)
```

### Tailwind Theme

Custom design tokens are in `tailwind.config.js`. Key colors: `surface` (dark bg, Catppuccin Mocha palette), `border`, `accent.purple/blue/cyan/green/yellow/red/orange`. Font family: `font-mono` → JetBrains Mono.

### Path Aliases

`@` and `@renderer` both resolve to `src/renderer/src/`. `@main` resolves to `src/main/`. Configured in `electron.vite.config.ts`.

## Flatpak

`src/main/ipc/phpRunner.ts` detects Flatpak by checking `/.flatpak-info` and routes all process spawning through `flatpak-spawn --host`. Flatpak manifests and `generated-sources.json` are in `flatpak/`. App ID: `io.github.tomexsans.PHPRunnnnner`.
