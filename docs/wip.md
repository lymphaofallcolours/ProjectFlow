# Work In Progress

<!-- Claude: Read this file at session start. Update it at session end. -->

## Current Session

**Date:** 2026-03-04
**Goal:** Fix scene-type picker dismiss and panel overlap

### Completed This Session

- **Fix 16: Scene-type picker Escape dismiss** — added capture-phase keydown listener for Escape in SceneTypePicker; stopPropagation prevents global handler from also firing
- **Fix 17: Panel mutual exclusivity** — all 7 side panels (Search, Templates, Structures, Dashboard, Entities, Help, Relationships) now close when another opens; `closedPanels` constant in ui-store resets all booleans; each toggle spreads it when opening
- **GPL-3.0 license** — added LICENSE file via GitHub API
- **README rewrite** — replaced Vite boilerplate with full project docs (features, setup, architecture, entity tags, testing, save format)
- **CLAUDE.md update** — added README + LICENSE to documentation map, added README maintenance rule to "During Development"

### Previous Session (2026-03-03)

- **Previous batch:** dot visibility, subnode dismiss/opacity, help panel (4 fixes)
- **Fix 5: Subnode crash (white screen)** — eliminated stale `radialNodeId` closures in `onSelectionChange` and `onNodeClick` (now read fresh via `useUIStore.getState()`); added `radialNodeExists` render guard; added `radialNodeId` cleanup to `deleteNode`, `deleteSelectedNodes`, and `deleteGroup` in graph-store
- **Fix 6: Long-press on unselected nodes** — `handleLongPress` in story-node now calls `selectNodes([id])` before `showRadialSubnodes`, so a single long-press selects AND shows subnodes
- **Fix 7: Context menu Escape dismiss** — added `useEscapeKey(onClose)` to `NodeContextMenu` and `EdgeContextMenu` (canvas already had it, refactored to use shared hook)
- **Fix 8: Context menu viewport overflow** — new `useMenuPosition` hook uses `useLayoutEffect` to measure menu dimensions and reposition upward/leftward when overflowing viewport bounds; applied to all 3 context menus
- **Fix 9: Right-pointing combat triangle** — rotated triangle from upward to right-pointing (`M 4,4 L 140,62 L 4,120 Z`), wide left edge gives more text room; handle insets for all 4 directions; label padding shifted left toward centroid
- **Fix 10: Playthrough notes visibility** — status dot tooltip now includes `playthroughNotes`; added `CockpitPlaythroughPanel` to cockpit overlay showing status + notes when set
- **Fix 11: Light mode contrast** — adjusted 6 CSS variables (glass opacity, border tint, canvas, text-muted, node fill); replaced 5 hardcoded `hover:bg-white/*` classes in cockpit with `hover:bg-surface-glass`
- **Fix 12: Subnode drag dismiss** — subnodes now dismiss when the user starts dragging their target node (checked in `onNodesChange` drag-start transition)
- **Fix 13: Subnode spacing & contrast** — orbit radius 72→110, subnode size 40→36, border 1.5→2px, empty border uses `--color-border` instead of glass-border, stronger drop shadows
- **Fix 14: Subnode scroll/zoom dismiss** — added `onMoveStart` handler to ReactFlow that dismisses subnodes on any pan/zoom (scroll, pinch, drag-pan)
- **Fix 15: Playthrough requires active session** — disabled playthrough status options in context menu when no session is active; shows "Start a session to track playthrough" hint instead. Prevents desync between node status and session log.

### Test Coverage

- ~706 unit/integration tests across 46 test files
- 25 E2E tests (Chromium + Firefox) across 6 test suites
- Domain: ~232 + 3 node shapes = ~235
- Application: ~193 + 2 UI store = ~195
- Infrastructure: 13 (serialization)
- UI: 66 (unchanged)
- Integration: ~104 (unchanged)
- E2E: 25 (node-selection 3, canvas-interaction 3, campaign-name 2, subnode-trigger 3, node-drag 1, cockpit-modes 1 × 2 browsers)

### Blocked / Needs Attention

- Firefox Playwright Ctrl+Click test skipped — React Flow pane intercepts pointer events in Firefox's Playwright driver; works fine in manual testing

### Next Steps (Phase 10)

1. **Inline TipTap image nodes** — content format migration from plain text to JSON/ProseMirror schema
2. **Nested groups** — groups containing groups (multi-level hierarchy, recursive collapse)
3. **External file references** — avoid base64 bloat for very large assets
4. **Bulk entity import/export** — CSV or markdown
5. **Advanced tag features** — tag auto-suggest, tag hierarchies, tag-based graph coloring

### TODOs in Code

- (none — no TODOs or FIXMEs in codebase)

---

## Previous Sessions

### Phase 8 — Entity System Completion & Spec Parity (2026-03-03)
- 5 commits, 656 tests
- Entity domain ops + store, entity profile sub-components, clickable chips + tooltips, status auto-logging, edge rewire UI

### Phase 7 — Subgraph Grouping, Image Attachments, PWA Icons (2026-03-03)
- 5 commits, 587 tests
- Group domain types + operations, group-aware rendering + context menu, attachment gallery, PWA icons

### Phase 6 — Custom Field Templates, Performance, PWA (2026-03-03)
- 5 commits, 500 tests
- Template operations, template manager UI, shared SVG defs, entity highlight context, PWA offline mode

### Phase 5 — Polish & Power Features (2026-03-02)
- 6 commits, 462 tests
- Edge context menu, keyboard shortcuts, auto-save, entity codex export, subgraph import/export

### Phase 4 — Advanced Graph Operations (2026-03-02)
- 6 commits, 417 tests
- Multi-select, clipboard, edge styling, arc labels, node rewiring, undo/redo

### Phase 3 — Playthrough Tracking & Diff (2026-03-02)
- 6 commits, 324 tests
- Session store, playthrough status marking, diff overlay, session timeline, markdown export

### Phase 2 — Entity System (2026-03-02)
- 7 commits, 248 tests
- Entity tagging DSL, TipTap autocomplete, entity registry UI, search, graph highlighting

### Phase 1 — Foundation MVP (2026-03-02)
- 10 commits, 83 tests
- Graph editor with custom node shapes, three-tier drill-down, save/load, theming
