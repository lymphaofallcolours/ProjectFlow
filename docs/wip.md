# Work In Progress

<!-- Claude: Read this file at session start. Update it at session end. -->

## Current Session

**Date:** 2026-03-11
**Goal:** Peripheral view — floating glass panels for at-a-glance field reading

### Completed This Session

- **Peripheral view feature** — new toggleable mode (Ctrl+Shift+P / toolbar button) that displays populated node fields as floating glass panels around screen edges
- **Smart auto-layout algorithm** — `peripheral-layout.ts` in domain/; distributes fields across 1–4 edges based on count with field-type affinity mapping
- **Read-first, click-to-edit** — `field-read-view.tsx` renders content read-only; pencil button switches to full FieldEditor in-place
- **Styled read views** — dialogue entries with entity ref badges, dice rolls as inline chips, soundtrack with bullet indicators, custom fields with labeled sections
- **Cross-fade animation** — staggered card entrance per edge, CSS `peripheral-card-slide` keyframe
- **Integration** — toolbar button, Ctrl+Shift+P shortcut, Escape chain (exits edit mode first), sidebar collision suppression, overlay suppression
- **15 new domain tests** — layout threshold, affinity, fallback, suppression, ordering

### Test Coverage

- ~781 tests across 50 test files
- Domain: ~288 (added 15 peripheral layout tests)
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

### Phase 14 — Layout Submenu, Group Indicators, Toolbar Dividers, Collapse/Expand Fix (2026-03-09)
- 1 commit (v1.4.0)
- Layout accordion submenu, group child indicators, toolbar dividers, collapse/expand position fix, re-arrange option, 4 new tests (766 total)

### Phase 13 — Auto-arrange, Snap-to-grid, Align/Distribute, Animated Transitions (2026-03-09)
- 1 commit (v1.3.0)
- dagre-based auto-arrange, 6 alignment + 2 distribute directions, snap-to-grid, animated CSS transitions, confirm dialog, Ctrl+Shift+L shortcut, 15 new tests (763 total)

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
