# Work In Progress

<!-- Claude: Read this file at session start. Update it at session end. -->

## Current Session

**Date:** 2026-03-03
**Goal:** Phase 8 — Entity System Completion & Spec Parity (complete)

### Completed This Session

- **Commit 1:** Entity domain ops + store enrichment — 6 new pure functions in entity-operations.ts (portrait, relationships, custom fields), expanded updateEntity whitelist, extractEntityTypesFromNodeFields + extractStatusTagsFromText in parser, setPortrait/addRelationship/removeRelationship store actions. 38 new tests.
- **Commit 2:** Entity profile sub-components — EntityPortrait (circular upload/display), EntityHistoryEditor (chronological list + add/remove), EntityRelationshipsEditor (CRUD + navigation), EntityCustomFieldsEditor (key-value editor). entity-profile.tsx restructured with collapsible SectionHeader. 8 new tests.
- **Commit 3:** Clickable chips + tooltips + entity type summary — entity-chip-node-view.tsx gets onClick (opens sidebar + selects entity) and hover tooltip trigger, portal-based EntityTooltip, EntityTypeSummary on StoryNode (scans fields, renders type icons), openEntitySidebar (non-toggling) in UI store. 6 new tests.
- **Commit 4:** Status auto-logging + TipTap Link + edge rewire UI — tiptap-editor.tsx gains Link extension + status auto-logging diff logic + nodeId prop threading, NodeSelectorInput searchable dropdown, edge-context-menu.tsx gains rewire section with source/target dropdowns. 6 new tests.
- **Commit 5:** Integration tests + docs — 5 entity profile roundtrip tests, 6 entity interaction tests, all docs updated (architecture, decisions-log, changelog, wip, dependencies), plan archived.

### Test Coverage

- ~656 tests total across 41 test files
- Domain: ~217 (65 parser + 30 entity ops + 21 search + 57 graph ops + 33 playthrough ops + 3 history ops + 13 subgraph ops + 12 template ops + 29 group ops + 13 attachment ops + 17 entity profile ops + 10 parser extraction)
- Application: ~180 (73 graph store + 34 entity store + 22 session store + 16 history store + 25 UI store + 8 campaign store)
- Infrastructure: 13 (serialization)
- UI: 65 (12 entity chip + 17 keyboard shortcuts + 5 entity highlight + 8 useFlowNodes + 4 attachment gallery + 8 entity profile + 6 entity chip interaction + 4 status auto-logging + 2 node selector + 1 app)
- Integration: ~93 (10 campaign roundtrip + 3 entity roundtrip + 6 entity search + 8 overlay state + 8 playthrough roundtrip + 4 session timeline + 20 graph operations + 3 PWA build + 5 performance + 8 group operations + 5 attachment roundtrip + 4 PWA icons + 5 entity profile roundtrip + 6 entity interaction)

### Blocked / Needs Attention

- (none)

### Next Steps (Phase 9)

1. **Inline TipTap image nodes** — content format migration from plain text to JSON/ProseMirror schema for inline image support
2. **Nested groups** — groups containing groups (multi-level hierarchy, recursive collapse)
3. **External file references** — avoid base64 bloat for very large assets
4. **Bulk entity import/export** — CSV or markdown
5. **Entity graph visualization** — relationship web view

### TODOs in Code

- (none — no TODOs or FIXMEs in codebase)

---

## Previous Sessions

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
