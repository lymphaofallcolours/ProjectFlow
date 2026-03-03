# Changelog

<!-- Claude: Update this file with each commit via conventional commit format. -->

## Phase 6 — Custom Field Templates, Performance, PWA (2026-03-03)

### docs: add integration tests, update all docs, polish for Phase 6 completion
- 8 integration tests: template roundtrip (3), performance/highlight (5)
- All docs updated (architecture, decisions-log, changelog, wip, dependencies), plan archived

### feat: add PWA offline mode with service worker and install prompt
- vite-plugin-pwa with autoUpdate registration and Workbox precaching
- Web manifest (ProjectFlow branding, standalone display), PWA meta tags
- Dismissable install banner (beforeinstallprompt), localStorage dismissal
- Online/offline indicator in status bar via navigator.onLine events

### perf: shared SVG defs, entity highlight context, split node mapping
- Removed per-node `<defs>` blocks (N duplicate gradients/filters)
- 5 glass gradients + 1 highlight-sheen + 1 node-glow filter defined once at canvas level
- Entity highlight computed once via useEntityHighlight() hook, provided via React context
- useFlowNodes memo split: base node data stable when only selection changes

### feat: add template manager UI and template picker in custom field editor
- Template Manager: left slide-in panel with CRUD for campaign field templates
- Custom field editor gains picker dropdown: "Blank field" or pick from templates
- Template-derived fields show "template" badge, templateId set on instantiation
- Toolbar Templates button (LayoutTemplate icon), templateManagerOpen in UI store

### feat: fix template persistence bug, add template operations and store CRUD
- BUG FIX: assembleCampaign() now includes customFieldTemplates from campaign store
- BUG FIX: hydrateCampaign() now loads templates on deserialization
- New domain/template-operations.ts: create, update, delete, instantiateTemplate
- useCampaignStore extended with template CRUD (add, update, remove, loadTemplates)
- Serialization validates customFieldTemplates array (backward-compatible)

---

## Phase 5 — Polish & Power Features (2026-03-02)

### docs: add integration tests, update all docs, polish for Phase 5 completion
- 5 integration tests: subgraph export/import roundtrip, file format validation, import persistence, auto-save state, entity codex export
- All docs updated (architecture, decisions-log, changelog, wip), plan archived to completed/

### feat: add subgraph export/import between campaigns
- Subgraph file format (.pfsg.json) with format tag, version, serialize/deserialize/validate
- Multi-select context menu gains "Export Subgraph" item via serializeSubgraph + saveSubgraphToFile
- Toolbar gains "Import Subgraph" button via loadSubgraphFromFile + importSubgraph store action
- Import creates new IDs via pasteSubgraph, selects imported nodes

### feat: add entity registry markdown codex export
- exportEntityRegistryAsMarkdown() groups entities by type (PC→NPC→Enemy→Object→Location→Secret)
- Alphabetical sort within groups, includes description, affiliations, status history
- Entity sidebar gains "Export Codex" button (FileText icon) that downloads .md file

### feat: implement auto-save with file handle caching and toolbar toggle
- File handle caching: saveToFile/loadFromFile cache FileSystemFileHandle, saveToFileQuiet writes silently
- useAutoSave hook with configurable interval (default 60s), status flash ("Saving..."/"Saved ✓")
- Auto-save state in useUIStore (enabled, intervalMs, status)
- Toolbar Timer icon toggle, status bar auto-save indicator

### feat: expand keyboard shortcuts with Ctrl+S, Ctrl+A, and Escape priority chain
- Ctrl+S → save campaign, Ctrl+A → select all nodes
- Escape priority chain: overlay → radial subnodes → panels → selection

### feat: add edge context menu, arc label UI, and edge label input
- EdgeContextMenu: glass-panel context menu for edges (style, label, delete)
- Fixed Phase 4 stub: onEdgeContextMenu now correctly routes to edge context menu
- Arc label section in node context menu with inline EdgeLabelInput
- EdgeLabelInput: reusable inline text input with confirm/cancel/clear

