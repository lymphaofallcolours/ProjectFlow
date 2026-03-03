# Work In Progress

<!-- Claude: Read this file at session start. Update it at session end. -->

## Current Session

**Date:** 2026-03-03
**Goal:** Phase 7 — Subgraph Grouping, Image Attachments, PWA Icons (complete)

### Completed This Session

- **Commit 1:** Group domain types + operations — `isGroup?`, `groupId?`, `collapsed?` on StoryNode, `group-operations.ts` with 11 pure functions, group-aware `removeNodes`, `duplicateNodes`, `pasteSubgraph`, `extractSubgraph`. 35 new tests.
- **Commit 2:** Group store actions + attachment domain — 5 store actions (createGroup, addToGroup, removeFromGroup, deleteGroup, toggleGroupCollapsed), group-aware moveNode, `attachment-operations.ts`, `readFileAsDataUrl`. 23 new tests.
- **Commit 3:** Group-aware rendering + context menu — `useFlowNodes` rewrite with collapsed group filtering/edge remapping, group-specific `story-node.tsx` rendering (dashed border, child count, collapse/expand chevron, stacked shadow), context menu group operations, status bar group count. 8 new tests.
- **Commit 4:** Attachment gallery UI — `attachment-gallery.tsx` with thumbnail grid, drag-and-drop, file picker, size warnings. Mounted in RichContentEditor and CustomFieldEditor. 4 new tests.
- **Commit 5:** PWA icons + integration tests + docs — branded icon generation from SVG via sharp, 8 group integration tests, 5 attachment integration tests, 4 PWA icon tests, all docs updated, plan archived.

### Test Coverage

- ~587 tests total across 35 test files
- Domain: ~207 (65 parser + 30 entity ops + 21 search + 57 graph ops + 33 playthrough ops + 3 history ops + 13 subgraph ops + 12 template ops + 29 group ops + 13 attachment ops)
- Application: ~169 (73 graph store + 23 entity store + 22 session store + 16 history store + 25 UI store + 8 campaign store)
- Infrastructure: 13 (serialization)
- UI: 47 (12 entity chip + 17 keyboard shortcuts + 5 entity highlight + 8 useFlowNodes + 4 attachment gallery + 1 app)
- Integration: ~82 (10 campaign roundtrip + 3 entity roundtrip + 6 entity search + 8 overlay state + 8 playthrough roundtrip + 4 session timeline + 20 graph operations + 3 PWA build + 5 performance + 8 group operations + 5 attachment roundtrip + 4 PWA icons)

### Blocked / Needs Attention

- (none)

### Next Steps (Phase 8)

1. **Inline TipTap image nodes** — content format migration from plain text to JSON/ProseMirror schema for inline image support
2. **Nested groups** — groups containing groups (multi-level hierarchy, recursive collapse)
3. **Entity portrait attachments** — avatar/portrait images on Entity profiles
4. **External file references** — avoid base64 bloat for very large assets

### TODOs in Code

- (none — no TODOs or FIXMEs in codebase)

---

## Previous Sessions

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
