# Phase 8 — Entity System Completion & Spec Parity

## Context

Phase 7 is complete (587 tests, 35 test files). ProjectFlow has groups, attachments, branded PWA icons, and all prior features. However, the entity system is ~60-70% complete compared to `docs/spec.md`. This phase closes every remaining entity gap and brings the app to full spec parity.

**Gaps identified:**
- Entity profile only edits name, description, affiliations — missing portrait, history, relationships, custom fields
- Entity chips are not clickable (should open entity sidebar + scroll to entity)
- No hover tooltips on entity chips
- Node canvas doesn't show entity type icon summary badges
- Status changes in text (e.g., `@Alfa+wounded`) are not auto-logged to entity history
- No TipTap Link extension (hyperlink insertion)
- Edge rewiring has backend (`rewireEdge` in domain) but no UI

---

## What Already Exists

### Entity Domain & Store
- **`domain/types.ts`** — `Entity` type: `{ id, name, type, description?, affiliations?, portrait?, statusHistory?, relationships?, customFields? }`
- **`domain/entity-operations.ts`** — `createEntity`, `updateEntity`, `deleteEntity`, `addEntityStatus` (all pure)
- **`domain/entity-tag-parser.ts`** — Regex parser for 6 types × 2 modes + status markers
- **`application/entity-store.ts`** — CRUD + `addStatus()`. `updateEntity` whitelist: `{ name, description, affiliations }` only (portrait, history, relationships, custom fields NOT whitelisted)

### Entity UI
- **`ui/entities/entity-sidebar.tsx`** — Left slide-out panel with search, type filter, entity list, profile view
- **`ui/entities/entity-profile.tsx`** — Shows name (editable), type badge, description (TipTap), affiliations (TipTap). ~60 lines, straightforward to extend.
- **`ui/entities/entity-list.tsx`** — Filterable list with type tabs
- **`ui/entities/entity-create-dialog.tsx`** — Create new entity inline
- **`ui/components/entity-chip.tsx`** — Standalone chip (not used inline in TipTap)
- **`ui/components/entity-chip-node-view.tsx`** — TipTap NodeView for inline mention chips. Currently `display: inline-flex`, no onClick, no tooltip.

### Graph & Edges
- **`domain/graph-operations.ts`** — `rewireEdge(edges, edgeId, newSource?, newTarget?)` — pure function, fully tested
- **`ui/graph/edge-context-menu.tsx`** — Glass-panel menu with style picker, label input, delete. No rewire UI yet.
- **`ui/graph/story-node.tsx`** — Custom node shape with SVG. No entity summary badges.

