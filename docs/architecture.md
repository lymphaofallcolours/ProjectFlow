# Architecture

<!-- Claude: Update this file when new layers, boundaries, or major components are introduced. -->

## Overview

ProjectFlow is a client-side-only React web application for tabletop RPG narrative graph editing. No backend server. All data persists via JSON file export/import to the user's local filesystem.

## Layer Map

```
src/
├── domain/               # Core types, business rules — ZERO framework imports
│   ├── types.ts          # Campaign, StoryNode, StoryEdge, NodeFields, etc.
│   ├── entity-types.ts   # Entity, EntityType, EntityRegistry, etc.
│   ├── entity-tag-parser.ts  # Regex-based parser for the tagging DSL
│   └── graph-operations.ts   # Pure functions: add/remove/connect nodes, validate graph
│
├── application/          # State management, orchestration
│   ├── graph-store.ts    # useGraphStore — Zustand store for graph state
│   ├── entity-store.ts   # useEntityStore — Zustand store for entity registry
│   ├── campaign-store.ts # useCampaignStore — top-level campaign state
│   └── playthrough-store.ts  # usePlaythroughStore — session tracking
│
├── infrastructure/       # Browser APIs, serialization, file I/O
│   ├── file-io.ts        # Save/load JSON via File System Access API + fallback
│   ├── serialization.ts  # Campaign ↔ JSON with schema versioning
│   └── theme.ts          # Dark/light mode persistence (CSS variables + localStorage)
│
├── ui/                   # React components — ALL React imports live here
│   ├── components/       # Reusable: chips, buttons, panels, legend, markdown viewer
│   ├── graph/            # React Flow: canvas, custom node shapes, edge renderers
│   ├── overlays/         # Tier 2 (radial subnodes, field panel) + Tier 3 (cockpit)
│   ├── entities/         # Entity registry page, profile sidebar, search
│   ├── editor/           # TipTap editor, entity autocomplete extension
│   └── layout/           # App shell, toolbar, status bar, theme toggle
│
└── main.tsx              # App entry point — mounts React, initializes stores
```

## Dependency Rule

```
ui/ → application/ → domain/
         ↑
infrastructure/ (implements interfaces, consumed by application/)
```

- **domain/** imports NOTHING from other layers.
- **application/** imports from domain/ only. Zustand stores use domain types.
- **infrastructure/** imports from domain/ for types, implements serialization/IO.
- **ui/** imports from application/ (stores) and domain/ (types). Never from infrastructure/ directly.
- **infrastructure/** is wired to application/ at the app entry point (main.tsx).

## Key Data Flows

### Creating a Node

```
User right-clicks canvas → ui/graph/ContextMenu
  → calls graphStore.addNode(sceneType, position)
  → store calls domain/graph-operations.createNode()
  → returns new StoryNode with empty NodeFields
  → store updates state → React Flow re-renders
```

### Saving a Campaign

```
User clicks Save → ui/layout/Toolbar
  → calls campaignStore.save()
  → store assembles full Campaign object from all stores
  → infrastructure/serialization.serialize(campaign)
  → infrastructure/file-io.saveToFile(json)
  → File System Access API writes to disk (or triggers download)
```

### Entity Tag Autocomplete

```
User types "!@" in TipTap editor → ui/editor/EntityAutocompleteExtension
  → queries entityStore.getEntitiesByType('npc')
  → renders dropdown filtered by typed text
  → on select: inserts tag text + renders as colored chip
  → domain/entity-tag-parser.ts handles parsing for search/filter
```

## Cross-Cutting Concerns

- **Theming:** CSS custom properties toggled via class on `<html>`. Tailwind `dark:` variants. Persisted in localStorage + campaign settings.
- **Error handling:** Domain functions return explicit errors (Result pattern or thrown for truly unexpected). UI catches at component boundaries with error boundaries.
- **Performance:** React Flow nodes MUST be memoized (React.memo). Large graphs (100+ nodes) may need virtualization. Blurred overlays use CSS `backdrop-filter` (GPU-bound).
