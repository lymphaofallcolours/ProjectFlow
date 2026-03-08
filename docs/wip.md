# Work In Progress

<!-- Claude: Read this file at session start. Update it at session end. -->

## Current Session

**Date:** 2026-03-08
**Goal:** Nested groups, group/divider shapes, depth visualization

### Completed This Session

- **Nested groups** — removed nesting restriction from `addNodesToGroup`; added `isAncestorOf` cycle guard, `getAllDescendants` (BFS), `getGroupDepth`; updated all group operations to be recursive (delete, boundary edges, internal edges, move)
- **Group-rect shape** — new 160×80 rounded rectangle SVG path for collapsed groups; double-border rendering (outer 2px, inner scaled inward)
- **Ghost expanded groups** — expanded groups render at 15% opacity with faint dashed stroke
- **Depth visualization** — stacked shadows scaled by depth (capped at 5 layers) + circled numeric depth badge in top-left
- **Divider nodes** — new `divider` SceneType with `banner` shape (200×50 ribbon with tapered ends); `dividerMagnitude` field (1/2/3) for Scene Break / Session Break / Arc Break
- **Group color** — dedicated cyan accent (`--color-node-group`) overrides sceneType color for all group nodes
- **Divider color** — neutral silver/gray (`--color-node-divider`)
- **Recursive collapse** — ancestor-wins rule in `useFlowNodes`; collapsing parent hides all descendants without mutating child `collapsed` state
- **Context menu updates** — nested group support (groups can be grouped), divider magnitude submenu, removed `!isGroup` guards
- **Scene-type picker** — added divider entry with visual separator
- **13 new domain tests** — `isAncestorOf`, `getAllDescendants`, `getGroupDepth`, cycle detection, re-parenting, recursive cascade delete
- **2 new shape tests** — banner handle insets, group-rect empty insets
- **Fix: group duplication** — `duplicateNode` now auto-includes all descendants and internal edges for group nodes
- **Fix: extractSubgraph** — copy/paste of nested groups now includes all descendants recursively
- **Fix: divider icon** — replaced Unicode `▬` with inline SVG banner in all 3 menus (picker, node context, canvas context)
- **Fix: divider delete crash** — context menu guards against deleted node during re-render
- **Fix: depth badge** — shows total nesting depth (ancestor + descendant) via new `getMaxDescendantDepth`; outermost groups now display contained depth
- **Fix: arc label on dividers** — removed `!isDivider` guard so divider nodes display arc labels
- **9 new tests** — `getMaxDescendantDepth` (4), group duplication with children (2+1), divider magnitude (2), nested extractSubgraph (1)

### Test Coverage

- ~744 tests across 47 test files
- Domain: ~254 (added 5 getMaxDescendantDepth + extractSubgraph tests)
- Application: ~200 (added 5 group duplication + divider magnitude tests)
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
