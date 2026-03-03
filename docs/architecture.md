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
│   ├── graph-operations.ts     # Pure functions: createNode, removeNode, updateField, duplicate, clipboard, rewire, etc.
│   ├── subgraph-operations.ts  # Subgraph file format (.pfsg.json), serialize/deserialize/validate for cross-campaign export/import
│   ├── history-operations.ts   # HistorySnapshot type, createSnapshot, MAX_HISTORY_SIZE
│   ├── campaign-operations.ts  # createCampaign, createDefaultSettings, schema version
│   ├── template-operations.ts # Pure template CRUD: create, update, delete, instantiateTemplate
│   └── playthrough-operations.ts # Session CRUD, node visit tracking, diff maps, markdown export
│
├── application/                # State management, orchestration
│   ├── graph-store.ts          # useGraphStore — nodes, edges, viewport, selection, clipboard, undo/redo, importSubgraph
│   ├── history-store.ts        # useHistoryStore — past/future snapshot stacks for undo/redo
│   ├── campaign-store.ts       # useCampaignStore — campaign metadata + custom field template CRUD
│   ├── entity-store.ts         # useEntityStore — entity CRUD, registry, status tracking
│   ├── session-store.ts        # useSessionStore — playthrough sessions, diff overlay, timeline toggle
│   ├── ui-store.ts             # useUIStore — theme, overlay state, radial node, sidebar/panel toggles, template manager, auto-save state
│   └── campaign-actions.ts     # assemble/hydrate/save/load/auto-save campaign orchestration (incl. entity + session + history)
│
├── infrastructure/             # Browser APIs, serialization, file I/O
│   ├── file-io.ts              # Save/load JSON via File System Access API + fallback, file handle caching for auto-save, subgraph file I/O
│   ├── serialization.ts        # Campaign ↔ JSON with schema versioning (validates entityRegistry + playthroughLog + customFieldTemplates)
│   ├── markdown-export.ts      # Blob download helper for session markdown + entity codex export
│   └── theme.ts                # Dark/light mode persistence (localStorage + .dark class)
│
├── ui/                         # React components — ALL React imports live here
│   ├── components/             # Reusable UI components
│   │   ├── legend-panel.tsx    # Floating tag syntax cheatsheet (entity DSL reference)
│   │   ├── search-panel.tsx    # Search panel with text and entity filter modes
│   │   ├── session-timeline.tsx # Right slide-out panel: session visits, export, end session
│   │   ├── template-manager.tsx # Left slide-in panel: campaign field template CRUD
│   │   └── pwa-prompt.tsx     # Dismissable PWA install banner (beforeinstallprompt)
│   ├── graph/                  # React Flow canvas and custom nodes/edges
│   │   ├── graph-canvas.tsx    # ReactFlow wrapper, interaction handlers, context menus, shared SVG defs, HighlightContext provider
│   │   ├── story-node.tsx      # Memoized custom node with shared SVG glass shapes + long press + highlight context + diff overlay ring/dot
│   │   ├── highlight-context.tsx # React context providing Set<string> of entity-highlighted node IDs
│   │   ├── story-edge.tsx      # Custom edge with glass label pill + style-based rendering (default/conditional/secret)
│   │   ├── node-shapes.ts      # SVG path data for 5 shapes (circle, square, triangle, diamond, hexagon)
│   │   ├── use-flow-nodes.ts   # Domain → React Flow node/edge conversion
│   │   ├── context-menu.tsx    # Right-click node: change type, arc label, duplicate, delete, playthrough, clipboard, export subgraph (multi-select variant)
│   │   ├── edge-context-menu.tsx  # Right-click edge: change style, set label, delete edge
│   │   ├── edge-label-input.tsx   # Inline text input for edge labels and arc labels in context menus
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
│   │       └── custom-field-editor.tsx    # Label + content list editor with template picker (TipTap for content)
│   │
│   ├── hooks/                  # Shared React hooks
│   │   ├── use-long-press.ts   # 500ms hold detection, cancels on 5px drag
│   │   ├── use-escape-key.ts   # Global Escape keydown listener
│   │   ├── use-keyboard-shortcuts.ts  # Global shortcuts (Ctrl+/ legend, Ctrl+F search, Ctrl+E entities, Ctrl+T timeline, Ctrl+D diff, Ctrl+Z undo, Ctrl+Shift+Z redo, Ctrl+S save, Ctrl+A select all, Escape chain, Ctrl+C/X/V clipboard, Delete)
│   │   ├── use-auto-save.ts   # Interval-based auto-save hook with status flash
│   │   └── use-entity-highlight.ts # Computes entity highlight set once for all nodes (canvas-level)
│   │
│   ├── entities/               # Entity registry UI
│   │   ├── entity-sidebar.tsx  # Slide-in entity registry sidebar panel with codex export
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
│       ├── app-shell.tsx       # Main layout: Toolbar / Canvas+Overlays / StatusBar + panels + shortcuts + PWA prompt
│       ├── toolbar.tsx         # New Node, Save, Load, Import Subgraph, Auto-save, Undo/Redo, scroll direction, theme + Search, Entities, Templates, Legend, Session, Diff
│       ├── session-selector.tsx # Session lifecycle dropdown: start/end session, session list, delete
│       ├── scene-type-picker.tsx # Dropdown for selecting scene type on new node
│       ├── status-bar.tsx      # Campaign name, node count, edge count, entity count, active session, auto-save status, online/offline indicator
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

