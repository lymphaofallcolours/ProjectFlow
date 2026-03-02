# Changelog

<!-- Claude: Update this file with each commit via conventional commit format. -->

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
