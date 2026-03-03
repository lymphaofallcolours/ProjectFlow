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

---

<!-- Entries above — newest first -->
