# Work In Progress

<!-- Claude: Read this file at session start. Update it at session end. -->

## Current Session

**Date:** 2026-03-02
**Goal:** Phase 5 — Polish & Power Features (complete)

### Completed This Session

- **Commit 1:** Edge context menu + arc label in node context menu — EdgeContextMenu component, fixed Phase 4 stub, EdgeLabelInput, arc label section. 4 new tests.
- **Commit 2:** Keyboard shortcuts expansion — Ctrl+S (save), Ctrl+A (select all), Escape priority chain. 6 new tests.
- **Commit 3:** Auto-save with file handle caching — file handle caching in file-io.ts, useAutoSave hook, auto-save state in ui-store, toolbar toggle, status bar indicator. 5 new tests.
- **Commit 4:** Entity codex export — exportEntityRegistryAsMarkdown(), entity sidebar Export Codex button. 8 new tests.
- **Commit 5:** Subgraph export/import — SubgraphFile format (.pfsg.json), serialize/deserialize/validate, importSubgraph store action, toolbar Import button, context menu Export Subgraph. 16 new tests.
- **Commit 6:** Integration tests, docs, polish — 5 integration tests, all docs updated, plan archived.

### Test Coverage

- 462 tests total across 23 test files
- Domain: 182 (65 parser + 30 entity ops + 21 search + 51 graph ops + 33 playthrough ops + 3 history ops + 13 subgraph ops - wait, correcting...summing files)
- Application: 147 (63 graph store + 23 entity store + 22 session store + 16 history store + 23 UI store)
- Infrastructure: 13 (serialization)
- UI: 30 (12 entity chip + 17 keyboard shortcuts + 1 app)
- Integration: 54 (7 campaign roundtrip + 3 entity roundtrip + 6 entity search + 8 overlay state + 8 playthrough roundtrip + 4 session timeline + 20 graph operations)

### Blocked / Needs Attention

- (none)

### Next Steps (Phase 6)

1. **Subgraph grouping** — collapsible named groups, parent-child relationships, group-aware rendering
2. **Image/attachment support** — file attachments on nodes, size warnings for base64
3. **PWA offline mode** — service worker, offline-first cache strategy
4. **Custom field templates** — user-defined field configurations per campaign

### TODOs in Code

- (none — no TODOs or FIXMEs in codebase)

---

## Previous Sessions

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
