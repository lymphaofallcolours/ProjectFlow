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
│   ├── entity-tag-parser.ts    # Regex parser for entity tagging DSL ([!%$~&]?[@#]Name(+status)?)
│   ├── entity-operations.ts    # Pure CRUD for Entity and EntityRegistry (create, update, status)
│   ├── search.ts               # Full-text and entity-aware node search across all fields
│   ├── graph-operations.ts     # Pure functions: createNode, removeNode, updateField, etc.
│   ├── campaign-operations.ts  # createCampaign, createDefaultSettings, schema version
│   └── playthrough-operations.ts # Session CRUD, node visit tracking, diff maps, markdown export
│
├── application/                # State management, orchestration
│   ├── graph-store.ts          # useGraphStore — nodes, edges, viewport, scroll direction
│   ├── campaign-store.ts       # useCampaignStore — campaign metadata
│   ├── entity-store.ts         # useEntityStore — entity CRUD, registry, status tracking
│   ├── session-store.ts        # useSessionStore — playthrough sessions, diff overlay, timeline toggle
│   ├── ui-store.ts             # useUIStore — theme, overlay state, radial node, sidebar/panel toggles
│   └── campaign-actions.ts     # assemble/hydrate/save/load campaign orchestration (incl. entity + session)
│
├── infrastructure/             # Browser APIs, serialization, file I/O
│   ├── file-io.ts              # Save/load JSON via File System Access API + fallback
│   ├── serialization.ts        # Campaign ↔ JSON with schema versioning (validates entityRegistry + playthroughLog)
│   ├── markdown-export.ts      # Blob download helper for session markdown export
│   └── theme.ts                # Dark/light mode persistence (localStorage + .dark class)
│
├── ui/                         # React components — ALL React imports live here
│   ├── components/             # Reusable UI components
│   │   ├── legend-panel.tsx    # Floating tag syntax cheatsheet (entity DSL reference)
│   │   ├── search-panel.tsx    # Search panel with text and entity filter modes
│   │   └── session-timeline.tsx # Right slide-out panel: session visits, export, end session
│   ├── graph/                  # React Flow canvas and custom nodes/edges
│   │   ├── graph-canvas.tsx    # ReactFlow wrapper, interaction handlers, context menus
│   │   ├── story-node.tsx      # Memoized custom node with SVG glass shapes + long press + entity highlight + diff overlay ring/dot
│   │   ├── story-edge.tsx      # Custom edge with glass label pill
│   │   ├── node-shapes.ts      # SVG path data for 5 shapes (circle, square, triangle, diamond, hexagon)
│   │   ├── use-flow-nodes.ts   # Domain → React Flow node/edge conversion
│   │   ├── context-menu.tsx    # Right-click node: change type, duplicate, delete, playthrough status
│   │   ├── playthrough-notes-input.tsx # Inline notes input for "modified" playthrough status
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
│   │       ├── rich-content-editor.tsx  # TipTap editor for RichContent fields with entity autocomplete
│   │       ├── dialogue-list-editor.tsx # Entity ref + line list editor
│   │       ├── soundtrack-list-editor.tsx # Track name + note list editor
│   │       ├── dice-roll-list-editor.tsx  # Description + formula list editor
│   │       └── custom-field-editor.tsx    # Label + content list editor (TipTap for content)
│   │
│   ├── hooks/                  # Shared React hooks
│   │   ├── use-long-press.ts   # 500ms hold detection, cancels on 5px drag
│   │   ├── use-escape-key.ts   # Global Escape keydown listener
│   │   └── use-keyboard-shortcuts.ts  # Global shortcuts (Ctrl+/ legend, Ctrl+F search, Ctrl+E entities, Ctrl+T timeline, Ctrl+D diff)
│   │
│   ├── entities/               # Entity registry UI
│   │   ├── entity-sidebar.tsx  # Slide-in entity registry sidebar panel
│   │   ├── entity-list.tsx     # Filterable entity list with type chips
│   │   ├── entity-profile.tsx  # Entity detail view and inline editing
│   │   └── entity-create-dialog.tsx  # Entity creation form dialog
│   │
│   ├── editor/                 # TipTap editor and entity autocomplete
│   │   ├── tiptap-editor.tsx   # TipTap rich text editor wrapper component
│   │   ├── entity-mention-extension.ts  # Two Mention extension instances (@ present, # mentioned)
│   │   ├── entity-chip.tsx     # Inline entity chip rendering (colored by type)
│   │   ├── entity-chip-node-view.tsx    # TipTap NodeView bridge for chip rendering
│   │   └── entity-suggestion.tsx        # Autocomplete dropdown for entity tag insertion
│   │
│   └── layout/                 # App shell and chrome
│       ├── app-shell.tsx       # Main layout: Toolbar / Canvas+Overlays / StatusBar + panels + shortcuts
│       ├── toolbar.tsx         # New Node, Save, Load, scroll direction, theme + Search, Entities, Legend, Session, Diff
│       ├── session-selector.tsx # Session lifecycle dropdown: start/end session, session list, delete
│       ├── scene-type-picker.tsx # Dropdown for selecting scene type on new node
│       ├── status-bar.tsx      # Campaign name, node count, edge count, entity count, active session
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
  → assembleCampaign() reads all stores (graph, campaign, entity, session), builds Campaign object
  → infrastructure/serialization.serializeCampaign(campaign) → JSON string
  → infrastructure/file-io.saveToFile(json, filename) → File System Access API or download
