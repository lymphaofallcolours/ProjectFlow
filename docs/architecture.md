# Architecture

<!-- Claude: Update this file when new layers, boundaries, or major components are introduced. -->

## Overview

ProjectFlow is a client-side-only React web application for tabletop RPG narrative graph editing. No backend server. All data persists via JSON file export/import to the user's local filesystem.

## Layer Map

```
src/
├── domain/                     # Core types, business rules — ZERO framework imports
│   ├── types.ts                # Campaign, StoryNode, StoryEdge, NodeFields, SceneType, etc.
│   ├── entity-types.ts         # Entity, EntityType, EntityRegistry, ENTITY_TYPE_CONFIGS
│   ├── graph-operations.ts     # Pure functions: createNode, removeNode, updateField, etc.
│   └── campaign-operations.ts  # createCampaign, createDefaultSettings, schema version
│
├── application/                # State management, orchestration
│   ├── graph-store.ts          # useGraphStore — nodes, edges, viewport, scroll direction
│   ├── campaign-store.ts       # useCampaignStore — campaign metadata
│   ├── ui-store.ts             # useUIStore — theme, overlay state, radial node
│   └── campaign-actions.ts     # assemble/hydrate/save/load campaign orchestration
│
├── infrastructure/             # Browser APIs, serialization, file I/O
│   ├── file-io.ts              # Save/load JSON via File System Access API + fallback
│   ├── serialization.ts        # Campaign ↔ JSON with schema versioning
│   └── theme.ts                # Dark/light mode persistence (localStorage + .dark class)
│
├── ui/                         # React components — ALL React imports live here
│   ├── components/             # (planned) Reusable: chips, buttons, panels
│   ├── graph/                  # React Flow canvas and custom nodes/edges
│   │   ├── graph-canvas.tsx    # ReactFlow wrapper, interaction handlers, context menus
│   │   ├── story-node.tsx      # Memoized custom node with SVG glass shapes + long press
│   │   ├── story-edge.tsx      # Custom edge with glass label pill
│   │   ├── node-shapes.ts      # SVG path data for 5 shapes (circle, square, triangle, diamond, hexagon)
│   │   ├── use-flow-nodes.ts   # Domain → React Flow node/edge conversion
│   │   ├── context-menu.tsx    # Right-click node: change type, duplicate, delete
│   │   └── canvas-context-menu.tsx  # Right-click canvas: new node with type picker
│   │
│   ├── overlays/               # Three-tier interaction overlays
│   │   ├── overlay-root.tsx    # Dispatches to FieldPanel or CockpitOverlay from UI store
│   │   ├── overlay-backdrop.tsx # Frosted blur backdrop with click-to-dismiss + Escape
│   │   ├── radial-subnodes.tsx # 11 orbiting field buttons (screen-space, not graph nodes)
│   │   ├── field-panel.tsx     # Glass side panel for editing a single field
│   │   ├── field-icon.tsx      # Maps field icon names to Lucide components
│   │   ├── cockpit-overlay.tsx # Full-screen grid of all 11 field panels
│   │   ├── cockpit-field-panel.tsx # Individual collapsible field panel in cockpit
│   │   └── field-editors/      # Per-type editors
│   │       ├── field-editor.tsx         # Dispatcher: routes fieldKey to correct editor
│   │       ├── rich-content-editor.tsx  # Textarea for RichContent fields (Phase 1)
│   │       ├── dialogue-list-editor.tsx # Entity ref + line list editor
│   │       ├── soundtrack-list-editor.tsx # Track name + note list editor
│   │       ├── dice-roll-list-editor.tsx  # Description + formula list editor
│   │       └── custom-field-editor.tsx    # Label + content list editor
│   │
│   ├── hooks/                  # Shared React hooks
│   │   ├── use-long-press.ts   # 500ms hold detection, cancels on 5px drag
│   │   └── use-escape-key.ts   # Global Escape keydown listener
│   │
│   ├── entities/               # (planned) Entity registry page, profile sidebar
│   ├── editor/                 # (planned) TipTap editor, entity autocomplete
│   └── layout/                 # App shell and chrome
│       ├── app-shell.tsx       # Main layout: Toolbar / Canvas+Overlays / StatusBar
│       ├── toolbar.tsx         # New Node, Save, Load, scroll direction, theme toggle
│       ├── scene-type-picker.tsx # Dropdown for selecting scene type on new node
│       ├── status-bar.tsx      # Campaign name, node count, edge count
│       └── theme-initializer.tsx # Reads stored theme preference on mount
│
├── App.tsx                     # Root component — renders AppShell + ThemeInitializer
├── main.tsx                    # Entry point — mounts React to #root
└── index.css                   # Tailwind v4 + glass theme tokens + dark mode
```

