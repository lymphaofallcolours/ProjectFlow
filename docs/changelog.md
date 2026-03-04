# Changelog

<!-- Claude: Update this file with each commit via conventional commit format. -->

## v1.0.1 (2026-03-04)

### fix: batch node movement to preserve relative positions
- Added `moveNodes` batch action to graph store — updates all node positions in a single atomic `set()` call
- Fixed `onNodesChange` drag-end handling: collects all position changes before committing, instead of committing one node and closing the gate
- Group-child translation preserved in batch moves
- 4 new unit tests for `moveNodes`

## v1.0.0 — Public Release (2026-03-04)

## Playthrough Notes, Light Mode, Subnode Polish (2026-03-03)

### fix: surface playthrough notes, improve light mode contrast, fix subnode behavior
- **Playthrough notes visibility**: status dot tooltip now includes `playthroughNotes`; new `CockpitPlaythroughPanel` in cockpit overlay shows status + notes when set
- **Light mode contrast**: adjusted 6 CSS variables (glass opacity, border tint, canvas, text-muted, node fill); replaced 5 hardcoded `hover:bg-white/*` classes with `hover:bg-surface-glass`
- **Subnode drag dismiss**: subnodes dismiss when user starts dragging their target node
- **Subnode scroll/zoom dismiss**: `onMoveStart` handler dismisses subnodes on any pan/zoom
- **Subnode spacing**: orbit radius 72→110, size 40→36, border 2px with `--color-border`, stronger shadows
- **Playthrough requires session**: playthrough status options disabled in context menu when no session is active; shows hint text instead

## Subnode Crash, Long-Press, Context Menu Fixes (2026-03-03)

### fix: resolve subnode crash, improve long-press and context menus
- **Subnode crash fix**: eliminated stale `radialNodeId` closures in graph-canvas callbacks (use `getState()` fresh reads); added `radialNodeExists` render guard; cleanup in `deleteNode`, `deleteSelectedNodes`, `deleteGroup`
- **Long-press on unselected nodes**: `handleLongPress` now calls `selectNodes` before `showRadialSubnodes` — single gesture selects + shows subnodes
- **Context menu Escape**: added `useEscapeKey(onClose)` to `NodeContextMenu` and `EdgeContextMenu`; refactored `CanvasContextMenu` to use shared hook
- **Context menu viewport overflow**: new `useMenuPosition` hook measures and repositions menus that overflow viewport bounds
- **Right-pointing triangle**: rotated combat triangle from upward to right-pointing; wider text area, handles at tip (horizontal) or top/bottom slopes (vertical)
- 3 new unit tests for radialNodeId cleanup on deletion

## UI Polish — Dots, Subnodes, Help Panel (2026-03-03)

### fix: improve dot visibility, subnode dismiss/contrast, add help panel
- **Dot visibility**: increased dot size 1.5→2.5 for light mode contrast
- **Subnode dismiss**: clicking a different node (without Shift) now hides subnodes; deselecting the radial node also dismisses
- **Subnode opacity**: opaque surface background, size 36→40, empty opacity 0.75, populated glow 40%
- **Help panel**: replaced legend-panel.tsx with 5-section help & reference panel (entity tags, shortcuts, interactions, workflow, sessions/diff)

## UI Fixes, E2E Testing & Polish (2026-03-03)

### test: add Playwright E2E testing with 6 test suites (25 tests, Chromium + Firefox)
- Playwright setup: `playwright.config.ts`, auto-starts Vite dev server, Chromium + Firefox
- `node-selection.e2e.test.ts`: single-click select, canvas deselect, Ctrl+Click multi-select
- `canvas-interaction.e2e.test.ts`: wheel pan, Ctrl+scroll zoom, background cycle
- `campaign-name.e2e.test.ts`: click-to-edit, Enter confirm, Escape cancel
- `subnode-trigger.e2e.test.ts`: Shift+Click, canvas dismiss, Shift key toggle
- `node-drag.e2e.test.ts`: drag moves node without blinking
- `cockpit-modes.e2e.test.ts`: double-click cockpit, scrollable toggle
- Shared `helpers.ts` for node creation, Vitest excludes e2e directory

