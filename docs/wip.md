# Work In Progress

<!-- Claude: Read this file at session start. Update it at session end. -->

## Current Session

**Date:** 2026-03-03
**Goal:** Phase 9 — Campaign Intelligence & Navigation (complete)

### Completed This Session

- **Commit 1:** Node tag system — updateNodeTags domain op, setNodeTags store action with undo, TagChipEditor in context menu (colored chips, add/remove), Tags mode in search panel (frequency counts, click-to-select), Tag icon indicator on story nodes. Fix pre-existing TS error in use-flow-nodes.ts. 8 new tests.
- **Commit 2:** Entity relationship graph — entity-graph-layout.ts pure domain layout (type-clustered circles, zero deps), EntityGraphNodeComponent (circular badge), EntityRelationshipGraph panel (ReactFlowProvider, type filter pills, click-to-navigate), toolbar button, Ctrl+Shift+R shortcut, Escape chain. 9 new tests.
- **Commit 3:** Incoming relationships + campaign dashboard — computeIncomingRelationships domain function, "Referenced By" in entity relationships editor, CampaignDashboard panel (entity/node counts, graph stats, session stats, top 5 connected, top 5 tagged), toolbar button, Escape chain. 10 new tests.
- **Commit 4:** Integration tests + docs — 11 integration tests (tag system, entity graph, dashboard), all docs updated (architecture, decisions-log, changelog, wip), plan archived.

### Test Coverage

- ~690 tests total across 45 test files
- Domain: ~227 (65 parser + 34 entity ops + 21 search + 61 graph ops + 33 playthrough ops + 3 history ops + 13 subgraph ops + 12 template ops + 29 group ops + 13 attachment ops + 6 entity graph layout)
- Application: ~190 (77 graph store + 34 entity store + 22 session store + 16 history store + 29 UI store + 8 campaign store)
- Infrastructure: 13 (serialization)
- UI: 66 (12 entity chip + 18 keyboard shortcuts + 5 entity highlight + 8 useFlowNodes + 4 attachment gallery + 8 entity profile + 6 entity chip interaction + 4 status auto-logging + 2 node selector + 1 app)
- Integration: ~104 (10 campaign roundtrip + 3 entity roundtrip + 6 entity search + 8 overlay state + 8 playthrough roundtrip + 4 session timeline + 20 graph operations + 3 PWA build + 5 performance + 8 group operations + 5 attachment roundtrip + 4 PWA icons + 5 entity profile roundtrip + 6 entity interaction + 4 tag system + 3 entity graph + 4 dashboard)

### Blocked / Needs Attention

- (none)

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