## Dependency Rule

```
ui/ → application/ → domain/
         ↑
infrastructure/ (implements serialization/IO, consumed by campaign-actions)
```

- **domain/** imports NOTHING from other layers.
- **application/** imports from domain/ only. Zustand stores use domain types.
- **infrastructure/** imports from domain/ for types, implements serialization/IO.
- **ui/** imports from application/ (stores) and domain/ (types). Never from infrastructure/ directly.
- **campaign-actions.ts** bridges application/ and infrastructure/ — it's the only file that imports from both.

## Key Data Flows

### Creating a Node

```
User right-clicks canvas → ui/graph/canvas-context-menu.tsx
  → calls graphStore.addNode(sceneType, flowPosition)
  → store calls domain/graph-operations.createNode()
  → returns new StoryNode with empty NodeFields
  → store updates state → React Flow re-renders via useFlowNodes hook
```

### Three-Tier Drill Down

```
Tier 1: Single click → selects node (glow highlight, handles accent color)
Tier 2: Hold (500ms) or Alt+click → radial subnodes appear around node
        Click a subnode → field panel slides in over blurred backdrop
Tier 3: Double-click → full cockpit overlay with responsive grid of all 11 fields
```

### Saving a Campaign

```
User clicks Save → ui/layout/toolbar.tsx
  → calls campaign-actions.saveCampaignAction()
  → assembleCampaign() reads all stores, builds Campaign object
  → infrastructure/serialization.serializeCampaign(campaign) → JSON string
  → infrastructure/file-io.saveToFile(json, filename) → File System Access API or download
```

### Loading a Campaign

```
User clicks Load → ui/layout/toolbar.tsx
  → calls campaign-actions.loadCampaignAction()
  → infrastructure/file-io.loadFromFile() → JSON string (or null)
  → infrastructure/serialization.deserializeCampaign(json) → Campaign (validates schema)
  → campaign-actions.hydrateCampaign(campaign) → writes all stores
  → React Flow re-renders with loaded data
```

### Entity Tag Autocomplete (Phase 2)

```
User types "!@" in TipTap editor → ui/editor/EntityAutocompleteExtension
  → queries entityStore.getEntitiesByType('npc')
  → renders dropdown filtered by typed text
  → on select: inserts tag text + renders as colored chip
  → domain/entity-tag-parser.ts handles parsing for search/filter
```

## Cross-Cutting Concerns

- **Theming:** CSS custom properties (`--color-surface-glass`, `--color-text-primary`, etc.) toggled via `.dark` class on `<html>`. Persisted in localStorage. Aeroglass aesthetic with frosted translucent surfaces and backdrop-blur.
- **Error handling:** Domain functions throw for truly unexpected errors. Infrastructure validates campaign schema on load. UI catches at component boundaries.
- **Performance:** React Flow nodes MUST be memoized (`React.memo`). `nodeTypes` object MUST be at module level (not in render). Blurred overlays use CSS `backdrop-filter: blur()` which is GPU-intensive — test on lower-end hardware.
