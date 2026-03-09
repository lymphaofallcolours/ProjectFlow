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
│   ├── entity-tag-parser.ts    # Regex parser for entity tagging DSL ([!%$~&]?[@#]Name(+status)?), extractEntityTypesFromNodeFields, extractStatusTagsFromText
│   ├── entity-operations.ts    # Pure CRUD for Entity and EntityRegistry (create, update, status, portrait, relationships, custom fields, computeIncomingRelationships)
│   ├── entity-graph-layout.ts  # Pure layout computation for entity relationship graph (type-clustered circular layout)
│   ├── search.ts               # Full-text and entity-aware node search across all fields
│   ├── graph-operations.ts     # Pure functions: createNode, removeNode, updateField, updateNodeTags, duplicate, clipboard, rewire, transposeNodePositions, etc. (group-aware)
│   ├── graph-layout.ts         # Dagre-based auto-arrange layout (pure algorithm, group-aware, selection-aware)
│   ├── align-distribute.ts     # Align (left/center/right/top/middle/bottom) and distribute (horizontal/vertical) layout functions
│   ├── node-dimensions.ts      # NODE_DIMENSIONS record — width/height per NodeShape, shared by domain + UI layers
│   ├── group-operations.ts     # Pure group CRUD: create, add/remove children, collapse, delete (keep/cascade), boundary/internal edges
│   ├── attachment-operations.ts # Pure attachment CRUD: create, validate size, add/remove from RichContent, campaign size estimation
│   ├── subgraph-operations.ts  # Subgraph file format (.pfsg.json), serialize/deserialize/validate for cross-campaign export/import
│   ├── history-operations.ts   # HistorySnapshot type, createSnapshot, MAX_HISTORY_SIZE
│   ├── campaign-operations.ts  # createCampaign, createDefaultSettings, schema version
│   ├── template-operations.ts # Pure template CRUD: create, update, delete, instantiateTemplate
│   ├── graph-templates.ts     # Built-in graph structure templates (blueprints → nodes+edges), createCustomTemplate
│   └── playthrough-operations.ts # Session CRUD, node visit tracking, diff maps, markdown export
│
├── application/                # State management, orchestration
│   ├── graph-store.ts          # useGraphStore — nodes, edges, viewport, selection, clipboard, undo/redo, importSubgraph, group actions, setNodeTags
│   ├── history-store.ts        # useHistoryStore — past/future snapshot stacks for undo/redo
│   ├── campaign-store.ts       # useCampaignStore — campaign metadata + custom field template CRUD + graph template CRUD
│   ├── entity-store.ts         # useEntityStore — entity CRUD, registry, status tracking, portrait, relationships
│   ├── session-store.ts        # useSessionStore — playthrough sessions, diff overlay, timeline toggle
│   ├── ui-store.ts             # useUIStore — theme, overlay state, radial node, sidebar/panel toggles, template manager, graph template picker, entity graph, dashboard, auto-save state, snap-to-grid, layout animation
│   └── campaign-actions.ts     # assemble/hydrate/save/load/auto-save campaign orchestration (incl. entity + session + history)
│
├── infrastructure/             # Browser APIs, serialization, file I/O
│   ├── file-io.ts              # Save/load JSON via File System Access API + fallback, file handle caching for auto-save, subgraph file I/O, readFileAsDataUrl
│   ├── serialization.ts        # Campaign ↔ JSON with schema versioning (validates entityRegistry + playthroughLog + customFieldTemplates + graphTemplates)
│   ├── markdown-export.ts      # Blob download helper for session markdown + entity codex export
│   └── theme.ts                # Dark/light mode persistence (localStorage + .dark class)
│
├── ui/                         # React components — ALL React imports live here
│   ├── components/             # Reusable UI components
│   │   ├── help-panel.tsx      # Multi-section help & reference panel (entity tags, shortcuts, interactions, workflow, sessions)
│   │   ├── search-panel.tsx    # Search panel with text, entity, and tags filter modes
│   │   ├── campaign-dashboard.tsx # Left slide-in panel: entity/node counts, graph stats, session stats, top connected, top tagged
│   │   ├── session-timeline.tsx # Right slide-out panel: session visits, export, end session
│   │   ├── template-manager.tsx # Left slide-in panel: campaign field template CRUD
│   │   ├── graph-template-picker.tsx # Left slide-in panel: built-in + custom graph structure templates, insert, save selection
│   │   ├── node-selector-input.tsx # Searchable dropdown for selecting a graph node (used in edge rewire)
│   │   └── pwa-prompt.tsx     # Dismissable PWA install banner (beforeinstallprompt)
│   ├── graph/                  # React Flow canvas and custom nodes/edges
│   │   ├── graph-canvas.tsx    # ReactFlow wrapper, interaction handlers, context menus, shared SVG defs, HighlightContext provider
│   │   ├── story-node.tsx      # Memoized custom node with shared SVG glass shapes + long press + highlight context + diff overlay ring/dot + group collapse/expand + stacked shadow + entity type summary badges + tag indicator
│   │   ├── highlight-context.tsx # React context providing Set<string> of entity-highlighted node IDs
│   │   ├── story-edge.tsx      # Custom edge with glass label pill + style-based rendering (default/conditional/secret)
│   │   ├── node-shapes.ts      # SVG path data for 5 shapes (circle, square, triangle, diamond, hexagon)
│   │   ├── use-flow-nodes.ts   # Domain → React Flow node/edge conversion, collapsed group filtering, edge remapping/dedup
│   │   ├── context-menu.tsx    # Right-click node: change type, arc label, tags (TagChipEditor), duplicate, delete, playthrough, clipboard, export subgraph, save as structure, group/ungroup/collapse (multi-select variant)
│   │   ├── edge-context-menu.tsx  # Right-click edge: change style, set label, delete edge, rewire source/target
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
│   │       ├── rich-content-editor.tsx  # TipTap editor for RichContent fields with entity autocomplete + attachment gallery
│   │       ├── dialogue-list-editor.tsx # Entity ref + line list editor
│   │       ├── soundtrack-list-editor.tsx # Track name + note list editor
│   │       ├── dice-roll-list-editor.tsx  # Description + formula list editor
│   │       └── custom-field-editor.tsx    # Label + content list editor with template picker (TipTap for content) + attachment gallery
│   │
│   ├── hooks/                  # Shared React hooks
│   │   ├── use-long-press.ts   # 500ms hold detection via native DOM events (ref callback), cancels on 15px drag
│   │   ├── use-escape-key.ts   # Global Escape keydown listener
│   │   ├── use-menu-position.ts # Viewport-aware menu positioning via useLayoutEffect DOM mutation
│   │   ├── use-keyboard-shortcuts.ts  # Global shortcuts (Ctrl+/ legend, Ctrl+F search, Ctrl+E entities, Ctrl+T timeline, Ctrl+D diff, Ctrl+Z undo, Ctrl+Shift+Z redo, Ctrl+Shift+R entity graph, Ctrl+S save, Ctrl+A select all, Escape chain, Ctrl+C/X/V clipboard, Delete)
│   │   ├── use-auto-save.ts   # Interval-based auto-save hook with status flash
│   │   └── use-entity-highlight.ts # Computes entity highlight set once for all nodes (canvas-level)
│   │
│   ├── entities/               # Entity registry UI
│   │   ├── entity-sidebar.tsx  # Slide-in entity registry sidebar panel with codex export
│   │   ├── entity-list.tsx     # Filterable entity list with type chips
│   │   ├── entity-profile.tsx  # Entity detail view with collapsible sections (portrait, history, relationships, custom fields)
│   │   ├── entity-portrait.tsx # Circular portrait upload/display with hover overlay and size warning
│   │   ├── entity-history-editor.tsx    # Status history list: chronological entries, add manual, delete
│   │   ├── entity-relationships-editor.tsx # Relationship CRUD: entity selector, type input, navigate to target, "Referenced By" incoming relationships
│   │   ├── entity-graph-node.tsx          # Custom React Flow node for entity relationship graph (circular badge + abbreviation)
│   │   ├── entity-relationship-graph.tsx  # Full-panel overlay: interactive entity relationship graph with type filter pills (React Flow, separate provider)
│   │   ├── entity-custom-fields.tsx     # Key-value editor for arbitrary custom fields
│   │   └── entity-create-dialog.tsx     # Entity creation form dialog
│   │
│   ├── editor/                 # TipTap editor and entity autocomplete
│   │   ├── tiptap-editor.tsx   # TipTap rich text editor wrapper with Link extension + status auto-logging
│   │   ├── attachment-gallery.tsx # Image attachment gallery below editor: thumbnail grid, drag-drop, file picker, size warnings
│   │   ├── entity-mention-extension.ts  # Two Mention extension instances (@ present, # mentioned)
│   │   ├── entity-chip.tsx     # Inline entity chip rendering (colored by type)
│   │   ├── entity-chip-node-view.tsx    # TipTap NodeView bridge: clickable chips (open sidebar), hover tooltip
│   │   ├── entity-tooltip.tsx  # Portal-based tooltip: entity name, type, description preview, status
│   │   └── entity-suggestion.tsx        # Autocomplete dropdown for entity tag insertion
│   │
│   └── layout/                 # App shell and chrome
│       ├── app-shell.tsx       # Main layout: Toolbar / Canvas+Overlays / StatusBar + panels + entity graph + dashboard + shortcuts + PWA prompt
│       ├── toolbar.tsx         # New Node, Save, Load, Import Subgraph, Auto-save, Undo/Redo, scroll direction, theme + Search, Entities, Relationships, Dashboard, Templates, Legend, Session, Diff
│       ├── session-selector.tsx # Session lifecycle dropdown: start/end session, session list, delete
│       ├── scene-type-picker.tsx # Dropdown for selecting scene type on new node
│       ├── status-bar.tsx      # Campaign name, node count, edge count, entity count, group count, active session, auto-save status, online/offline indicator
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
Tier 2: Hold (500ms) or Shift+click → radial subnodes appear around node
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

