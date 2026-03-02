# CLAUDE.md

<!-- ROOT FILE: Keep under 150 lines. Hand-crafted. -->
<!-- Linting, formatting, and type checking are handled by tooling — not this file. -->

## Project Context

ProjectFlow — a narrative graph editor and session runner for tabletop RPG game mastering. Single-user, local-first web app.

**Stack:** TypeScript · React 18 · Zustand · React Flow · TipTap · Tailwind CSS · Vite
**Node:** ≥20 | **Package manager:** pnpm

## Architecture

Frontend-only React app. No backend. Data persisted via JSON file export/import (File System Access API with download fallback).

```
src/
├── domain/           # Core types, entity system, graph model — ZERO framework imports
├── application/      # State management (Zustand stores), use cases, business logic
├── infrastructure/   # File I/O, browser APIs, serialization/deserialization
├── ui/               # React components, hooks, layouts, overlays
│   ├── components/   # Reusable UI components (chips, panels, buttons)
│   ├── graph/        # React Flow canvas, custom node shapes, edge renderers
│   ├── overlays/     # Tier 2 (radial subnodes, field panel) and Tier 3 (cockpit)
│   ├── entities/     # Entity registry, search, profile views
│   └── layout/       # Toolbar, status bar, theme, legend
└── main.tsx          # App entry point
```

### Hard Rules

- **domain/** MUST NOT import from React, Zustand, React Flow, or any UI library.
- **application/** MUST NOT import from ui/. State stores expose data; UI consumes it.
- All graph/entity types live in domain/. UI components import types from domain/, never define their own.
- Use path aliases (`@/domain/*`, `@/application/*`, `@/ui/*`, `@/infrastructure/*`).

> 📄 Full architecture → `docs/architecture.md`

## Key Commands

```bash
pnpm dev              # Start dev server (Vite)
pnpm build            # Production build
pnpm test             # Unit tests (Vitest, watch mode)
pnpm test:ci          # Full suite — unit + integration + e2e
pnpm lint             # ESLint + type check (tsc --noEmit)
pnpm lint:fix         # Auto-fix lint + format
pnpm preview          # Preview production build locally
```

## Code Conventions

### Naming

- Files/directories: `kebab-case` (e.g., `story-node.ts`, `radial-subnodes.tsx`)
- Types/Interfaces: `PascalCase` — no `I` prefix
- React components: `PascalCase` files matching component name (e.g., `NodeShape.tsx`)
- Functions/variables: `camelCase`
- Constants/env: `UPPER_SNAKE_CASE`
- Zustand stores: `use{Name}Store` (e.g., `useGraphStore`, `useEntityStore`)

### Patterns

- Named exports ONLY — no default exports (except React component files if needed by lazy loading).
- Prefer `type` over `interface` unless declaration merging is needed.
- Composition over inheritance — always. No class hierarchies.
- React components: functional only. Custom hooks for shared logic.
- State: Zustand for global state. React useState/useReducer for component-local state.
- Immutable updates in stores — use Immer middleware if nested updates get complex.
- Max component length: ~100 lines. Extract sub-components and hooks aggressively.
- Max function length: ~20 lines.

> 📄 Detailed patterns → `docs/code-conventions.md`

## Testing

Vitest for unit/integration. Playwright for E2E. Target: ≤5 min Red-Green-Refactor cycles.

- **~70% Unit** — domain logic, entity tag parsing, graph operations, store actions.
- **~20% Integration** — store + component interactions, serialization roundtrips.
- **~10% E2E** — critical flows: create node, edit content, save/load, entity tagging.
- AAA pattern. Test names as specs. Tests MUST be independent.
- Mock only infrastructure boundaries (file I/O). NEVER mock Zustand stores in unit tests — test them directly.

> 📄 Testing patterns → `docs/testing.md`

## Entity Tag System

The entity tagging DSL is a core domain concept. Any changes to tag syntax MUST be documented.

| Type | Prefix | Present | Mentioned | Example |
|------|--------|---------|-----------|---------|
| PC | *(none)* | `@Name` | `#Name` | `@Alfa` |
| NPC | `!` | `!@Name` | `!#Name` | `!@Voss` |
| Enemy | `%` | `%@Name` | `%#Name` | `%@Carnifex` |
| Object | `$` | `$@Name` | `$#Name` | `$@Rosarius` |
| Location | `~` | `~@Name` | `~#Name` | `~@Hive Primus` |
| Secret | `&` | `&@Name` | `&#Name` | `&@Genestealer` |

Status markers: `@Alfa+wounded`, `!@Voss+dead`. Parsed by `domain/entity-tag-parser.ts`.

## Gotchas

- React Flow custom nodes MUST be memoized (React.memo) or the canvas re-renders on every state change.
- TipTap extensions for entity autocomplete are in `ui/components/tiptap-extensions/` — modifying these affects ALL text fields.
- The blurred background overlay uses `backdrop-filter: blur()` which is GPU-intensive. Test on lower-end hardware.
- JSON save files can grow large with base64 attachments. Keep attachment support behind a size warning.
- Entity tag regex lives in domain/ — if you change it, update the TipTap extension AND the search/filter logic.

## Automated Documentation & Memory Maintenance

Claude MUST maintain living documentation as part of development.

### On Every Session Start
- Read `docs/wip.md` and `docs/decisions-log.md`.

### During Development
- **New file/module** → Update `docs/architecture.md` if it adds a boundary or layer.
- **Non-obvious decision** → Append to `docs/decisions-log.md`.
- **New dependency** → Document WHY in `docs/dependencies.md`.
- **Bug with non-obvious cause** → Add to Gotchas above.

### On Session End
- Update `docs/wip.md`: completed, in-progress, blocked, next steps.

> ⚠️ Documentation updates are NOT optional. If out of scope, add a TODO in `docs/wip.md`.

## Documentation Map

```
docs/
├── spec.md                # Full project specification (ProjectFlow-Spec.md)
├── architecture.md        # Layer boundaries, component hierarchy, data flow
├── code-conventions.md    # Patterns, anti-patterns, examples
├── testing.md             # Test strategies, fixtures, mocking rules
├── wip.md                 # Session state — updated EVERY session
├── decisions-log.md       # ADRs — append-only
├── dependencies.md        # Why each dependency exists
└── changelog.md           # Maintained via conventional commits
```
