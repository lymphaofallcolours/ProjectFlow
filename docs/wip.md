# Work In Progress

<!-- Claude: Read this file at session start. Update it at session end. -->

## Current Session

**Date:** 2026-03-09
**Goal:** Auto-arrange, snap-to-grid, align/distribute, animated transitions

### Completed This Session

- **Auto-arrange** — dagre-based layout algorithm in `domain/graph-layout.ts`; group-aware (collapsed → single node), selection-aware, respects scroll direction (LR/TB)
- **Align/distribute** — `domain/align-distribute.ts` with 6 alignment directions + 2 distribute directions; dimension-aware via NODE_DIMENSIONS
- **NODE_DIMENSIONS extraction** — moved from `ui/graph/node-shapes.ts` to `domain/node-dimensions.ts` for clean layer boundaries; re-exported from original location
- **Store actions** — `autoArrange`, `alignSelected`, `distributeSelected` in graph-store; `snapToGrid`, `isLayoutAnimating`, `startLayoutAnimation` in ui-store
- **Multi-select context menu** — Layout section with Auto-Arrange, Align (6 options), Distribute (2 options, shown if 3+ selected)
- **Canvas context menu** — "Auto-Arrange All" with confirmation dialog
- **Confirm dialog** — reusable glass-panel modal at `ui/components/confirm-dialog.tsx`
- **Snap-to-grid** — 40px grid, toggleable via toolbar Magnet button; background gap syncs to 40px when active
- **Animated transitions** — CSS transition on `.react-flow__node` gated by `.layout-animating` class; 300ms cubic-bezier; cleared on drag start
- **Keyboard shortcut** — Ctrl+Shift+L for auto-arrange (selected or all)
- **15 new tests** — 7 graph-layout (chain, TB, selection, collapsed groups, disconnected, empty, shapes), 8 align-distribute (left/right/center/top, distribute H/V, edge cases)

### Test Coverage

- ~763 tests across 49 test files
- Domain: ~269 (added 15 layout + align/distribute tests)
- Application: ~200
- Infrastructure: 13
- UI: 66
- Integration: ~104
- E2E: 25

### Blocked / Needs Attention

- Firefox Playwright Ctrl+Click test skipped — React Flow pane intercepts pointer events in Firefox's Playwright driver; works fine in manual testing

### Next Steps

1. **Inline TipTap image nodes** — content format migration from plain text to JSON/ProseMirror schema
2. **External file references** — avoid base64 bloat for very large assets
3. **Bulk entity import/export** — CSV or markdown
4. **Advanced tag features** — tag auto-suggest, tag hierarchies, tag-based graph coloring

### TODOs in Code

- (none — no TODOs or FIXMEs in codebase)

---

## Previous Sessions

### Phase 11 — Nested Groups, Group/Divider Shapes, Depth Visualization (2026-03-08)
- 3 commits
- Nested groups (unlimited depth), group-rect shape, ghost expanded groups, depth badges, divider nodes (banner shape, magnitude), recursive collapse, 24 new tests (744 total)

### Phase 10 — Fixes, License, README (2026-03-04)
- 2 commits
- Scene-type picker Escape dismiss, panel mutual exclusivity, GPL-3.0 license, README rewrite

### Phase 9 — Bug Fixes & Polish (2026-03-03)
- Fixes 5-15: subnode crash, long-press, context menu dismiss/overflow, right-pointing triangle, playthrough notes, light mode contrast, subnode drag/scroll dismiss, subnode spacing, playthrough session guard

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
