# Work In Progress

<!-- Claude: Read this file at session start. Update it at session end. -->

## Current Session

**Date:** 2026-03-03
**Goal:** Phase 6 — Custom Field Templates, Performance, PWA (complete)

### Completed This Session

- **Commit 1:** Fix template persistence bug + domain operations + store — template-operations.ts (create, update, delete, instantiate), campaign-store CRUD, assembleCampaign/hydrateCampaign bug fix, serialization validation. 20 new tests.
- **Commit 2:** Template manager UI + template picker — TemplateManager slide-in panel, custom-field-editor template picker dropdown, toolbar Templates button, FieldIcon expansion. 2 new tests.
- **Commit 3:** Performance optimization — shared SVG defs (5 glass gradients + highlight-sheen + node-glow filter at canvas level), HighlightContext + useEntityHighlight hook (O(1) per node), useFlowNodes memo split. 5 new tests.
- **Commit 4:** PWA offline mode — vite-plugin-pwa, web manifest, service worker, PWA meta tags, placeholder icons, PWAInstallPrompt component, online/offline status bar indicator. 3 new tests.
- **Commit 5:** Integration tests, docs, polish — template roundtrip tests, performance tests, all docs updated, plan archived.

### Test Coverage

- ~500 tests total across 28 test files
- Domain: ~194 (65 parser + 30 entity ops + 21 search + 51 graph ops + 33 playthrough ops + 3 history ops + 13 subgraph ops + 12 template ops)
- Application: ~159 (63 graph store + 23 entity store + 22 session store + 16 history store + 25 UI store + 8 campaign store)
- Infrastructure: 13 (serialization)
- UI: 35 (12 entity chip + 17 keyboard shortcuts + 5 entity highlight + 1 app)
- Integration: ~65 (10 campaign roundtrip + 3 entity roundtrip + 6 entity search + 8 overlay state + 8 playthrough roundtrip + 4 session timeline + 20 graph operations + 3 PWA build + 5 performance)

### Blocked / Needs Attention

- PWA icons are placeholder 1x1 PNGs — need proper 192x192 and 512x512 icons generated with actual ProjectFlow branding

### Next Steps (Phase 7)

1. **Subgraph grouping** — collapsible named groups, parent-child relationships, group-aware rendering
2. **Image/attachment support** — file attachments on nodes, size warnings for base64
3. **Proper PWA icons** — generate branded icons for all required sizes

### TODOs in Code

- (none — no TODOs or FIXMEs in codebase)

---

## Previous Sessions

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
