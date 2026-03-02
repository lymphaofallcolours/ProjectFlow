# Work In Progress

<!-- Claude: Read this file at session start. Update it at session end. -->

## Current Session

**Date:** 2026-03-02
**Goal:** Phase 2 — Entity System (complete)

### Completed This Session

- **Commit 1:** Entity tag parser, entity operations, and search — regex-based parser for 6 types × 2 modes, CRUD operations, full-text and entity-aware search. 108 new tests.
- **Commit 2:** Entity store & campaign integration — useEntityStore Zustand store, campaign assemble/hydrate/reset include entities, serialization validates entityRegistry. 25 new tests.
- **Commit 3:** TipTap editor foundation — replaced plain textareas with TipTap v3.20.0 (StarterKit + Placeholder), ProseMirror glass styles.
- **Commit 4:** Entity mention extension & chip rendering — two Mention extension instances (@ present, # mentioned), inline EntityChip with type-colored pills, autocomplete dropdown. 12 new tests.
- **Commit 5:** Entity registry UI — sidebar with search/filter/list/profile/create, legend panel, toolbar integration, status bar entity count. 8 new UI store tests.
- **Commit 6:** Search panel & entity graph highlighting — text and entity search modes, debounced input, entity highlight dims non-matching nodes, keyboard shortcuts (Ctrl+/, Ctrl+F, Ctrl+E). 3 new tests.
- **Commit 7:** Integration tests, docs, polish — entity roundtrip and search integration tests, all docs updated. 9 new integration tests.

### Test Coverage

- 248 tests total: 108 domain (65 parser + 22 entity ops + 21 search), 60 application (23 entity store + 19 graph store + 18 UI store), 10 serialization, 12 entity chip, 3 keyboard shortcuts, 12 integration (7 campaign roundtrip + 3 entity roundtrip + 6 entity search + 8 overlay state), 1 app smoke test

### Blocked / Needs Attention

- (none)

### Next Steps (Phase 3)

1. **Playthrough tracking** — right-click context menu for node status, session log, diff overlay
2. **Status change markers** — entity status tracking from tags (+wounded, +dead), status history timeline
3. **Session timeline sidebar** — chronological list of visited nodes with status and notes
4. **Export session log** — markdown export for campaign journaling

### TODOs in Code

- (none — no TODOs or FIXMEs in codebase)

---

## Previous Sessions

### Phase 1 — Foundation MVP (2026-03-02)
- 10 commits, 83 tests
- Graph editor with custom node shapes, three-tier drill-down, save/load, theming