```

### Loading a Campaign

```
User clicks Load → ui/layout/toolbar.tsx
  → calls campaign-actions.loadCampaignAction()
  → infrastructure/file-io.loadFromFile() → JSON string (or null)
  → infrastructure/serialization.deserializeCampaign(json) → Campaign (validates schema + entityRegistry)
  → campaign-actions.hydrateCampaign(campaign) → writes all stores (graph, campaign, entity, session)
  → React Flow re-renders with loaded data
```

### Entity Tag Autocomplete (Phase 2)

```
User types "!@" in TipTap editor → ui/editor/entity-mention-extension.ts
  → triggers ui/editor/entity-suggestion.tsx autocomplete dropdown
  → queries entityStore for entities by type
  → renders dropdown filtered by typed text
  → on select: inserts Mention node → rendered as colored chip via entity-chip-node-view.tsx
  → domain/entity-tag-parser.ts handles parsing for search/filter
```

### Entity Search and Highlight (Phase 2)

```
User opens search panel (Ctrl+F) → ui/components/search-panel.tsx
  → text mode: domain/search.ts.searchNodes() scans all fields via full-text match
  → entity mode: domain/search.ts.searchByEntity() finds nodes containing entity tags
  → results listed with node label + field + match text
  → clicking result navigates to node
  → entity highlight filter (uiStore.entityHighlightFilter) dims/glows nodes in graph canvas
```

### Playthrough Status Marking (Phase 3)

```
User right-clicks node → ui/graph/context-menu.tsx → "Playthrough" section
  → selects status (played_as_planned, modified, skipped)
  → "Modified" triggers PlaythroughNotesInput for notes entry
  → dual write:
    1. graphStore.setPlaythroughStatus(nodeId, status, notes) → persists on node
    2. sessionStore.recordNodeVisit(nodeId, status, notes) → logs in active session
  → story-node.tsx renders status dot (7px circle, status color)
```

### Diff Overlay (Phase 3)

```
User toggles diff overlay (toolbar Eye icon or Ctrl+D)
  → sessionStore.diffOverlayActive = true
  → story-node.tsx reads active/selected session
  → buildDiffMap(session) computes nodeId→status lookup on-the-fly
  → nodes with status: colored stroke ring (3.5px) + glow filter
  → unvisited nodes: dimmed (opacity 0.3)
```

### Session Timeline (Phase 3)

```
User opens timeline (Ctrl+T or toolbar button)
  → sessionStore.sessionTimelineOpen = true
  → ui/components/session-timeline.tsx slides in from right (w-80, z-30)
  → shows chronological node visits with status dots, notes, click-to-select
  → "Export MD" button: domain/playthrough-operations.exportSessionAsMarkdown()
    → infrastructure/markdown-export.ts.downloadMarkdown() → Blob download
```

## Cross-Cutting Concerns

- **Theming:** CSS custom properties (`--color-surface-glass`, `--color-text-primary`, etc.) toggled via `.dark` class on `<html>`. Persisted in localStorage. Aeroglass aesthetic with frosted translucent surfaces and backdrop-blur.
- **Error handling:** Domain functions throw for truly unexpected errors. Infrastructure validates campaign schema on load. UI catches at component boundaries.
- **Performance:** React Flow nodes MUST be memoized (`React.memo`). `nodeTypes` object MUST be at module level (not in render). Blurred overlays use CSS `backdrop-filter: blur()` which is GPU-intensive — test on lower-end hardware.
