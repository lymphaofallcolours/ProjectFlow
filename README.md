# ProjectFlow

A narrative graph editor and session runner for tabletop RPG game mastering. Build branching story structures during prep, navigate them during live play, and let the graph silently track what actually happened versus what was planned.

**[Live Demo](https://projectflow-1bi.pages.dev)**

## What It Does

ProjectFlow replaces spreadsheet-based campaign scripting with a visual node-and-edge graph. Each node is a story stage — a scene, encounter, or decision point — and edges are the transitions between them. Five node shapes map to narrative types: circles for events, squares for narration, triangles for combat, diamonds for social encounters, hexagons for investigation.

Every node holds 11 content fields (script, dialogue, GM notes, vibe, soundtrack, combat, characters, dice rolls, secrets, events, custom fields) accessible through a three-tier drill-down: click to select, Shift+click for radial field subnodes, double-click for a full cockpit editor.

During live play, start a session and mark nodes as you go. The diff overlay shows visited vs. skipped vs. modified nodes at a glance. After the session, export a markdown log of what actually happened.

### Key Features

- **Shaped narrative nodes** — 5 scene types with distinct glass-surfaced shapes and accent colors
- **Three-tier drill-down** — progressive disclosure from graph overview to field subnodes to full cockpit editor
- **Entity tagging DSL** — inline `@Name` / `#Name` tags with type prefixes for NPCs, enemies, objects, locations, and secrets; rendered as colored chips with autocomplete
- **Playthrough tracking** — session-based visit logging, diff overlays, and markdown export
- **Subgraph grouping** — collapsible named groups with boundary edge remapping
- **Graph structure templates** — built-in patterns (linear, branching, combat, social) and save-your-own custom templates
- **Entity relationship graph** — visualize entity connections in a type-clustered layout
- **Campaign dashboard** — stats, top connected entities, most tagged nodes
- **Full keyboard workflow** — undo/redo, clipboard, multi-select (Ctrl+click / lasso), Escape priority chain
- **Auto-save** — silent writes to the last-used file handle
- **Dark / light themes** — frosted aeroglass aesthetic with `backdrop-filter: blur()`
- **Offline-capable PWA** — service worker precaches all assets
- **Zero backend** — everything runs in the browser, data lives in JSON files you own

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) (the project uses `pnpm` as its package manager)

### Install and Run

```bash
git clone https://github.com/lymphaofallcolours/ProjectFlow.git
cd ProjectFlow
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with HMR |
| `pnpm build` | Production build (TypeScript + Vite) |
| `pnpm preview` | Preview production build locally |
| `pnpm test` | Unit/integration tests (Vitest, watch mode) |
| `pnpm test:ci` | Full test suite (single run) |
| `pnpm test:e2e` | E2E tests (Playwright, Chromium + Firefox) |
| `pnpm lint` | ESLint + TypeScript type check |
| `pnpm lint:fix` | Auto-fix lint issues |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript (strict) |
| UI | React 19 |
| State | Zustand |
| Graph | React Flow (xyflow) |
| Rich Text | TipTap (ProseMirror) |
| Styling | Tailwind CSS v4 |
| Build | Vite 7 |
| Tests | Vitest + Playwright |
| PWA | vite-plugin-pwa + Workbox |

## Project Structure

```
src/
├── domain/           # Core types, pure functions — zero framework imports
├── application/      # Zustand stores, business logic, campaign orchestration
├── infrastructure/   # File I/O, serialization, browser APIs
├── ui/               # React components, hooks, layouts
│   ├── components/   # Panels, search, templates, dashboard
│   ├── graph/        # React Flow canvas, custom node shapes, edges
│   ├── overlays/     # Radial subnodes, field panel, cockpit
│   ├── entities/     # Entity sidebar, profile, relationship graph
│   ├── editor/       # TipTap editor, entity chips, field editors
│   └── layout/       # Toolbar, status bar, theme, app shell
└── main.tsx
```

**Architecture rules:** `domain/` has zero framework imports. `application/` never imports from `ui/`. All graph and entity types live in `domain/`. Path aliases (`@/domain/*`, `@/application/*`, etc.) are used throughout.

## Entity Tag System

Tag characters, NPCs, objects, locations, and secrets inline in any text field. Tags render as colored chips with autocomplete.

| Type | Prefix | Present | Mentioned | Example |
|------|--------|---------|-----------|---------|
| PC | *(none)* | `@Name` | `#Name` | `@Alfa` |
| NPC | `!` | `!@Name` | `!#Name` | `!@Voss` |
| Enemy | `%` | `%@Name` | `%#Name` | `%@Target` |
| Object | `$` | `$@Name` | `$#Name` | `$@Sword` |
| Location | `~` | `~@Name` | `~#Name` | `~@North District` |
| Secret | `&` | `&@Name` | `&#Name` | `&@Hidden Threat` |

Append `+status` to any present tag to auto-log a status change: `@Alfa+wounded`.

## Testing

~720 tests across 47 test files:

- **Unit** (~70%) — domain logic, entity parsing, graph operations, store actions
- **Integration** (~20%) — store + component interactions, serialization roundtrips
- **E2E** (~10%) — critical flows via Playwright (Chromium + Firefox)

```bash
pnpm test        # watch mode
pnpm test:ci     # single run
pnpm test:e2e    # browser tests
```

## Save Format

Campaigns are saved as `.json` files. Subgraphs can be exported as `.pfsg.json` for cross-campaign sharing. All data stays on your machine — there is no server, no account, no cloud sync.

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