### Collapsible Groups (Phase 7)

```
Multi-select + right-click → "Group Selected"
  → graphStore.createGroup(sceneType, position) → group StoryNode with isGroup: true
  → graphStore.addToGroup(groupId, nodeIds) → sets groupId on children
  → use-flow-nodes.ts: group and children render normally

Right-click group → "Collapse"
  → graphStore.toggleGroupCollapsed(groupId) → collapsed: true
  → use-flow-nodes.ts:
    1. Filters out children of collapsed groups from flowNodes
    2. Remaps boundary edges to point at group node (source/target replacement)
    3. Hides internal edges (both endpoints in same group)
    4. Deduplicates merged edges (e.g., two children→external → one group→external)
  → story-node.tsx: renders stacked shadow layers behind collapsed group

Moving a group → graphStore.moveNode(groupId, pos)
  → computes delta, translates all children by same dx/dy

Deletion:
  → "Ungroup" → deleteGroup(id, cascade=false) → clears groupId on children, removes group node
  → "Delete Group + Children" → deleteGroup(id, cascade=true) → removes group + all children + their edges
```

### Entity Chip Click + Tooltip (Phase 8)

```
User hovers over entity chip in TipTap → entity-chip-node-view.tsx
  → 300ms delay → renders EntityTooltip via createPortal(…, document.body)
  → tooltip shows: entity name, type icon, description preview (80 chars), last status
  → mouse leave → 150ms delay → hides tooltip

User clicks entity chip → entity-chip-node-view.tsx onClick
  → entityStore.getByName(name, type) → finds entity
  → uiStore.openEntitySidebar() → non-toggling open
  → uiStore.selectEntity(entity.id) → sidebar scrolls to entity profile
```