---

## Phase 4 — Advanced Graph Operations (2026-03-02)

### docs: add integration tests, update all docs, polish for Phase 4 completion
- 11 integration tests: clipboard roundtrip, undo/redo, edge style/arc label persistence, history lifecycle
- All docs updated (architecture, decisions-log, changelog, wip), plan archived to completed/

### feat: implement undo/redo history with toolbar buttons and keyboard shortcuts
- Custom history stack (useHistoryStore) with past/future snapshot arrays, MAX_HISTORY_SIZE=50
- All mutating graph-store actions auto-push snapshots before mutation
- moveNode excluded from auto-push — canvas pushes on drag start
- Undo/Redo toolbar buttons (Undo2/Redo2 icons), disabled when unavailable
- Ctrl+Z (undo), Ctrl+Shift+Z (redo) wired in keyboard shortcuts
- Campaign load clears history, new campaign resets it

### feat: add multi-select, clipboard, edge styling, arc labels, and node rewiring
- Multi-select: Shift+click additive, lasso drag area select via React Flow native selection
- Replaced `selectedNodeId` with `selectedNodeIds: Set<string>`, migrated 4 consumer files
- Clipboard: Ctrl+C (copy), Ctrl+X (cut), Ctrl+V (paste), Delete/Backspace (delete selected)
- Subgraph extraction preserves internal edges, paste creates new IDs with remapped references
- Edge styling: default (solid), conditional (dashed amber), secret (dotted faded)
- Arc label: context menu inline text input, renders above node shape
- Node rewiring: `rewireEdge` domain function for changing edge source/target
- Multi-select context menu variant: Copy, Cut, Duplicate N, Delete N
- Status bar shows "N selected" when multi-selection active

---

## Phase 3 — Playthrough Tracking & Diff (2026-03-02)

### docs: add integration tests, update all docs, polish for Phase 3 completion
- 12 integration tests: playthrough roundtrip (8) + session timeline (4)
- Tests cover session CRUD, save/load persistence, diff maps, markdown export, backward compatibility
- All docs updated, plan archived to completed/

### feat: add session timeline sidebar, markdown export, and keyboard shortcuts
- Session timeline: right slide-out panel with chronological node visits, editable label, export
- Markdown export: session journal with header, visit list, status notes, statistics
- Keyboard shortcuts: Ctrl+T (timeline), Ctrl+D (diff overlay)

### feat: implement diff overlay on graph nodes and session selector toolbar
- Session selector dropdown: start/end session, session list, delete sessions
- Diff overlay: colored stroke ring (3.5px) + glow on visited nodes, dims unvisited
- Status dot: 7px circle on bottom-right of nodes with playthrough status
- Toolbar diff toggle button (Eye icon), status bar session info

### feat: add playthrough status context menu with notes input
- Context menu "Playthrough" section: played as planned, modified, skipped
- "Modified" triggers inline notes input (auto-focus, Enter/Escape)
- Dual write to graph store (persistent status) and session store (session visit log)

### feat: add session store and campaign integration for playthrough
- useSessionStore: session lifecycle, node visits, diff overlay, timeline toggle
- Graph store gains setPlaythroughStatus/clearPlaythroughStatus
- Campaign assemble/hydrate/reset wired to session store
- Serialization validates playthroughLog (backward-compatible: missing = empty array)

### feat: add playthrough domain operations and status config
- Pure functions: session CRUD, node visit tracking, diff map computation
- exportSessionAsMarkdown with formatted header, timeline, and statistics
- PLAYTHROUGH_STATUS_CONFIG with labels, colors, icons for 4 statuses
- Test factories for PlaythroughEntry and NodeVisit

---

## Phase 2 — Entity System (2026-03-02)