### feat: 10 UI fixes — selection, interactions, theming, canvas, cockpit
- **Fix single-click selection**: rewrote `useLongPress` from React synthetic to native DOM events (ref callback), plus `onNodesChange` handles select changes for React Flow controlled mode
- **Light mode contrast**: CSS `--accent-mix` variable (40% light, 25% dark), darker canvas/node fills, stronger edge opacity
- **Triangle handle positioning**: `getHandleInsets()` calculates triangle perimeter intersection at horizontal midline (~39px inset)
- **Subnode triggers**: Alt→Shift (Firefox compatibility), long-press moveThreshold 5→15px, Shift key alone with selected node
- **Subnode visibility**: scrim overlay behind subnodes, empty field opacity 0.35→0.55
- **Node drag blink fix**: deferred `setDragPositions({})` via `requestAnimationFrame`, displayNodes guard against stale overrides
- **Canvas backgrounds**: `canvasBackground` state (dots/grid/none) with toolbar cycle button
- **Wheel-to-pan**: `panOnScroll` prop — raw wheel pans, Shift+wheel horizontal, Ctrl+wheel zoom
- **Cockpit scrollable mode**: toggle between auto-expand and scrollable (max-h-300px) field panels
- **Campaign name editing**: click-to-edit in status bar, Enter/Escape confirm/cancel
- Selection keys changed: Shift→Control for multi-select, selectionKeyCode→null (lasso via selectionOnDrag)
- 5 new unit tests (3 node shapes, 2 UI store)

## Previous UI Fixes (2026-03-03)

### fix: six UI improvements — node rendering, interactions, layout, cockpit, theming
- Fix circle node SVG cropping: add overflow="visible" to node SVG elements
- Fix layout direction switching: transposeNodePositions swaps X/Y relative to centroid on toggle
- Fix node interactions: long press restricted to left-click only (prevents right-click conflict)
- Smooth node dragging: drag position overlay pattern with useMemo-derived displayNodes
- Cockpit panels expanded by default with collective collapse/expand all button
- Light theme visibility: single-tone flat node fills (color-mix), dedicated --color-edge variable
- 8 new tests (5 transposeNodePositions + 3 setScrollDirection)

## Phase 9 — Campaign Intelligence & Navigation (2026-03-03)

### docs: add integration tests, update all docs, polish for Phase 9 completion
- 4 tag system integration tests: save/load roundtrip, undo, tag collection, tag filtering
- 3 entity graph integration tests: layout positions, edges, type filter
- 4 dashboard integration tests: entity counts, node counts, top connected, top tagged
- All docs updated (architecture, decisions-log, changelog, wip), plan archived

### feat: add incoming relationships and campaign dashboard
- computeIncomingRelationships domain function: scans all entities for reverse references
- "Referenced By" section in entity relationships editor with click-to-navigate
- Campaign dashboard panel: entity/node counts by type, graph/session stats, top 5 most connected entities, top 5 most tagged nodes
- Dashboard toolbar button (BarChart3), Escape chain integration

### feat: add entity relationship graph visualization with type-clustered layout
- entity-graph-layout.ts: pure domain layout computation, type-clustered circular positioning
- EntityGraphNodeComponent: memoized circular badge with type color, 2-letter abbreviation
- EntityRelationshipGraph: full-panel overlay, type filter pills, React Flow (separate provider)
- Click entity → opens sidebar + selects entity
- Toolbar button (Network), Ctrl+Shift+R shortcut, Escape chain integration
- 6 layout tests, 2 UI store tests, 1 keyboard shortcut test

### feat: add node tag system with context menu editor, search panel mode, and tag indicator
- updateNodeTags domain function, setNodeTags store action with history
- TagChipEditor in context menu: colored chips, add/remove tags
- Tags mode in search panel: unique tags with frequency counts, click to select matching nodes
- Tag icon indicator at bottom-left of nodes with tags
- 4 domain tests, 4 store tests

## Phase 8 — Entity System Completion & Spec Parity (2026-03-03)

### docs: add integration tests, update all docs, polish for Phase 8 completion
- 5 entity profile integration tests: portrait, relationships, custom fields, status history roundtrip, backward compat
- 6 entity interaction integration tests: chip click flow, status auto-logging, entity type summary, edge rewire, relationship navigation, multiple status auto-logs
- All docs updated (architecture, decisions-log, changelog, wip, dependencies), plan archived