### Status Auto-Logging (Phase 8)

```
User types "@Alfa+wounded" in TipTap field → tiptap-editor.tsx onUpdate
  → extractStatusTagsFromText(oldText) vs extractStatusTagsFromText(newText)
  → diff: new status tags not present in old text
  → for each new tag: entityStore.getByName(tag.name, tag.entityType)
  → entityStore.addStatus(entity.id, nodeId, tag.status)
  → entity's statusHistory updated, visible in entity profile history editor
nodeId threaded: field-editor.tsx → rich-content-editor.tsx → tiptap-editor.tsx
```

### Edge Rewire (Phase 8)

```
User right-clicks edge → edge-context-menu.tsx → "Rewire" button
  → showRewire = true → renders two NodeSelectorInput dropdowns (source, target)
  → NodeSelectorInput: searchable list of all graph nodes, filtered by text input
  → user selects new source or target node
  → graphStore.rewireEdge(edgeId, newSource?, newTarget?)
  → domain/graph-operations.rewireEdge() validates and updates edge endpoints
```

### Attachment Gallery (Phase 7)

```
User opens any RichContent field editor (script, gmNotes, vibe, etc.)
  → RichContentEditor renders TipTapEditor + AttachmentGallery
  → AttachmentGallery reads value.attachments (Attachment[])
  → "Add Image" or drag-and-drop → file-io.readFileAsDataUrl(file)
    → attachment-operations.createAttachment() → Attachment with UUID
    → attachment-operations.validateAttachmentSize() → warning if > 2MB
    → attachment-operations.addAttachment(richContent, att) → updated RichContent
  → Remove button → attachment-operations.removeAttachment(richContent, id)
  → Attachments persist in RichContent.attachments[] → serialized with campaign JSON
```

