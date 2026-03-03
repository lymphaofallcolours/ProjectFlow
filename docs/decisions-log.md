# Architecture Decision Records

<!-- Claude: Append new decisions during development. NEVER delete or edit past entries. -->

---

## 2026-03-02 — Web app with JSON file export over Electron

**Status:** Accepted
**Context:** Needed to decide deployment model: local desktop app (Electron) vs. web app vs. hybrid.
**Decision:** Web application with JSON file export/import. File System Access API for direct save where supported, download/upload fallback elsewhere.
**Alternatives rejected:** Electron (adds packaging complexity, not needed since this is single-user with no backend); cloud-hosted with DB (unnecessary complexity for single-user local-first tool).
**Consequences:** No native file system access on all browsers. Must handle the File System Access API gracefully with fallback. PWA can be added later for offline support. Electron wrapper remains a future option around the same codebase.

## 2026-03-02 — Three-tier drill-down interaction model

**Status:** Accepted
**Context:** Needed to design how users access the 11 content fields per node without cluttering the graph canvas.
**Decision:** Three-tier progressive disclosure: (1) Tree view with shaped nodes, (2) Hold/Alt+click for radial field subnodes, (3) Double-click for full cockpit overlay. All overlays render over blurred graph background.
**Alternatives rejected:** Docked side panels (too static, doesn't scale to 11 fields); tabbed editor panel (loses graph context); sidebar detail view (splits attention).
**Consequences:** Requires careful interaction mapping to avoid conflicts (single click = select, hold = subnodes, double-click = cockpit, right-click = menu). The hold gesture (~500ms) needs to be tuned for feel. Blur backdrop is GPU-intensive — test on lower-end hardware.

## 2026-03-02 — Custom entity tagging DSL with 6 types

**Status:** Accepted
**Context:** GM needs to tag PCs, NPCs, enemies, objects, locations, and secret entities in scene text with presence/mention distinction.
**Decision:** Prefix-based syntax: `@`/`#` for present/mentioned, with type prefixes `!` (NPC), `%` (enemy), `$` (object), `~` (location), `&` (secret). Status markers via `+status` suffix. Rendered as colored inline chips in TipTap.
**Alternatives rejected:** Unified `@` prefix with type selector popup (slower to type); hashtag-only system (no present/mentioned distinction); dropdown-based tagging (breaks writing flow).
**Consequences:** Regex parser in domain/ must handle all combinations. TipTap needs a custom extension for autocomplete and chip rendering. Legend/cheatsheet is essential for discoverability. The `&` prefix for secrets may conflict with HTML entities in some edge cases — parser must be robust.

## 2026-03-02 — Aeroglass aesthetic over dark industrial

**Status:** Accepted
**Context:** Needed a visual identity for the application. Initially explored a dark industrial command terminal aesthetic, but user explicitly requested polished, clean surfaces with a glass/aeroglass style.
**Decision:** Frosted translucent "aeroglass" aesthetic. CSS custom properties for glass surfaces (`--color-surface-glass`, `--color-surface-glass-border`), `backdrop-filter: blur()` on panels, luminous accent colors per scene type, top highlight reflections on node shapes, and clean sans-serif typography (DM Sans display + body, JetBrains Mono for code).
**Alternatives rejected:** Dark industrial terminal (user rejected — too harsh), Material Design (too generic), flat minimal (too plain for a creative tool).
**Consequences:** Heavy use of `backdrop-filter: blur()` which is GPU-intensive. `.glass-panel` CSS utility class used everywhere. Dark and light modes both use translucent glass — light mode uses higher backdrop saturation for richness.

## 2026-03-02 — Separate vitest.config.ts for Vite 7 compatibility

**Status:** Accepted
**Context:** Vite 7 uses TypeScript config by default. Combining Vitest config inline in `vite.config.ts` caused TypeScript errors with test-specific options.
**Decision:** Maintain a separate `vitest.config.ts` that duplicates the resolve aliases and adds test-specific options (globals, jsdom, setup files).
**Alternatives rejected:** Using `/// <reference>` directives (fragile), casting config types (loses type safety).
**Consequences:** Must keep path aliases in sync between both config files. Small maintenance overhead.

## 2026-03-02 — Radial subnodes rendered in screen space, not as graph nodes

**Status:** Accepted
**Context:** The 11 radial field subnodes that orbit a node need to be clickable and positioned relative to the node. Could either add them as React Flow nodes or render them as a screen-space overlay.
**Decision:** Screen-space overlay using `flowToScreenPosition` for coordinate conversion. RadialSubnodes component is rendered inside `ReactFlowProvider` but outside the `<ReactFlow>` component tree.
**Alternatives rejected:** Adding subnodes as React Flow nodes (pollutes the graph model, creates selection/connection confusion), CSS-only positioning (can't account for zoom).
**Consequences:** Must recalculate positions on viewport change. Positions scale with zoom via `getZoom()`. The component requires React Flow context, so it lives inside GraphCanvasInner.

## 2026-03-02 — TipTap v3.20.0 with two named Mention extensions

**Status:** Accepted
**Context:** Entity tagging in text fields requires two trigger characters (`@` for present, `#` for mentioned), each detecting the type prefix from the preceding character (`!`, `%`, `$`, `~`, `&`). Needed to choose between a single custom ProseMirror plugin or multiple Mention extension instances.
**Decision:** Two named Mention extensions (`entityPresent` with trigger `@`, `entityMentioned` with trigger `#`). Entity type detected from preceding character. Chips rendered via ReactNodeViewRenderer. Content stored as plain text via `renderText()` for backward compatibility.
**Alternatives rejected:** Single custom ProseMirror plugin (more complex, harder to maintain), post-processing raw text (loses inline rendering), separate rich text format (breaks backward compat).
**Consequences:** Each mention node stores `entityType`, `mode`, `prefix`, `status` as attributes. `renderText()` reconstructs exact raw tag text for storage. Two suggestion configs share the same autocomplete dropdown component.

## 2026-03-02 — Entity search via linear scan with capitalize-aware name parsing

**Status:** Accepted
**Context:** Entity tag regex must handle multi-word names like "Hive Primus" while stopping at regular text like "leads the charge". A non-greedy regex with `\s` lookahead stops at the first space, breaking multi-word names.
**Decision:** Capitalize-aware regex: first word accepts any case, continuation words require uppercase start after space/hyphen. Pattern: `[A-Za-z][a-zA-Z0-9']*(?:[ -][A-Z][a-zA-Z0-9']*)*`. Entity search uses linear scan over `Object.values(nodes)` which is fine for <100 entities.
**Alternatives rejected:** Greedy match (captures too much), word boundary lookahead (too brittle), trie-based indexing (premature optimization).
**Consequences:** Entity names with multi-word components must start each word with uppercase. Lowercase-only names are supported as single words. Performance is O(nodes × fields) per search — acceptable for campaign-scale data.

## 2026-03-02 — Dedicated useSessionStore for playthrough tracking

**Status:** Accepted
**Context:** Phase 3 playthrough tracking requires managing session lifecycle, node visit logs, diff overlay state, and timeline sidebar state. Could extend existing stores (graph or UI) or create a new dedicated store.
**Decision:** New `useSessionStore` Zustand store. Separate concern from graph data (node positions/edges) and UI state (overlay tier, theme). Session lifecycle (start, end, record visit) is distinct from graph mutations.
**Alternatives rejected:** Extending useGraphStore (conflates graph structure with session state), extending useUIStore (session log is not ephemeral UI state), single monolith store (violates separation of concerns).
**Consequences:** Dual-write on status mark: context menu writes to both graphStore (persistent node status) and sessionStore (session-level visit log). Campaign save/load must include session store data. assembleCampaign/hydrateCampaign/newCampaignAction all wired to session store.

## 2026-03-02 — Computed diff overlay instead of stored diff state

**Status:** Accepted
**Context:** Diff overlay needs a nodeId→status map for coloring nodes. Could pre-compute and store this map whenever visits change, or compute on-the-fly in the render.
**Decision:** Compute diff map on-the-fly via `buildDiffMap(session)` in story-node render. No stored diff state.
**Alternatives rejected:** Stored derived state (extra store updates, sync bugs), memoized selector (adds complexity for small data sets).
**Consequences:** Recomputation on every render — acceptable for <200 nodes per campaign. If performance becomes an issue, can add useMemo at component level. Keeps session store minimal.

## 2026-03-02 — React Flow native selection over custom lasso

**Status:** Accepted
**Context:** Phase 4 multi-select requires Shift+click additive selection and lasso drag for area selection. Could build custom selection logic or leverage React Flow v12's built-in selection features.
**Decision:** Use React Flow's `selectionOnDrag`, `selectionKeyCode="Shift"`, `multiSelectionKeyCode="Shift"`, `selectionMode={SelectionMode.Partial}`, and `onSelectionChange` callback. Mirror selected IDs to Zustand `Set<string>` for business logic.
**Alternatives rejected:** Custom lasso implementation (duplicates React Flow functionality, harder to maintain); framework-level selection only (can't use in business logic without mirroring).
**Consequences:** Replaced `selectedNodeId: string | null` with `selectedNodeIds: Set<string>`. All consumer files migrated. React Flow handles visual selection; Zustand handles business logic (clipboard, delete, duplicate).

## 2026-03-02 — Internal clipboard over browser Clipboard API

**Status:** Accepted
**Context:** Cut/copy/paste needs to serialize complex domain objects (nodes with 11 field types, interconnecting edges with remapped IDs).
**Decision:** Internal clipboard stored as `{ nodes: StoryNode[]; edges: StoryEdge[] }` in graph-store state. Clipboard survives selection changes. Paste creates new IDs and remaps edge references.
**Alternatives rejected:** Browser Clipboard API (inappropriate for complex domain objects, security restrictions), external file (over-engineered for single-session use).
**Consequences:** Clipboard is lost on page refresh. Cross-tab paste not supported. Clipboard content is the raw subgraph — edges only include those between selected nodes.

## 2026-03-02 — Custom history stack over zustand-temporal

**Status:** Accepted
**Context:** Undo/redo needs to snapshot graph state (nodes + edges) before each mutation. Could use zustand-temporal middleware or a custom stack.
**Decision:** Dedicated `useHistoryStore` with `past: HistorySnapshot[]` and `future: HistorySnapshot[]`. Pure data store with no imports from graph-store. Graph-store imports history-store. `popUndo(current)` and `popRedo(current)` handle the stack coordination (push current to opposite stack, pop from own stack).
**Alternatives rejected:** zustand-temporal (adds dependency, tracks all state including non-graphical fields), immutable-state snapshots via Immer patches (more complex, harder to reason about).
**Consequences:** Only nodes and edges are tracked (not viewport, selection, clipboard). MAX_HISTORY_SIZE=50 caps memory. moveNode is excluded from auto-push — canvas triggers pushHistory() on drag start. Campaign load/reset clears history.

## 2026-03-02 — Subgraph file format for cross-campaign export/import

**Status:** Accepted
**Context:** Users need to share portions of a campaign graph across different campaigns. Needed a portable file format for subgraph serialization.
**Decision:** Tagged JSON with `format: 'projectflow-subgraph'`, `version: 1`, `.pfsg.json` extension. Uses existing `extractSubgraph()` and `pasteSubgraph()` domain functions. Import creates new UUIDs and remaps edge references.
**Alternatives rejected:** Embedding in campaign file (too coupled), custom binary format (over-engineered), clipboard-only (no persistence).
**Consequences:** Subgraph files are standalone and forward-compatible via version field. Import always creates new IDs to avoid collisions. File format is simple enough to validate with a type guard.

## 2026-03-02 — File handle caching for auto-save

**Status:** Accepted
**Context:** Auto-save needs to write to the same file without showing the file picker every time. The File System Access API returns a `FileSystemFileHandle` from `showSaveFilePicker`.
**Decision:** Cache the handle at module level in `file-io.ts`. Manual save/load operations cache the handle. `saveToFileQuiet()` writes to the cached handle silently, returning boolean success. Handle cleared on `newCampaignAction()`.
**Alternatives rejected:** IndexedDB for file data (adds storage complexity), always-show-picker (defeats auto-save purpose), service worker file sync (over-engineered).
**Consequences:** Handle is lost on page refresh (acceptable for single-session tool). Auto-save only works after first manual save or load. Falls back gracefully when no handle is cached.

## 2026-03-02 — Auto-save state in UI store, not campaign store

**Status:** Accepted
**Context:** Auto-save toggle and interval are user preferences that shouldn't be persisted in the campaign JSON file.
**Decision:** `autoSaveEnabled`, `autoSaveIntervalMs`, and `autoSaveStatus` live in `useUIStore`. The `useAutoSave` hook reads these values and manages a `setInterval`.
**Alternatives rejected:** Campaign settings (persists auto-save config in the campaign file, but auto-save is a UI concern, not campaign data), localStorage (adds another persistence layer).
**Consequences:** Auto-save preferences reset on page refresh. This is intentional — auto-save should be an explicit opt-in each session.

## 2026-03-02 — Edge context menu as separate component

**Status:** Accepted
**Context:** Phase 4 stubbed `onEdgeContextMenu` as a node context menu (routing edge.id to nodeId). Phase 5 needed a proper edge-specific context menu for edge styling, labels, and deletion.
**Decision:** Separate `EdgeContextMenu` component with its own `'edge'` variant in `ContextMenuState`. Reuses `MenuItem` pattern from `context-menu.tsx`.
**Alternatives rejected:** Extending `NodeContextMenu` with edge handling (too complex, conflates node/edge concerns), inline popover on edge click (conflicts with edge selection).
**Consequences:** `ContextMenuState` is now a discriminated union: `{ type: 'node' | 'edge'; ... }`. Graph canvas dispatches to the correct component based on type.

## 2026-03-02 — Escape priority chain for keyboard shortcuts

**Status:** Accepted
**Context:** The Escape key needs to dismiss multiple overlapping UI elements in a sensible order.
**Decision:** Priority chain: overlay (cockpit/field panel) → radial subnodes → panels (search/entity/legend) → selection. First truthy dismissal consumes the event.
**Alternatives rejected:** Single Escape clears everything (too destructive), separate key per element (too many keys to remember).
**Consequences:** Users can press Escape repeatedly to progressively dismiss all UI layers. Each press handles one element.

## 2026-03-02 — Subgraph grouping deferred to Phase 6

**Status:** Accepted
**Context:** Originally deferred from Phase 4, subgraph grouping (collapsible named groups) was again deferred from Phase 5 due to scope. Phase 5 focused on production polish features (edge context menu, auto-save, codex export, subgraph import/export).
**Decision:** Defer to Phase 6. Phase 5 exit criteria (full feature set, production-quality UX) is met without grouping.
**Alternatives rejected:** Implementing in Phase 5 (too large, would delay higher-priority polish features).
**Consequences:** Phase 6 will need to add Group type to domain, group-aware rendering in story-node.tsx, group context menu items, and group-aware undo/redo. Also deferred: image/attachment support, PWA offline mode, custom field templates.

## 2026-03-03 — Templates in campaign store, not a new store

**Status:** Accepted
**Context:** Custom field templates need a home. Could create a new `useTemplateStore` or add to the existing `useCampaignStore`.
**Decision:** Add `customFieldTemplates` state and CRUD actions to `useCampaignStore`. Templates are campaign-scoped metadata. Keeps store count at 6.
**Alternatives rejected:** Separate `useTemplateStore` (adds store count, templates are inherently campaign-scoped), storing in UI store (templates are data, not UI state).
**Consequences:** Campaign store gains template CRUD. `assembleCampaign()` reads templates from campaign store. `hydrateCampaign()` calls `loadTemplates()`. Template state resets with campaign.

## 2026-03-03 — Entity highlight via React context instead of per-node search

**Status:** Accepted
**Context:** Each `StoryNodeComponent` ran `searchNodesByEntity()` independently — O(n × fields × regex) per node, O(n²) total when filter is active.
**Decision:** Single `useEntityHighlight()` hook at `GraphCanvasInner` computes matching node IDs once into a `Set<string>`. Nodes read via `useContext(HighlightContext)` + `set.has(id)` — O(1) per node.
**Alternatives rejected:** Storing highlight set in Zustand (extra store update cycle on every filter change), memoized selector per node (still O(n) per node).
**Consequences:** Removed `nodes` subscription from `StoryNodeComponent` (was only used for entity search). Highlight set recomputes when filter or nodes change. Context provider wraps ReactFlow in `GraphCanvasInner`.

## 2026-03-03 — vite-plugin-pwa over manual Workbox for service worker

**Status:** Accepted
**Context:** ProjectFlow needs offline support. Could use manual Workbox setup, a custom service worker, or vite-plugin-pwa.
**Decision:** `vite-plugin-pwa` with `registerType: 'autoUpdate'` and Workbox precaching. Since ProjectFlow has zero API calls, the service worker only precaches static assets.
**Alternatives rejected:** Manual Workbox config (more boilerplate, same result), custom service worker (reinvents precaching logic), no SW (loses offline support).
**Consequences:** Build output includes `sw.js`, `workbox-*.js`, and `manifest.webmanifest`. Auto-update refreshes SW on new deployments. No runtime caching strategy needed.

## 2026-03-03 — Subgraph grouping and image attachments deferred to Phase 7

**Status:** Accepted
**Context:** Phase 6 originally included subgraph grouping and image/attachment support, but these are large features.
**Decision:** Defer both to Phase 7. Phase 6 focuses on templates (with bug fix), performance, and PWA.
**Alternatives rejected:** Including all features in Phase 6 (too large, delays production quality).
**Consequences:** Phase 7 will add: Group type to domain, group-aware rendering, collapse/expand, and image/attachment support in TipTap.

## 2026-03-03 — Groups as isGroup flag, not new SceneType

**Status:** Accepted
**Context:** Needed to represent collapsible groups on the narrative graph. SceneType drives shape rendering via 1:1 SCENE_TYPE_CONFIG mapping (5 glass gradients, SVG paths).
**Decision:** Groups use an `isGroup?: boolean` flag on StoryNode. The sceneType is preserved for visual identity. Groups are a structural concept orthogonal to narrative classification.
**Alternatives rejected:** New `SceneType = 'group'` (would require 6th gradient, 6th shape, breaks the semantic meaning of scene types), separate GroupNode type (parallel type hierarchy adds complexity).
**Consequences:** Group nodes render using their sceneType shape but with dashed border, child count badge, and collapse/expand chevron. A group can be any scene type.

## 2026-03-03 — No React Flow parentId for groups

**Status:** Accepted
**Context:** React Flow v12 supports `parentId` on nodes for parent-child relationships, making children position-relative and clipped to parent bounds.
**Decision:** Manage groups manually. Moving a group translates all children by the same delta. Children have absolute positions.
**Alternatives rejected:** React Flow `parentId` (constrains child positions to be relative, clips to parent bounds — too constraining for flexible narrative graph layouts).
**Consequences:** `moveNode` in graph-store handles group→children translation. No RF parent bounds or clipping. Children can be positioned anywhere.

## 2026-03-03 — Collapsed groups: view-level edge remapping

**Status:** Accepted
**Context:** When a group is collapsed, its children are hidden. Edges connected to children need to be visually represented.
**Decision:** `useFlowNodes()` performs view-level transformation: hides children, remaps boundary edges to point at the group node, hides internal edges, deduplicates merged edges. Domain `StoryEdge` records are never modified.
**Alternatives rejected:** Domain-level edge mutation (complicates undo/redo, save/load), removing edges entirely (loses relationship information visually).
**Consequences:** Edge remapping is a computed view concern. The domain graph stays clean. Expanding the group instantly restores all original edges.

## 2026-03-03 — Collapsed state persisted on StoryNode

**Status:** Accepted
**Context:** Whether a group is collapsed or expanded could be stored in UI-only state (Zustand UI store) or on the domain node.
**Decision:** `collapsed?: boolean` on StoryNode, persisted in campaign JSON.
**Alternatives rejected:** UI store only (collapse state lost on save/load — GM would need to re-collapse everything when reopening a campaign).
**Consequences:** Collapse state survives save/load. The campaign file grows by ~15 bytes per group node.

## 2026-03-03 — Attachments as gallery below editor, not inline TipTap

**Status:** Accepted
**Context:** TipTap currently uses `getText()` for plain text storage. Adding inline images would require switching to JSON serialization or complex content migration.
**Decision:** Attachment gallery component renders below TipTap editor. Separate from text content. Images shown as thumbnails in a grid.
**Alternatives rejected:** Inline TipTap image nodes (requires content format migration from plain text to JSON/ProseMirror schema — a larger change best deferred to a future phase).
**Consequences:** Attachments stored in `RichContent.attachments[]` array alongside `markdown` string. No content format changes. Gallery supports drag-and-drop, file picker, and size warnings.

## 2026-03-03 — Per-file 2MB and campaign 50MB attachment size warnings

**Status:** Accepted
**Context:** Base64 data URLs for images inflate file sizes (~33% overhead). Large attachments significantly increase campaign JSON size.
**Decision:** Soft warning at 2MB per file and 50MB total campaign size. Warnings displayed inline, not hard blocks. User can still add large files.
**Alternatives rejected:** Hard size limits (annoying for users with legitimate large maps), no warnings (users may unknowingly create multi-hundred-MB save files), external file references (requires file system access patterns not suitable for local-first single-file architecture).
**Consequences:** `validateAttachmentSize()` and `estimateCampaignSize()` in domain. Warnings shown in attachment gallery UI and status bar.

## 2026-03-03 — No nested groups in Phase 7

**Status:** Accepted
**Context:** Groups could potentially contain other groups (multi-level hierarchy).
**Decision:** Phase 7 prohibits nesting. `addNodesToGroup()` throws if the target node is itself a group.
**Alternatives rejected:** Allow nesting (significantly increases complexity: recursive collapse, multi-level edge remapping, deeper DOM structures).
**Consequences:** Flat group structure. A group can only contain non-group nodes. Nesting may be added in a future phase if there's demand.

## 2026-03-03 — Portal-based entity tooltip to escape TipTap overflow

**Status:** Accepted
**Context:** Entity chips render inside TipTap's ProseMirror DOM which has `overflow: hidden`. A tooltip positioned relative to the chip gets clipped.
**Decision:** Portal-based tooltip using `createPortal(…, document.body)`. Positioned via `getBoundingClientRect()` on the chip element. 300ms hover delay before showing, 150ms delay before hiding.
**Alternatives rejected:** CSS `overflow: visible` on ProseMirror container (breaks text layout), tooltip inside ProseMirror DOM (clipped), Radix/Floating UI (adds dependency for a single component).
**Consequences:** Tooltip renders at document root, escaping all overflow constraints. Position must be recalculated on each show. Clean portal cleanup on unmount.

## 2026-03-03 — Status auto-logging via text diff in TipTap onUpdate

**Status:** Accepted
**Context:** When a user types `@Alfa+wounded` in a text field, the entity "Alfa" should automatically gain a "wounded" status entry. Needed to detect new status markers without double-logging.
**Decision:** Diff-based detection in `tiptap-editor.tsx` `onUpdate` callback. Previous text stored in a ref. On each update, extract status tags from both old and new text via `extractStatusTagsFromText()`, compute diff (new markers not in old set), call `entityStore.addStatus()` for each.
**Alternatives rejected:** MutationObserver on ProseMirror DOM (complex, fragile), post-save scanning (too late, loses context), manual button to log status (breaks writing flow).
**Consequences:** `nodeId` prop must be threaded through `field-editor.tsx → rich-content-editor.tsx → tiptap-editor.tsx` to provide context for status entries. Status is logged immediately on typing, not on save. Duplicate detection via `name:status` key set.

## 2026-03-03 — Entity profile split into sub-components with collapsible sections

**Status:** Accepted
**Context:** Entity profile was ~60 lines with only name, description, and affiliations. Adding portrait, history, relationships, and custom fields would balloon it past 200 lines.
**Decision:** Split into 4 sub-components: `EntityPortrait`, `EntityHistoryEditor`, `EntityRelationshipsEditor`, `EntityCustomFieldsEditor`. Mounted in `entity-profile.tsx` with collapsible `SectionHeader` sub-component (chevron toggle + count badge). History and relationships start expanded, custom fields start collapsed.
**Alternatives rejected:** Tabbed interface (loses overview), single monolith component (too long), separate routes/pages (overkill for a sidebar).
**Consequences:** Each sub-component is under ~80 lines. Profile renders all sections in a scrollable column. Collapsible sections manage vertical space.

## 2026-03-03 — TipTap Link extension for URL auto-linking

**Status:** Accepted
**Context:** Users paste URLs in text fields but they render as plain text. Needed clickable hyperlinks.
**Decision:** Add `@tiptap/extension-link` with `autolink: true`, `openOnClick: true`. Minimal configuration, no custom UI.
**Alternatives rejected:** Custom ProseMirror plugin for link detection (reinvents the wheel), regex-based post-processing (doesn't update DOM), no link support (poor UX).
**Consequences:** URLs in text fields are automatically detected and rendered as clickable links. Opens in new tab on click. Adds one dependency.

## 2026-03-03 — Edge rewire via dropdown in edge context menu

**Status:** Accepted
**Context:** `rewireEdge` domain function existed since Phase 4 but had no UI. Users couldn't change edge source/target without deleting and recreating edges.
**Decision:** Add "Rewire" section to `edge-context-menu.tsx` with two `NodeSelectorInput` dropdowns (source, target). `NodeSelectorInput` is a new reusable searchable dropdown component. Pre-populated with current values, excludes the other endpoint from selection.
**Alternatives rejected:** Drag-to-rewire on edge handles (conflicts with React Flow's built-in handle behavior), modal dialog (too heavy for a quick operation), inline text input for node ID (poor UX).
**Consequences:** New `NodeSelectorInput` component is reusable for any node selection need. Edge context menu grows but rewire section is toggleable (hidden by default, expanded on click).

## 2026-03-03 — Type-clustered layout over dagre for entity graph

**Status:** Accepted
**Context:** Entity relationship graph needs a layout algorithm. Options included dagre (existing in many graph projects), d3-force, or a custom layout.
**Decision:** Custom type-clustered circular layout in pure domain code. 6 cluster centers (one per EntityType), entities arranged in circles around their type's center. Zero new dependencies.
**Alternatives rejected:** dagre (adds a dependency for <50 entities), d3-force (overkill, adds weight), random layout (poor visual grouping).
**Consequences:** Simple, deterministic layout. Positions are computed from entity type membership. Performance is O(n) for n entities. The layout doesn't handle overlapping entities at high densities, but campaigns rarely exceed 50 entities.

## 2026-03-03 — Tag highlighting via selectNodes() instead of custom highlight

**Status:** Accepted
**Context:** When a user clicks a tag in the search panel, the matching nodes need visual emphasis. Could create a new highlight mechanism (like entityHighlightFilter) or reuse the existing multi-select.
**Decision:** Reuse `graphStore.selectNodes(matchingIds)`. Tag clicks select all nodes with that tag, which triggers the existing selection glow rendering. Tags and entity highlight are orthogonal.
**Alternatives rejected:** New `tagHighlightFilter` in UI store (duplicates entity highlight concept), CSS class on matching nodes (fragile, not in domain model).
**Consequences:** Tag selection and manual selection share the same visual state. Clicking a tag replaces the current selection. This is intentional — the user is explicitly choosing to focus on tagged nodes.

## 2026-03-03 — Dashboard reads all stores with useMemo, no derived state

**Status:** Accepted
**Context:** Campaign dashboard shows entity counts, node counts, top connected entities, top tagged nodes. Could pre-compute and store these, or compute on render.
**Decision:** Compute everything on render, wrapped in `useMemo`. Entity count is O(entities), node count is O(nodes), top connected is O(entities²) for incoming relationship scan.
**Alternatives rejected:** Zustand derived state (adds complexity, sync bugs), separate dashboard store (unnecessary layer).
**Consequences:** Dashboard recomputes on store changes. For campaign-scale data (50 entities, 100 nodes), this is instant. If campaigns grow 10x, `computeIncomingRelationships` could become a bottleneck — add memoization then.

## 2026-03-03 — Second ReactFlowProvider for entity graph

**Status:** Accepted
**Context:** Entity relationship graph is a separate graph visualization alongside the main narrative graph. React Flow requires a ReactFlowProvider for each instance.
**Decision:** Entity graph wraps its own `<ReactFlowProvider>` inside the panel component. Completely independent from the main graph's provider in GraphCanvas.
**Alternatives rejected:** Sharing a single provider (would conflict with main graph state), using a non-React-Flow library like vis.js (adds a dependency for a simple graph).
**Consequences:** Two React Flow instances can coexist. Entity graph has its own zoom, pan, and node types. Module-level `nodeTypes` constant defined in the panel file (not in the node component, per lint rules).

## 2026-03-03 — Incoming relationships computed on demand, not stored

**Status:** Accepted
**Context:** Entity profile needs to show "Referenced By" — entities that have relationships pointing TO the current entity. Could store bidirectional references or compute on demand.
**Decision:** `computeIncomingRelationships(entities, targetId)` scans all entities for relationships with `targetEntityId === targetId`. Pure function, O(n) per entity.
**Alternatives rejected:** Storing inverse relationships (doubles the data, sync bugs on add/remove), computed property on Entity (domain type would need framework awareness).
**Consequences:** Incoming relationships are always fresh. No sync issues. For 50 entities with ~5 relationships each, scan is ~250 comparisons — negligible.

## 2026-03-03 — Drag position overlay instead of local node state for smooth dragging

**Status:** Accepted
**Context:** React Flow in controlled mode needs position changes applied back to the nodes array during drag for smooth visual updates. The previous implementation only called `moveNode()` on drag-end, causing teleporting. A local `useState` + `useEffect` sync pattern was rejected by the linter (no setState in effects, no ref access during render).
**Decision:** Maintain `dragPositions: Record<string, Position>` as state. During drag, update this map. Derive `displayNodes` via `useMemo` by merging store nodes with drag overrides. On drag-end, clear overrides and persist to Zustand.
**Alternatives rejected:** `useState` + `useEffect` sync (lint: no setState in effects), render-phase ref access (lint: no ref.current in render), React Flow `useNodesState` (loses Zustand as source of truth).
**Consequences:** Position overrides are only in state during drag. Between drags, `displayNodes === storeNodes` (zero overhead). The `isDraggingRef` is only accessed in callbacks (lint-safe).

## 2026-03-03 — Centroid-relative transposition for layout direction switching

**Status:** Accepted
**Context:** Toggling between horizontal and vertical scroll direction only changed handle anchor positions. Nodes kept their old positions, resulting in mismatched layouts.
**Decision:** `transposeNodePositions()` pure function swaps `(x - cx, y - cy)` → `(y - cy, x - cx)` relative to the graph centroid. Called from `setScrollDirection` in graph-store. History is pushed before transposing.
**Alternatives rejected:** Full dagre re-layout (adds dependency, destroys manual arrangements), keep positions unchanged (user must manually reposition everything).
**Consequences:** Double transpose restores original positions. Single-node graphs are fixed points. Undo restores pre-transpose state.

## 2026-03-03 — Single-tone flat node fills replacing glass gradients

**Status:** Accepted
**Context:** In light mode, the glass gradient (`surface-glass` → accent at 0.08 opacity) made nodes nearly invisible against the light canvas. User requested "no colour gradient, but rather a single tone, even if translucid."
**Decision:** Replace `fill={url(#glass-gradient)}` with inline `color-mix(in srgb, accentColor 25%, var(--color-node-fill-base))`. `--color-node-fill-base` is `rgba(255,255,255,0.72)` in light mode, `rgba(30,40,55,0.70)` in dark. SVG gradient definitions removed.
**Alternatives rejected:** Increasing gradient opacity (still a gradient, user explicitly wanted flat), solid opaque fills (loses glass aesthetic).
**Consequences:** Nodes are visibly tinted per scene type. Glass reflection sheen overlay remains for subtle depth. Each node's fill is a computed CSS color, not an SVG gradient reference.

## 2026-03-03 — Native DOM events for useLongPress to avoid React Flow conflicts

**Status:** Accepted
**Context:** The `useLongPress` hook used React synthetic event handlers (`onMouseDown`, `onMouseUp`, `onMouseLeave`) spread onto the node's root div. This interfered with React Flow's internal event chain for node selection, requiring two clicks to select a node.
**Decision:** Rewrite `useLongPress` to return a `React.RefCallback<HTMLElement>` that attaches native DOM `pointerdown`/`pointerup`/`pointerleave` event listeners. Native listeners fire alongside React Flow's handlers without interfering.
**Alternatives rejected:** Moving handlers to an inner div (breaks long-press on full node area), using `useEffect` + ref (extra lifecycle management), `capture: true` phase listeners (too invasive).
**Consequences:** Hook API changed from returning a spread object to returning a ref callback. `story-node.tsx` uses `ref={longPressRef}` instead of `{...longPressHandlers}`. Native events don't interfere with React Flow's click/selection handling.

## 2026-03-03 — Shift replaces Alt for subnode trigger, Control for multi-select

**Status:** Accepted
**Context:** Alt key is captured by Firefox for toggling the menu bar, making Alt+Click unreliable for subnode triggers. Shift was previously used for multi-select (`selectionKeyCode`, `multiSelectionKeyCode`).
**Decision:** Shift for subnode triggers (Shift+Click, Shift key alone with selected node, long press). Control for multi-select. `selectionKeyCode={null}` (lasso via `selectionOnDrag` only).
**Alternatives rejected:** Meta key for multi-select (unreliable on Linux/Windows), keeping Alt (broken in Firefox), separate modifier for lasso vs additive select (too many keys).
**Consequences:** Shift+Click on a node opens subnodes instead of adding to selection. Ctrl+Click adds to selection. `selectionOnDrag` provides lasso without needing a key. Keyboard shortcut handler also responds to lone Shift press when a single node is selected.

## 2026-03-03 — onNodesChange handles select changes for controlled React Flow

**Status:** Accepted
**Context:** React Flow v12 in controlled mode requires `onNodesChange` to process `select` type changes. Without this, the `selected` CSS class isn't applied to nodes even though `onSelectionChange` updates the Zustand store.
**Decision:** Handle `select` changes in `onNodesChange` by building the new selection set from the current Zustand state plus the incoming changes, then calling `selectNodes()`. Keep `onSelectionChange` as a secondary sync mechanism.
**Alternatives rejected:** Relying solely on `onSelectionChange` (race condition with controlled mode reconciliation), using `applyNodeChanges` (doesn't fit our hybrid Zustand/React Flow model).
**Consequences:** Node selection works reliably on first click. Both `onNodesChange` and `onSelectionChange` can fire — they produce the same result so no conflict.

## 2026-03-03 — Deferred drag position clear via requestAnimationFrame

**Status:** Accepted
**Context:** When a node drag ends, `setDragPositions({})` (React state) and `moveNode()` (Zustand) may not batch together. There's a frame where `dragPositions` is cleared but `storeNodes` hasn't updated yet, causing nodes to flash at their old position.
**Decision:** Defer `setDragPositions({})` via `requestAnimationFrame` so the Zustand update renders first. Belt-and-suspenders: `displayNodes` memo skips drag overrides when the store position already matches.
**Alternatives rejected:** Using `flushSync` (heavy, blocks), setTimeout (imprecise), merging both states into one store (loses separation).
**Consequences:** Zero blink on drag end. The extra frame of drag overlay is invisible since the store has already committed the new position.

## 2026-03-03 — CSS custom property --accent-mix for theme-aware node fills

**Status:** Accepted
**Context:** Light mode needed stronger accent tinting on nodes (40%) while dark mode should stay subtle (25%). A single hardcoded percentage doesn't work for both.
**Decision:** CSS variable `--accent-mix` set to `40%` in light theme, `25%` in dark theme. Used in `color-mix(in srgb, accentColor var(--accent-mix), var(--color-node-fill-base))`.
**Alternatives rejected:** Separate nodeFillColor per theme (requires JS theme detection in component), two hardcoded values with theme check (more complex than CSS variable).
**Consequences:** Theme-aware accent mixing with zero JS overhead. CSS does the work. Adding new themes only requires setting `--accent-mix`.

---

<!-- Entries above — newest first -->
