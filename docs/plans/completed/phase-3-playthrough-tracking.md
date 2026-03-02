# Phase 3 — Playthrough Tracking & Diff Implementation Plan

## Context

Phase 2 is complete (7 commits, 248 tests). ProjectFlow has a working graph editor with entity tagging, search, and rich text. Phase 3 adds playthrough tracking: marking nodes during play, session logs, color-coded diff overlay, timeline sidebar, and markdown export.

**Exit criteria (from spec):** Can mark nodes during play, view a post-session diff, export a session journal.

---

## What Already Exists

**Domain types ready** (`src/domain/types.ts`):
- `PlaythroughStatus = 'unvisited' | 'played_as_planned' | 'modified' | 'skipped'`
- `PlaythroughEntry` — id, sessionDate, sessionLabel, nodesVisited[] (each with nodeId, status, notes, timestamp)
- `StoryNode.playthroughStatus?: PlaythroughStatus` and `playthroughNotes?: string`
- `Campaign.playthroughLog: PlaythroughEntry[]`

**CSS tokens ready** (`src/index.css:34-38`):
- `--color-status-unvisited: #b0bac9`, `--color-status-played: #38c97a`, `--color-status-modified: #4f8ff7`, `--color-status-skipped: #f25555`

**Existing patterns to reuse:**
- Context menu (`src/ui/graph/context-menu.tsx`) — MenuItem component, click-outside/escape handling, scene type submenu pattern
- Slide-out panels — SearchPanel (left, `src/ui/components/search-panel.tsx`), EntitySidebar (right, `src/ui/entities/entity-sidebar.tsx`) — glass-panel, absolute positioning, z-30
- Story node rendering (`src/ui/graph/story-node.tsx`) — already has entity highlight dimming pattern (opacity reduction when filter active)
- Graph store mutations (`src/application/graph-store.ts`) — established pattern for node updates via domain functions
- Campaign integration (`src/application/campaign-actions.ts`) — assemble/hydrate/reset pattern for new stores

---

## Implementation Steps (6 Commits)

### Commit 1: Playthrough domain operations

Pure functions. Zero framework imports.

**New files:**
- `src/domain/playthrough-operations.ts`
  - `setNodePlaythroughStatus(node, status, notes?): StoryNode` — sets status, attaches notes only for 'modified', clears notes otherwise
  - `clearNodePlaythroughStatus(node): StoryNode` — resets to undefined
  - `createPlaythroughEntry(label?, date?): PlaythroughEntry` — new session with generated id, empty nodesVisited
  - `addNodeVisit(entry, nodeId, status, notes?): PlaythroughEntry` — append/replace visit by nodeId, sets timestamp
  - `removeNodeVisit(entry, nodeId): PlaythroughEntry`
  - `updateSessionLabel(entry, label): PlaythroughEntry`
  - `buildDiffMap(entry): Record<string, PlaythroughStatus>` — nodeId→status lookup
  - `buildCumulativeDiffMap(entries[]): Record<string, PlaythroughStatus>` — merge sessions (later overrides earlier)
  - `PLAYTHROUGH_STATUS_CONFIG: Record<PlaythroughStatus, { label, color, icon }>` — config per status
  - `PLAYTHROUGH_STATUSES: PlaythroughStatus[]` — ordered array
  - `exportSessionAsMarkdown(entry, nodes): string` — formatted markdown with header, timeline, statistics
- `src/domain/playthrough-operations.test.ts` — ~28 tests covering all functions + edge cases

**Modified:** `tests/fixtures/factories.ts` — add `createTestPlaythroughEntry()`, `createTestNodeVisit()`

### Commit 2: Session store and campaign integration

**New files:**
- `src/application/session-store.ts` — `useSessionStore` Zustand store
  - State: `playthroughLog`, `activeSessionId`, `diffOverlayActive`, `sessionTimelineOpen`
  - Lifecycle: `startSession(label?) → id`, `endSession()`, `deleteSession(id)`, `updateSessionLabel(id, label)`
  - Node visits: `recordNodeVisit(nodeId, status, notes?)`, `removeNodeVisit(nodeId)`
  - Selection: `selectSession(id | null)`, `getActiveSession()`, `getSelectedSession()`
  - Overlay: `toggleDiffOverlay()`, `toggleSessionTimeline()`
  - Persistence: `loadPlaythroughLog(log)`, `reset()`
- `src/application/session-store.test.ts` — ~20 tests

**Modified files:**
- `src/application/graph-store.ts` — add `setPlaythroughStatus(nodeId, status, notes?)` and `clearPlaythroughStatus(nodeId)` using domain functions
- `src/application/graph-store.test.ts` — ~4 new tests
- `src/application/campaign-actions.ts` — assembleCampaign reads `sessionStore.playthroughLog`, hydrateCampaign calls `sessionStore.loadPlaythroughLog()`, newCampaignAction calls `sessionStore.reset()`
- `src/infrastructure/serialization.ts` — validate playthroughLog (backward-compatible: missing = empty array)
- `src/infrastructure/serialization.test.ts` — ~3 new tests