### Node Tag System (Phase 9)

```
Right-click node → context-menu.tsx → "Tags" section
  → TagChipEditor: colored chips with X to remove, text input to add
  → graphStore.setNodeTags(nodeId, tags[])
  → domain/graph-operations.updateNodeTags() → immutable update with updatedAt
  → story-node.tsx: Tag icon (7px) at bottom-left when tags.length > 0

Search panel → Tags mode (third tab):
  → useMemo: scans all nodes, collects unique tags with frequency counts
  → filtered by search input
  → click tag → selectNodes(matchingIds) → highlights all tagged nodes
```

### Entity Relationship Graph (Phase 9)

```
Toolbar "Relationships" button or Ctrl+Shift+R → uiStore.toggleEntityGraph()
  → entity-relationship-graph.tsx: full-panel overlay (z-40)
  → Type filter pills: 6 toggleable pills, one per EntityType
  → domain/entity-graph-layout.computeEntityGraphLayout(entities, typeFilter)
    → type-clustered layout: 6 cluster centers, entities in circles around clusters
    → edges from entity.relationships[] (filtered to visible entities)
  → React Flow (separate ReactFlowProvider): entity-graph-node.tsx custom nodes
    → circular badge (type color, 2-letter abbreviation, name label)
  → click entity node → uiStore.selectEntity() + openEntitySidebar()
```

### Campaign Dashboard (Phase 9)

```
Toolbar "Dashboard" button → uiStore.toggleDashboard()
  → campaign-dashboard.tsx: left slide-in panel (w-80, z-30)
  → Entity counts by type: 6 colored badges (useMemo)
  → Node counts by scene type: 5 colored badges (useMemo)
  → Graph stats: edge count, group count
  → Session stats: session count, latest date
  → Top 5 most connected: outgoing + computeIncomingRelationships (useMemo)
  → Top 5 most tagged nodes: sorted by tag count (useMemo)
All reads from stores; no derived/cached state needed at campaign scale
```

## Cross-Cutting Concerns

- **Theming:** CSS custom properties (`--color-surface-glass`, `--color-text-primary`, etc.) toggled via `.dark` class on `<html>`. Persisted in localStorage. Aeroglass aesthetic with frosted translucent surfaces and backdrop-blur.
- **Error handling:** Domain functions throw for truly unexpected errors. Infrastructure validates campaign schema on load. UI catches at component boundaries.
- **Performance:** React Flow nodes MUST be memoized (`React.memo`). `nodeTypes` object MUST be at module level (not in render). Blurred overlays use CSS `backdrop-filter: blur()` which is GPU-intensive — test on lower-end hardware. SVG gradients/filters are shared at canvas level (not per-node). Entity highlight uses React context for O(1) per-node lookup. `useFlowNodes` splits base node data from selection state for better memo stability.
- **PWA:** Service worker precaches all static assets via vite-plugin-pwa + Workbox. No runtime caching (no API calls). Manifest enables standalone install. Online/offline status tracked in status bar.
- **E2E Testing:** Playwright with Chromium + Firefox. Config in `playwright.config.ts`, tests in `tests/e2e/`. Auto-starts Vite dev server. Shared helper (`tests/e2e/helpers.ts`) for node creation. Excluded from Vitest via `vitest.config.ts` exclude pattern.