### feat: add search panel, keyboard shortcuts, and entity graph highlighting
- Search panel with text and entity search modes, debounced input, results grouped by node
- Entity highlight filter dims non-matching nodes on graph canvas
- Global keyboard shortcuts: Ctrl+/ (legend), Ctrl+F (search), Ctrl+E (entity sidebar)

### feat: add entity registry UI, legend panel, and toolbar integration
- Entity sidebar with search, type filter tabs, entity list, profile editing, create dialog
- Legend panel showing tag syntax cheatsheet with all 6 entity types
- Toolbar gains Search, Entities, and Legend buttons; status bar shows entity count

### feat: add entity mention extension, chip rendering, and autocomplete
- Two TipTap Mention extension instances (@ present, # mentioned) with prefix-based type detection
- Inline EntityChip renders as colored pill with type icon, solid/dashed border, optional status badge
- Autocomplete dropdown with keyboard navigation and "Create new" option

### feat: replace textareas with TipTap rich text editor
- TipTap v3.20.0 with StarterKit and Placeholder replaces all content textareas
- ProseMirror styles for aeroglass aesthetic, content synced as plain text

### feat: add entity store and campaign integration
- Zustand useEntityStore with CRUD, type/name queries, load/reset
- Campaign assemble/hydrate/reset now includes entity registry
- Serialization validates entityRegistry in schema check

### feat: add entity tag parser, entity operations, and search
- Regex-based entity tag parser for 6 types × 2 modes with status markers
- Pure entity CRUD operations: create, update, delete, add status
- Full-text search and entity-aware search across all node fields

---

## Phase 1 — Foundation MVP (2026-03-02)

### feat: implement Tier 3 — full cockpit overlay with responsive field grid
- Cockpit overlay with responsive 3/2/1 column grid of all 11 field panels
- Collapsible field panels (populated fields start expanded, empty collapsed)
- Inline-editable node label with scene type badge in cockpit header

### feat: implement Tier 2 — radial subnodes, field panel, and editors
- Hold (500ms) or Alt+click to reveal 11 radial field subnodes orbiting a node
- Click a subnode to open glass side-panel with field editor
- 5 field editor types: rich content, dialogue list, soundtrack list, dice roll list, custom field
- Overlay backdrop with frosted blur and click-to-dismiss

### feat: implement Tier 1 — selection, context menus, node creation
- Single-click node selection with glow highlight
- Right-click node: change scene type, duplicate, delete
- Right-click canvas: new node at exact position with scene type picker

### feat: add app shell, toolbar, status bar, save/load, and theme toggle
- Toolbar with new node button (scene type picker), save, load, scroll direction, theme toggle
- Status bar showing campaign name, node count, edge count
- Campaign action orchestration: assemble, hydrate, save, load

### feat: implement React Flow canvas with 5 custom glass-style node shapes
- Circle (event), square (narration), triangle (combat), diamond (social), hexagon (investigation)
- SVG glass rendering: gradient fill, glass reflection highlight, selection glow
- Memoized custom nodes, adaptive handle positions based on scroll direction

### feat: implement serialization, file I/O, and theme persistence
- JSON serialization with schema versioning (v1)
- File System Access API with download/upload fallback
- Theme persistence via localStorage with system preference detection

### feat: create Zustand stores for graph, campaign, and UI state
- useGraphStore: nodes, edges, viewport, scroll direction, all graph mutations
- useCampaignStore: campaign metadata (name, description, timestamps)
- useUIStore: theme, overlay state (discriminated union), radial node

### feat: define domain types, graph operations, and campaign factory
- Complete type system: Campaign, StoryNode, StoryEdge, NodeFields, SceneType
- 5 scene types with shape/color config, 11 field definitions with icons
- Pure graph operations: create, remove, update, duplicate nodes/edges

### chore: scaffold Vite + React + TypeScript project
- Initial project scaffold with Vite 7 + React 19 + TypeScript strict mode
- Configured path aliases, Tailwind CSS v4, Vitest with jsdom
- Directory skeleton: domain/, application/, infrastructure/, ui/