### feat: add status auto-logging, TipTap Link extension, and edge rewire UI
- Status auto-logging in TipTap: diffs old/new text for status markers, calls addStatus for new tags
- nodeId prop threaded through field-editor → rich-content-editor → tiptap-editor
- @tiptap/extension-link with autolink and openOnClick
- NodeSelectorInput: searchable dropdown for graph node selection
- Edge context menu gains "Rewire" section with source/target dropdowns
- 6 new tests (status auto-logging, node selector)

### feat: add clickable entity chips, portal tooltips, and node entity type summary
- Entity chips are clickable: opens entity sidebar, selects entity
- openEntitySidebar (non-toggling) action in UI store
- Portal-based entity tooltip: name, type, description preview, last status (300ms/150ms delays)
- EntityTypeSummary sub-component on StoryNode: scans fields, renders up to 6 type icons
- 6 new tests (chip interaction, tooltip, entity type summary)

### feat: add entity profile sub-components for portrait, history, relationships, custom fields
- EntityPortrait: circular image upload/display with hover overlay and size warning
- EntityHistoryEditor: chronological status entries, add manual entry, delete
- EntityRelationshipsEditor: CRUD with entity selector, type input, navigate to target
- EntityCustomFieldsEditor: key-value editor for arbitrary custom fields
- EntityProfile restructured with collapsible sections (SectionHeader with chevron + count badge)
- 8 new tests (profile rendering, sections, toggle)

### feat: expand entity domain ops and store for full profile support
- entity-operations.ts: setEntityPortrait, addEntityRelationship, removeEntityRelationship, addEntityCustomField, removeEntityCustomField, updateEntityCustomField
- entity-store.ts: setPortrait, addRelationship, removeRelationship actions; expanded updateEntity whitelist (portrait, statusHistory, relationships, custom)
- entity-tag-parser.ts: extractEntityTypesFromNodeFields, extractStatusTagsFromText
- 38 new tests (17 domain ops, 10 parser, 11 store)

---

## Phase 7 — Subgraph Grouping, Image Attachments, PWA Icons (2026-03-03)

### docs: add integration tests, PWA icons, update all docs for Phase 7 completion
- 8 group integration tests: save/load roundtrip, subgraph export/import, clipboard, cascade delete, ungroup, move
- 5 attachment integration tests: save/load roundtrip, multiple attachments, campaign size, backward compat, custom fields
- 4 PWA icon tests: valid PNG files (not placeholders), source SVG exists
- Generated branded PWA icons from SVG source via sharp (scripts/generate-icons.mjs)
- All docs updated (architecture, decisions-log, changelog, wip, dependencies), plan archived

### feat: add attachment gallery UI for image uploads in field editors
- AttachmentGallery component below TipTap editors: thumbnail grid, drag-and-drop, file picker
- Size warning for files exceeding 2MB, remove button on each thumbnail
- Mounted in both RichContentEditor and CustomFieldEditor for all content fields
- 4 component tests for gallery rendering and interaction

### feat: add group-aware rendering, collapsed edge remapping, and group context menu
- useFlowNodes rewritten: collapsed group filtering, boundary edge remapping, internal edge hiding, deduplication
- StoryNode group rendering: dashed border ring, child count badge, collapse/expand chevron, stacked shadow layers
- Context menu: Group Selected (multi-select), Ungroup, Delete Group + Children, Collapse/Expand, Remove from Group
- Status bar shows group count
- 8 tests for useFlowNodes group-aware behavior

### feat: add group store actions and attachment domain operations
- 5 graph store group actions: createGroup, addToGroup, removeFromGroup, deleteGroup (cascade/ungroup), toggleGroupCollapsed
- Group-aware moveNode: translates all children by same delta
- attachment-operations.ts: createAttachment, validateAttachmentSize, addAttachment, removeAttachment, estimateCampaignSize
- readFileAsDataUrl utility in file-io.ts
- 10 store tests + 13 attachment domain tests

### feat: add group domain types and operations for subgraph grouping
- StoryNode gains isGroup?, groupId?, collapsed? optional fields
- group-operations.ts: 11 pure functions (create, add/remove children, collapse, delete keep/cascade, boundary/internal edges)
- graph-operations.ts: group-aware removeNodes (ungroups children), duplicateNodes (remaps groupId), pasteSubgraph (remaps groupId), extractSubgraph (auto-includes children)
- 29 group operation tests + 6 graph operation group tests

---

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
