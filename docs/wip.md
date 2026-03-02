# Work In Progress

<!-- Claude: Read this file at session start. Update it at session end. -->

## Current Session

**Date:** 2026-03-02
**Goal:** Phase 3 — Playthrough Tracking & Diff (complete)

### Completed This Session

- **Commit 1:** Playthrough domain operations — pure functions for session CRUD, node visit tracking, diff map computation, markdown export. 33 new tests.
- **Commit 2:** Session store & campaign integration — useSessionStore Zustand store, graph store playthrough mutations, campaign assemble/hydrate/reset wired, serialization validates playthroughLog. 29 new tests.
- **Commit 3:** Context menu playthrough status — "Playthrough" section with status icons, inline notes input for "modified", dual write to graph store + session store.
- **Commit 4:** Diff overlay + session selector — toolbar session dropdown, diff toggle, story node colored ring/glow + status dot, status bar session info.
- **Commit 5:** Session timeline sidebar + markdown export — right slide-out panel with chronological visits, editable label, export button, Ctrl+T/Ctrl+D shortcuts. 2 new tests.
- **Commit 6:** Integration tests, docs, polish — 12 integration tests (playthrough roundtrip + session timeline), all docs updated, plan archived.

### Test Coverage

- 324 tests total: 141 domain (65 parser + 22 entity ops + 21 search + 33 playthrough ops), 87 application (23 graph store + 23 entity store + 22 session store + 18 UI store + 1 app), 13 serialization, 12 entity chip, 5 keyboard shortcuts, 36 integration (7 campaign roundtrip + 3 entity roundtrip + 6 entity search + 8 overlay state + 8 playthrough roundtrip + 4 session timeline)

### Blocked / Needs Attention

- (none)

### Next Steps (Phase 4)

1. **Conditions & branching** — conditional edges, rollable decision points, branch visualization
2. **Session runner mode** — step-through play mode with automatic timeline recording
3. **Campaign overview dashboard** — statistics, entity relationship graph, session history
4. **Import/export** — additional formats (PDF export, Foundry VTT integration)

### TODOs in Code

- (none — no TODOs or FIXMEs in codebase)

---

## Previous Sessions

### Phase 2 — Entity System (2026-03-02)
- 7 commits, 248 tests
- Entity tagging DSL, TipTap autocomplete, entity registry UI, search, graph highlighting

### Phase 1 — Foundation MVP (2026-03-02)
- 10 commits, 83 tests
- Graph editor with custom node shapes, three-tier drill-down, save/load, theming