### Multi-Select and Clipboard (Phase 4)

```
Shift+click / lasso drag → React Flow onSelectionChange → graphStore.selectNodes(ids[])
  → selectedNodeIds: Set<string> stored in Zustand
  → use-flow-nodes.ts sets selected: true on matching flow nodes

Ctrl+C → graphStore.copySelectedNodes()
  → extractSubgraph(nodes, edges, selectedIds) → clipboard = { nodes[], edges[] }
Ctrl+V → graphStore.pasteClipboard()
  → pasteSubgraph(clipboard, offset) → new IDs, remapped edges → merge into graph
Ctrl+X → copySelectedNodes() then deleteSelectedNodes()
Delete → graphStore.deleteSelectedNodes() → removeNodes for all selected
```

### Undo/Redo (Phase 4)

```
Any mutating action (addNode, deleteNode, etc.)
  → saveHistory() captures { nodes, edges } as HistorySnapshot
  → pushes to useHistoryStore.past[], clears future[]
  → MAX_HISTORY_SIZE = 50 entries

Ctrl+Z → graphStore.undo()
  → popUndo(current) → pops past[], pushes current to future[]
  → restores snapshot into graph state
Ctrl+Shift+Z → graphStore.redo()
  → popRedo(current) → pops future[], pushes current to past[]
  → restores snapshot into graph state

moveNode: NO auto-push — canvas calls pushHistory() on drag start
Campaign load/reset: clears history stacks
```

### Edge Context Menu (Phase 5)

```
User right-clicks edge → ui/graph/graph-canvas.tsx → onEdgeContextMenu
  → ContextMenuState { type: 'edge', edgeId, position }
  → renders EdgeContextMenu component
  → Edge Style: setEdgeStyle(edgeId, 'default'|'conditional'|'secret')
  → Label: setEdgeLabel(edgeId, text) via EdgeLabelInput
  → Delete Edge: disconnectEdge(edgeId)
```

### Auto-Save (Phase 5)

```
User enables auto-save (toolbar Timer button) → useUIStore.toggleAutoSave()
  → useAutoSave hook (in AppShell) starts setInterval(autoSaveIntervalMs)
  → on tick: autoSaveCampaignAction() → assembleCampaign() → serializeCampaign()
    → saveToFileQuiet() → writes to cached FileSystemFileHandle (no picker)
  → status flash: setAutoSaveStatus('saving' → 'saved' → null)
  → status bar shows "Saving..." / "Saved ✓"
File handle cached from first manual save/load — auto-save writes silently after that
```

### Subgraph Export/Import (Phase 5)

```
Export (multi-select context menu → "Export Subgraph"):
  → serializeSubgraph(nodes, edges, selectedIds)
    → extractSubgraph() → SubgraphFile { format, version, nodes[], edges[] }
    → JSON.stringify() → saveSubgraphToFile() → .pfsg.json file

Import (toolbar "Import" button):
  → loadSubgraphFromFile() → JSON string
  → deserializeSubgraph(json) → validates format/version → { nodes[], edges[] }
  → graphStore.importSubgraph(nodes, edges) → pasteSubgraph(offset: 50,50)
    → new UUIDs, remapped edges → merge into graph, select imported nodes
```

## Cross-Cutting Concerns

- **Theming:** CSS custom properties (`--color-surface-glass`, `--color-text-primary`, etc.) toggled via `.dark` class on `<html>`. Persisted in localStorage. Aeroglass aesthetic with frosted translucent surfaces and backdrop-blur.
- **Error handling:** Domain functions throw for truly unexpected errors. Infrastructure validates campaign schema on load. UI catches at component boundaries.
- **Performance:** React Flow nodes MUST be memoized (`React.memo`). `nodeTypes` object MUST be at module level (not in render). Blurred overlays use CSS `backdrop-filter: blur()` which is GPU-intensive — test on lower-end hardware. SVG gradients/filters are shared at canvas level (not per-node). Entity highlight uses React context for O(1) per-node lookup. `useFlowNodes` splits base node data from selection state for better memo stability.
- **PWA:** Service worker precaches all static assets via vite-plugin-pwa + Workbox. No runtime caching (no API calls). Manifest enables standalone install. Online/offline status tracked in status bar.
