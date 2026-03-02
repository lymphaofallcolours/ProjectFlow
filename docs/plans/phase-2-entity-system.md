# Phase 2 — Entity System Implementation Plan

**Status:** In Progress
**Started:** 2026-03-02

## Goal

Add the entity system to ProjectFlow: TipTap rich text editing, entity tag parsing, autocomplete, inline chip rendering, entity registry UI, search, and a floating legend panel.

**Exit criteria (from spec):** Can tag entities in scene text, autocomplete works, can filter graph by entity, legend is accessible.

## Implementation Order

1. Entity Tag Parser & Domain Operations (domain/)
2. Entity Store & Campaign Integration (application/ + infrastructure/)
3. TipTap Editor Foundation (ui/editor/)
4. Entity Mention Extension & Chip Rendering (ui/editor/)
5. Entity Registry UI (ui/entities/ + ui/components/)
6. Search Panel & Entity Graph Highlighting (ui/components/ + ui/hooks/)
7. Integration Tests, Polish & Docs

## Affected Layers

- **domain/** — new: entity-tag-parser.ts, entity-operations.ts, search.ts
- **application/** — new: entity-store.ts; modified: campaign-actions.ts, ui-store.ts
- **infrastructure/** — modified: serialization.ts
- **ui/editor/** — new: tiptap-editor.tsx, entity-mention-extension.ts, entity-chip.tsx, entity-suggestion.tsx
- **ui/entities/** — new: entity-sidebar.tsx, entity-list.tsx, entity-profile.tsx, entity-create-dialog.tsx
- **ui/components/** — new: legend-panel.tsx, search-panel.tsx
- **ui/hooks/** — new: use-keyboard-shortcuts.ts
- **ui/layout/** — modified: toolbar.tsx, app-shell.tsx, status-bar.tsx

## Data Model Changes

No schema changes to existing types. New operations on existing EntityRegistry and Entity types already defined in domain/entity-types.ts.

## Test Strategy

- ~55 domain tests (parser, entity CRUD, search)
- ~25 application tests (entity store, campaign integration)
- ~5 TipTap smoke tests
- ~8 entity chip rendering tests
- ~15 UI store/entity list tests
- ~10 search/keyboard tests
- ~10 integration tests (entity roundtrip, entity search)
- Target: ~130+ new tests

## Key Decisions

- TipTap v3.20.0 with StarterKit + Mention + Placeholder
- Entity tags stored as raw text in RichContent.markdown
- Two Mention extension instances (@ for present, # for mentioned)
- Entity chip rendered via TipTap NodeView with React component