### TipTap
- **`ui/components/tiptap-editor.tsx`** — StarterKit + Placeholder + 2 Mention extensions (@ present, # mentioned). No Link extension.
- **`ui/components/tiptap-extensions/entity-suggestion.tsx`** — Autocomplete dropdown for entity mentions

---

## Key Decisions

1. **Expand `updateEntity` whitelist** — Add `portrait`, `statusHistory`, `relationships`, `customFields` to the store's update whitelist. This is the simplest path; the whitelist pattern already works.

2. **Portrait as base64 dataUrl** — Reuse existing `readFileAsDataUrl()` from `file-io.ts` and the attachment size warning pattern. Portrait stored directly on Entity.portrait as a string.

3. **Entity profile as sub-components** — Split the growing profile into `EntityPortrait`, `EntityHistoryEditor`, `EntityRelationshipsEditor`, `EntityCustomFieldsEditor`. Keeps each under ~80 lines.

4. **Clickable chips open entity sidebar** — `EntityChipNodeView` gets an `onClick` handler that: (a) opens entity sidebar via `useUIStore`, (b) sets selected entity. No new store needed — sidebar already supports "selected entity" scroll-to behavior.

5. **Tooltip as portal** — TipTap inline chips live inside ProseMirror's DOM which has `overflow: hidden`. A portal-based tooltip escapes this. Render on hover with entity name, type, description preview, status.

6. **Node entity type icon summary** — Small icon row at the bottom of each `StoryNode` shape showing which entity types appear in that node's fields. Uses existing `extractEntitiesFromText()` from entity-tag-parser to scan all text fields, groups by type, renders up to 6 type icons.

7. **Status auto-logging** — When `RichContentEditor` (or any TipTap field) calls `onChange`, diff old text vs. new text for status markers (e.g., `@Alfa+wounded`). If new markers found, call `entityStore.addStatus()`. Needs `nodeId` prop threaded to editors for context.

8. **TipTap Link extension** — Add `@tiptap/extension-link` with `autolink: true`, `openOnClick: true`. Minimal config, no custom UI beyond the extension's defaults.

9. **Edge rewire via dropdown** — Add a "Rewire" section to edge context menu with two `NodeSelectorInput` dropdowns (source, target). `NodeSelectorInput` is a new reusable component showing a searchable node list.

---

## Implementation Steps (5 Commits)

### Commit 1: Entity domain ops + store enrichment

Expand domain operations and store to support all Entity fields.

**`src/application/entity-store.ts`** — expand `updateEntity` whitelist:
```typescript
// Current: { name, description, affiliations }
// New: { name, description, affiliations, portrait, statusHistory, relationships, customFields }
```
Add convenience actions:
- `setPortrait(entityId, dataUrl | null)` → updates portrait field
- `addRelationship(entityId, { targetId, type, description? })` → appends to relationships
- `removeRelationship(entityId, targetId)` → filters relationships

**`src/domain/entity-operations.ts`** — new pure functions:
- `setEntityPortrait(entity, dataUrl | null)` → Entity
- `addEntityRelationship(entity, rel)` → Entity (validates no self-ref, no duplicate)
- `removeEntityRelationship(entity, targetId)` → Entity
- `addEntityCustomField(entity, field)` → Entity
- `removeEntityCustomField(entity, fieldName)` → Entity
- `updateEntityCustomField(entity, fieldName, value)` → Entity

**`src/domain/entity-tag-parser.ts`** — new exports:
- `extractEntityTypesFromNodeFields(node: StoryNode)` → `Set<EntityType>` — scans all text fields, returns unique entity types found
- `extractStatusTagsFromText(text: string)` → `Array<{ name, type, status }>` — extracts all `@Name+status` patterns

**Tests:** ~28 new (entity-operations portrait/relationship/customField tests, entity-store whitelist tests, parser extraction tests)

---

### Commit 2: Entity profile UI — portrait, history, relationships, custom fields

New sub-components mounted in the entity profile view.

**New: `src/ui/entities/entity-portrait.tsx`**
- Circular image display with "Upload" overlay on hover
- Uses `readFileAsDataUrl()` + size warning (reuse attachment pattern)
- "Remove" button when portrait exists
- Fallback: entity type icon in circle

**New: `src/ui/entities/entity-history-editor.tsx`**
- Chronological list of status entries from `entity.statusHistory`
- Each entry: timestamp, status text, source node label (if available)
- "Add manual entry" inline input
- Delete entry button

**New: `src/ui/entities/entity-relationships-editor.tsx`**
- List of relationships with entity name, type badge, relationship label
- "Add Relationship" button → dropdown of other entities + relationship type input
- Click relationship target → navigate to that entity in sidebar
- Remove relationship button

**New: `src/ui/entities/entity-custom-fields.tsx`**
- Key-value editor for arbitrary custom fields on entities
- "Add Field" button → name input + value input
- Edit/delete existing fields
- Reuses glass-panel styling

**`src/ui/entities/entity-profile.tsx`** — restructure:
- Mount `EntityPortrait` at top
- Existing name/description/affiliations editors stay
- Mount `EntityHistoryEditor` section
- Mount `EntityRelationshipsEditor` section
- Mount `EntityCustomFieldsEditor` section
- Collapsible sections to manage vertical space

**Tests:** ~8 new (portrait upload/remove, history list rendering, relationship add/remove, custom field CRUD)

---

### Commit 3: Clickable chips + tooltips + node entity type icon summary

Make entity chips interactive. Add entity summary badges to graph nodes.

**`src/ui/components/entity-chip-node-view.tsx`** — updates:
- Add `onClick` handler: opens entity sidebar, sets selected entity
- Add `cursor: pointer` styling
- Add `onMouseEnter`/`onMouseLeave` for tooltip trigger

**New: `src/ui/components/entity-tooltip.tsx`**
- Portal-based tooltip component
- Shows: entity name, type icon + label, description preview (first 80 chars), current status
- Positioned near chip using `getBoundingClientRect()`
- 300ms hover delay before showing, 150ms delay before hiding
- Glass-panel aesthetic matching existing UI

**`src/ui/graph/story-node.tsx`** — add `EntityTypeSummary` sub-component:
- Scans node's text fields via `extractEntityTypesFromNodeFields()`
- Renders small type icons (from lucide-react, matching existing entity type icon config)
- Positioned at bottom of node shape, max 6 icons
- Memoized to avoid re-scanning on every render

**`src/ui/entities/entity-sidebar.tsx`** — updates:
- Accept `selectedEntityId` from external navigation (chip click)
- Auto-scroll to entity in list when selected externally

**Tests:** ~7 new (chip click opens sidebar, tooltip renders on hover, tooltip portal escapes overflow, entity summary shows correct types, summary memoization)

---

### Commit 4: Status auto-logging + TipTap Link extension + edge rewire UI

**Status Auto-Logging:**

**`src/ui/components/tiptap-editor.tsx`** — update `onUpdate` handler:
- Accept optional `nodeId` prop
- On content change, diff previous text vs. new text for status markers
- Use `extractStatusTagsFromText()` on both old and new
- For each new status marker not in old text, call `entityStore.addStatus(entityId, status, nodeId)`
- Store previous text in a ref for diffing

**`src/ui/overlays/field-editors/rich-content-editor.tsx`** — thread `nodeId` prop to TipTapEditor

**TipTap Link Extension:**

Install: `pnpm add @tiptap/extension-link`

**`src/ui/components/tiptap-editor.tsx`** — add Link extension:
```typescript
import Link from '@tiptap/extension-link'
// In extensions array:
Link.configure({ autolink: true, openOnClick: true, HTMLAttributes: { class: 'entity-link' } })
```

**Edge Rewire UI:**

**New: `src/ui/components/node-selector-input.tsx`**
- Searchable dropdown for selecting a node from the graph
- Shows node label + scene type icon
- Filters as you type
- Used by edge context menu for source/target selection

**`src/ui/graph/edge-context-menu.tsx`** — add "Rewire" section:
- Two `NodeSelectorInput` fields: "Source" and "Target"
- Pre-populated with current source/target
- On change, call `graphStore.rewireEdge(edgeId, newSource, newTarget)`

**`src/application/graph-store.ts`** — add `rewireEdge` action:
- Calls domain `rewireEdge()`, pushes history

**Tests:** ~8 new (status auto-logging detects new markers, Link extension renders, node selector filters, edge rewire via menu, rewire store action)

---

### Commit 5: Integration tests + docs + polish

**New integration tests:**

**`tests/integration/entity-profile.integration.test.ts`:**
- Portrait upload → save/load → portrait preserved
- Relationship CRUD → save/load → relationships preserved
- Custom fields CRUD → save/load → custom fields preserved
- Status history → save/load → history preserved

**`tests/integration/entity-interaction.integration.test.ts`:**
- Entity chip click → sidebar opens with correct entity
- Status auto-logging: add `@Alfa+wounded` to field → entity gains status entry
- Entity type summary on node: add entity tags → node shows type icons
- Edge rewire via context menu → edge source/target updated

**`tests/integration/link-extension.integration.test.ts`:**
- Autolinked URL renders as clickable link
- Link survives save/load roundtrip

**Docs updates:**
- `docs/architecture.md` — add entity-portrait, entity-history-editor, entity-relationships-editor, entity-custom-fields, entity-tooltip, node-selector-input
- `docs/decisions-log.md` — ADRs for tooltip portal, status auto-logging diff approach, entity profile sub-components, Link extension
- `docs/changelog.md` — Phase 8 entries
- `docs/wip.md` — update session state, Phase 9 next steps
- `docs/dependencies.md` — document `@tiptap/extension-link`
- Archive plan to `docs/plans/completed/`

**Tests:** ~14 new integration tests

---

## Critical Files

| File | Changes |
|------|---------|
| `src/domain/entity-operations.ts` | Portrait, relationship, custom field ops |
| `src/domain/entity-tag-parser.ts` | `extractEntityTypesFromNodeFields`, `extractStatusTagsFromText` |
| `src/application/entity-store.ts` | Expanded whitelist, portrait/relationship actions |
| `src/application/graph-store.ts` | `rewireEdge` action |
| `src/ui/entities/entity-profile.tsx` | Restructure into sub-component sections |
| `src/ui/entities/entity-portrait.tsx` | **NEW** — portrait upload/display |
| `src/ui/entities/entity-history-editor.tsx` | **NEW** — status history list |
| `src/ui/entities/entity-relationships-editor.tsx` | **NEW** — relationship CRUD |
| `src/ui/entities/entity-custom-fields.tsx` | **NEW** — custom field editor |
| `src/ui/components/entity-chip-node-view.tsx` | Clickable + tooltip trigger |
| `src/ui/components/entity-tooltip.tsx` | **NEW** — portal tooltip |
| `src/ui/components/node-selector-input.tsx` | **NEW** — searchable node picker |
| `src/ui/components/tiptap-editor.tsx` | Status auto-logging, Link extension |
| `src/ui/graph/story-node.tsx` | `EntityTypeSummary` sub-component |
| `src/ui/graph/edge-context-menu.tsx` | Rewire section with node selectors |

## Test Summary

| Commit | New Tests | Running Total |
|--------|-----------|---------------|
| 1. Entity domain + store | ~28 | ~615 |
| 2. Entity profile UI | ~8 | ~623 |
| 3. Chips + tooltips + summary | ~7 | ~630 |
| 4. Status logging + Link + rewire | ~8 | ~638 |
| 5. Integration tests + docs | ~14 | ~652 |

## Verification

```bash
pnpm build          # No TS errors
pnpm lint           # Clean
pnpm test:ci        # All ~652 tests pass
pnpm dev            # Visual verification
```

Manual checklist:
- Open entity profile → upload portrait image → displays as circle, persists on save/load
- Entity profile → add/edit/remove status history entries
- Entity profile → add relationship to another entity → click target → navigates
- Entity profile → add/edit/remove custom fields
- Hover over entity chip in any TipTap field → tooltip appears with entity info
- Click entity chip → entity sidebar opens, scrolls to that entity
- Type `@Alfa+wounded` in a node field → entity "Alfa" gains "wounded" status in history
- Paste a URL in TipTap → auto-linked, clickable
- Node on canvas shows small entity type icons at bottom
- Right-click edge → "Rewire" section → change source/target via dropdown
- Save/load → all new entity data preserved
- Dark + light mode: all new UI renders correctly

## Deferred to Future Phases

- Inline TipTap image nodes (requires content format migration to JSON)
- Nested groups (groups containing groups)
- External file references (avoid base64 bloat for large assets)
- Bulk entity import/export (CSV or markdown)
- Entity graph visualization (relationship web view)