### Commit 3: Context menu playthrough status marking

**New files:**
- `src/ui/graph/playthrough-notes-input.tsx` — inline notes input (auto-focus, Enter confirms, Escape cancels, glass-panel styled)

**Modified files:**
- `src/ui/graph/context-menu.tsx` — add "Playthrough" section with divider below scene type section. Uses `PLAYTHROUGH_STATUS_CONFIG` for labels/colors. Wires to `graphStore.setPlaythroughStatus()` + `sessionStore.recordNodeVisit()` (when session active). "Modified" triggers notes input before confirming. Highlights current node status.

### Commit 4: Diff overlay on graph nodes and session selector

**New files:**
- `src/ui/layout/session-selector.tsx` — toolbar dropdown: session list (sorted newest first), "Start New Session"/"End Session" controls, glass-panel dropdown

**Modified files:**
- `src/ui/graph/story-node.tsx` — when `diffOverlayActive`: render colored stroke ring around shape (3px, status color), dim unvisited nodes (opacity 0.35). Always show small status dot (6px circle) in bottom-right when `playthroughStatus` is set. Reads diff map from `sessionStore.getSelectedSession()` + `buildDiffMap()`.
- `src/ui/layout/toolbar.tsx` — add `<SessionSelector />` and diff overlay toggle button (Eye icon from Lucide)
- `src/ui/layout/status-bar.tsx` — show active session label and visit count

### Commit 5: Session timeline sidebar and markdown export

**New files:**
- `src/ui/components/session-timeline.tsx` — right slide-out panel (w-80, z-30, same positioning as EntitySidebar). Header: session label (editable inline), date. Body: chronological node visits (index, label, status dot, notes). Click visit → select node in graph. Footer: "Export as Markdown" + "End Session" buttons.
- `src/infrastructure/markdown-export.ts` — `downloadMarkdown(content, filename)` using Blob + anchor download

**Modified files:**
- `src/ui/layout/app-shell.tsx` — render `<SessionTimeline />`
- `src/ui/hooks/use-keyboard-shortcuts.ts` — add `Ctrl+T` (toggle timeline), `Ctrl+D` (toggle diff overlay)
- `src/ui/hooks/use-keyboard-shortcuts.test.ts` — ~2 new tests

### Commit 6: Integration tests, docs, polish

**New files:**
- `tests/integration/playthrough-roundtrip.integration.test.ts` — ~10 tests (session CRUD, save/load roundtrip, diff map, markdown export, graph+session store coordination)
- `tests/integration/session-timeline.integration.test.ts` — ~4 tests (timeline display, session selection, store reset)

**Modified files:**
- `tests/integration/campaign-roundtrip.integration.test.ts` — ~2 new tests for playthrough persistence
- All docs: `architecture.md`, `decisions-log.md`, `changelog.md`, `wip.md`
- Move plan to `docs/plans/completed/`

---

## Key Decisions

1. **Dedicated `useSessionStore`** rather than extending existing stores — session log is a distinct concern from graph data and UI state.
2. **Dual write on status mark** — context menu writes to both graph store (node-level persistent status) and session store (session-level visit log). Different purposes.
3. **Diff overlay is computed, not stored** — `buildDiffMap()` runs on-the-fly from selected session. No redundant state.
4. **Timeline shares right panel slot** with EntitySidebar — opening one closes the other.
5. **Backward-compatible serialization** — missing `playthroughLog` treated as empty array for Phase 1/2 save files.

## Test Summary

| Commit | New Tests | Running Total |
|--------|-----------|---------------|
| 1. Domain ops | ~28 | 276 |
| 2. Stores + campaign | ~27 | 303 |
| 3. Context menu | 0 | 303 |
| 4. Diff overlay + toolbar | 0 | 303 |
| 5. Timeline + export | ~2 | 305 |
| 6. Integration + docs | ~16 | 321 |

## Verification

```bash
pnpm build          # No TS errors
pnpm lint           # Clean
pnpm test:ci        # All ~321 tests pass
pnpm dev            # Visual verification
```

Manual checklist:
- Right-click node → Playthrough → "Played as Planned" → green status dot appears
- Right-click → "Modified" → notes input → enter text → blue dot + notes saved
- Start session via toolbar → mark nodes → timeline sidebar shows visits in order
- Toggle diff overlay → graph color-codes all nodes by status (green/blue/red/gray)
- Save campaign, reload → session log + node statuses preserved
- Export session as markdown → file downloads with correct format
- Ctrl+T → timeline toggles, Ctrl+D → diff overlay toggles
- Dark + light mode: status colors readable on both themes
