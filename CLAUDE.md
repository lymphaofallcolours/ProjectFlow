# CLAUDE.md

<!-- ROOT FILE: Keep under 150 lines. Hand-crafted. -->
<!-- Linting, formatting, and type checking are handled by tooling — not this file. -->

## Project Context

ProjectFlow — a narrative graph editor and session runner for tabletop RPG game mastering. Single-user, local-first web app.

**Stack:** TypeScript · React 18 · Zustand · React Flow · TipTap · Tailwind CSS · Vite
**Node:** ≥20 | **Package manager:** pnpm

## Architecture

Frontend-only React app. No backend. Data persisted via JSON file export/import (File System Access API with download fallback).

**UI Design:** Claude MUST use the `frontend-design` skill/plugin when building or modifying any UI component, layout, overlay, or visual element. Read the skill instructions BEFORE writing any component code. ProjectFlow should feel like a clean interface — not generic AI-generated UI.

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
| Enemy | `%` | `%@Name` | `%#Name` | `%@Target` |
| Object | `$` | `$@Name` | `$#Name` | `$@Item` |
| Location | `~` | `~@Name` | `~#Name` | `~@North District` |
| Secret | `&` | `&@Name` | `&#Name` | `&@Hidden Threat` |

Status markers: `@Alfa+wounded`, `!@Voss+dead`. Parsed by `domain/entity-tag-parser.ts`.

## Gotchas

- React Flow custom nodes MUST be memoized (React.memo) or the canvas re-renders on every state change.
- TipTap extensions for entity autocomplete are in `ui/components/tiptap-extensions/` — modifying these affects ALL text fields.
- The blurred background overlay uses `backdrop-filter: blur()` which is GPU-intensive. Test on lower-end hardware.
- JSON save files can grow large with base64 attachments. Keep attachment support behind a size warning.
- Entity tag regex lives in domain/ — if you change it, update the TipTap extension AND the search/filter logic.

## Autonomous Workflow — Claude MUST Follow Unprompted

Claude operates as a self-directed developer on this project. The following behaviors are MANDATORY and must happen WITHOUT the user asking.

### On Every Session Start
- Read `docs/wip.md` and `docs/decisions-log.md` BEFORE doing anything else.
- Read `docs/spec.md` if the current task touches a feature defined there.
- If a `docs/plans/` file exists for the current feature, read it and resume from where it left off.

### During Development
- **New file/module** → Update `docs/architecture.md` if it adds a boundary or layer.
- **Non-obvious decision** → Append to `docs/decisions-log.md` using the ADR format.
- **New dependency** → Document WHY in `docs/dependencies.md`.
- **Bug with non-obvious cause** → Add to Gotchas section above.
- **New pattern adopted** → Add to `docs/code-conventions.md`.

### On Every Commit
- Claude MUST update relevant docs IN THE SAME COMMIT as the code change. Docs are not a separate task — they are part of the work. A commit that changes architecture without updating `docs/architecture.md` is incomplete.
- Use conventional commit messages: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.

### On Session End / Task Completion
- Update `docs/wip.md` with: completed, in-progress, blocked, next steps.
- Log any TODO/FIXME added to code in `docs/wip.md` with file path and context.
- Self-check: "Did I change anything that makes existing docs stale?" If yes, fix now.

### Feature Planning (Master Plans)
When a new feature is being planned or started, Claude MUST:
1. Create `docs/plans/{feature-name}.md` with the full implementation plan BEFORE writing code.
2. The plan MUST include: goal, affected files/layers, data model changes, step-by-step implementation order, test strategy, and acceptance criteria.
3. Reference the plan file at any point during implementation to stay on track.
4. Update the plan if the approach changes mid-implementation (append "Revised" sections, don't delete the original).
5. When the feature is complete, move the plan to `docs/plans/completed/` and note completion in `docs/wip.md`.

```
docs/plans/
├── {feature-name}.md          # Active feature plans
└── completed/                 # Archived plans for finished features
```

### Development Decisions from the Spec
Claude MUST follow `docs/spec.md` as the source of truth for all feature design decisions. If the spec defines how something works, Claude implements it as specified. If Claude encounters ambiguity or a better approach, it MUST:
1. Log the concern in `docs/decisions-log.md`.
2. Propose the alternative to the user.
3. Only deviate from the spec after explicit approval.
4. Update `docs/spec.md` to reflect the approved change.

> ⚠️ Documentation updates are NOT optional. Stale docs are worse than no docs.
> A feature is not done until its docs are updated and its plan is archived.

## Documentation Map

```
docs/
├── spec.md                # Full project specification — source of truth for features
├── architecture.md        # Layer boundaries, component hierarchy, data flow
├── code-conventions.md    # Patterns, anti-patterns, examples
├── testing.md             # Test strategies, fixtures, mocking rules
├── wip.md                 # Session state — updated EVERY session
├── decisions-log.md       # ADRs — append-only
├── dependencies.md        # Why each dependency exists
├── changelog.md           # Maintained via conventional commits
└── plans/                 # Feature implementation plans
    ├── {feature}.md       # Active plans
    └── completed/         # Archived completed plans
```
