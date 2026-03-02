# Phase 4 — Advanced Graph Operations Implementation Plan

## Context

Phases 1–3 are complete (324 tests). ProjectFlow has a working graph editor with entity tagging, playthrough tracking, and diff overlay. Phase 4 adds professional graph editing: multi-select, clipboard, edge styling, arc labels, node rewiring, and undo/redo.

**Exit criteria (from spec):** Can freely restructure the story graph with professional-grade editing tools.

**Deferred to Phase 5:** Subgraph grouping (collapsible named groups) — requires new domain types, parent-child graph relationships, and special rendering. Too large for this phase.

---

## What Already Exists

- **Arc labels**: `StoryNode.arcLabel?: string` in types.ts. Already renders in story-node.tsx:160-166 (uppercase text above shape). Just needs UI to set/edit.
- **Edge styles**: `StoryEdge.style?: 'default' | 'conditional' | 'secret'` in types.ts. story-edge.tsx renders all edges identically — needs visual differentiation + UI.
- **Single selection**: `selectedNodeId: string | null` in graph-store. Used by graph-canvas, search-panel, session-timeline (4 consumer files).
- **Node duplication**: `duplicateNode(id)` in graph-store + graph-operations, fully tested.
- **Flow node mapping**: `use-flow-nodes.ts` hardcodes `selected: false` on all nodes, passes only `label` on edges (no `storyEdge` data).
- **React Flow v12.10.1**: Has built-in multi-select (`selectionKeyCode`), lasso selection (`selectionOnDrag`), edge reconnection (`reconnectEdges`/`onReconnect`).
- **Context menu pattern**: glass-panel, MenuItem component, click-outside/escape, divider sections.

---

## Implementation Steps (6 Commits)

### Commit 1: Multi-select with React Flow integration

Replace single selection with multi-select. Shift+click additive, lasso drag for area selection. React Flow handles the visual selection; we mirror to Zustand.

**`src/domain/graph-operations.ts`** — add:
- `removeNodes(nodes, edges, nodeIds): { nodes, edges }` — batch remove
- `duplicateNodes(nodes, edges, nodeIds, offset): { nodes, edges, idMap }` — duplicate subgraph with interconnecting edges, returns old→new ID map

**`src/application/graph-store.ts`** — modify:
- Replace `selectedNodeId: string | null` → `selectedNodeIds: Set<string>`
- Replace `selectNode(id | null)` → `selectNodes(ids[])`, `toggleNodeSelection(id)`, `clearSelection()`
- Add `deleteSelectedNodes()`, `duplicateSelectedNodes()`

**`src/ui/graph/use-flow-nodes.ts`** — read `selectedNodeIds`, set `selected: selectedNodeIds.has(node.id)` on flow nodes

**`src/ui/graph/graph-canvas.tsx`** — add React Flow props: `selectionKeyCode="Shift"`, `multiSelectionKeyCode="Shift"`, `selectionOnDrag`, `selectionMode={SelectionMode.Partial}`, `onSelectionChange` → mirrors to `selectNodes()`. Remove manual `change.type === 'select'` handling. Pass `deleteKeyCode={null}` (we handle delete ourselves).

**Consumers to migrate** (`selectNode` → `selectNodes`/`clearSelection`):
- `src/ui/components/search-panel.tsx` — `selectNode(id)` → `selectNodes([id])`
- `src/ui/components/session-timeline.tsx` — same
- `src/ui/graph/graph-canvas.tsx` — `selectNode(null)` → `clearSelection()`

**`src/ui/graph/context-menu.tsx`** — multi-node variant: when `selectedNodeIds.size > 1`, show "Delete N nodes", "Duplicate N nodes"

**`src/ui/layout/status-bar.tsx`** — show "N selected" when selection > 1

**Tests:** ~18 new (8 domain + 10 store)

### Commit 2: Clipboard operations (cut/copy/paste)

**`src/domain/graph-operations.ts`** — add:
- `extractSubgraph(nodes, edges, nodeIds): { nodes: StoryNode[], edges: StoryEdge[] }` — selected nodes + edges connecting them
- `pasteSubgraph(clipNodes, clipEdges, offset): { nodes: Record<...>, edges: Record<...> }` — clone with new IDs, remap edge source/target

**`src/application/graph-store.ts`** — add:
- State: `clipboard: { nodes: StoryNode[]; edges: StoryEdge[] } | null`
- `copySelectedNodes()` — extract subgraph → clipboard
- `cutSelectedNodes()` — copy then delete
- `pasteClipboard()` — paste at offset from original positions, select pasted nodes

**`src/ui/hooks/use-keyboard-shortcuts.ts`** — add: Ctrl+C (copy), Ctrl+X (cut), Ctrl+V (paste), Delete/Backspace (delete selected)

**`src/ui/graph/context-menu.tsx`** — add Cut, Copy items to multi-select menu

**Tests:** ~26 new (10 domain + 12 store + 4 shortcut)

### Commit 3: Edge styling and edge context menu

**`src/domain/graph-operations.ts`** — add:
- `updateEdgeStyle(edge, style): StoryEdge`
- `updateEdgeLabel(edge, label): StoryEdge`

**`src/application/graph-store.ts`** — add: `setEdgeStyle(edgeId, style)`, `setEdgeLabel(edgeId, label)`

**`src/ui/graph/use-flow-nodes.ts`** — pass `data: { storyEdge: edge }` on flow edges (currently only passes `label`)

**`src/ui/graph/story-edge.tsx`** — style-based rendering:
- `default`: solid stroke, border color
- `conditional`: dashed (`strokeDasharray: "8 4"`), amber accent
- `secret`: dotted (`strokeDasharray: "3 3"`), faded opacity 0.4

**New: `src/ui/graph/edge-context-menu.tsx`** — glass-panel context menu following existing pattern. Sections: Edge Style (3 items with active highlight), Label (inline input), Delete Edge.

**`src/ui/graph/graph-canvas.tsx`** — add `onEdgeContextMenu` handler, extend context menu state with `{ type: 'edge'; edgeId; position }`

**Tests:** ~8 new (4 domain + 4 store)

### Commit 4: Arc label UI and node rewiring

**`src/domain/graph-operations.ts`** — add:
- `updateNodeArcLabel(node, arcLabel | undefined): StoryNode`
- `rewireEdge(edges, edgeId, newSource?, newTarget?): Record<...>` — update an edge's source or target

**`src/application/graph-store.ts`** — add: `setArcLabel(nodeId, arcLabel)`, `rewireEdge(edgeId, newSource?, newTarget?)`

**`src/ui/graph/context-menu.tsx`** — add "Arc Label" section (between Scene Type and Playthrough): inline text input, pre-populated, "Clear" option if set

**`src/ui/graph/graph-canvas.tsx`** — add `reconnectEdges` prop + `onReconnect` handler (React Flow's built-in edge drag-to-rewire)

**Tests:** ~10 new (6 domain + 4 store)

### Commit 5: Undo/redo history

Custom history stack — snapshot graph state before each mutation. No new dependencies.

**New: `src/domain/history-operations.ts`** — types:
- `HistorySnapshot = { nodes: Record<...>; edges: Record<...> }`
- `createSnapshot(nodes, edges): HistorySnapshot`
- `MAX_HISTORY_SIZE = 50`

**New: `src/application/history-store.ts`** — `useHistoryStore`:
- State: `past: HistorySnapshot[]`, `future: HistorySnapshot[]`
- `pushSnapshot(snapshot)` — push to past, clear future, cap at MAX
- `popUndo(): HistorySnapshot | null` — pop past, push current to future
- `popRedo(): HistorySnapshot | null` — pop future, push current to past
- `canUndo()`, `canRedo()`, `clear()`, `reset()`

**`src/application/graph-store.ts`** — add `undo()` and `redo()` actions that read from history-store + call `loadGraph()`. Wrap all mutating actions (addNode, deleteNode, deleteSelectedNodes, connectNodes, disconnectEdge, moveNode, updateField, duplicateNode, setEdgeStyle, setEdgeLabel, setArcLabel, cutSelectedNodes, pasteClipboard, rewireEdge, setPlaythroughStatus, clearPlaythroughStatus, renameNode, changeSceneType) with `historyStore.pushSnapshot()` before mutation. For `moveNode`: only push on drag start (not every pixel), track via flag.

**`src/application/campaign-actions.ts`** — `hydrateCampaign` clears history, `newCampaignAction` resets history

**`src/ui/layout/toolbar.tsx`** — add Undo/Redo buttons (Lucide `Undo2`/`Redo2`), disabled when can't undo/redo

**`src/ui/hooks/use-keyboard-shortcuts.ts`** — Ctrl+Z (undo), Ctrl+Shift+Z (redo)

**Tests:** ~21 new (4 domain + 15 store + 2 shortcut)

### Commit 6: Integration tests, docs, polish

**New: `tests/integration/graph-operations.integration.test.ts`** — ~14 tests:
- Multi-select + copy + paste preserves internal edges
- Cut removes originals, paste creates copies with new IDs
- Undo after delete restores nodes + edges
- Undo after paste removes pasted nodes, redo re-applies
- Edge style persists through save/load
- Arc label persists through save/load
- History clears on campaign load
- History caps at MAX_HISTORY_SIZE
- Rewire edge updates source/target correctly
- Clipboard survives selection change

**`tests/integration/campaign-roundtrip.integration.test.ts`** — ~2 new tests (edge style + arc label roundtrip)

**Docs:** architecture.md, decisions-log.md (3 ADRs: React Flow selection, custom history stack, subgraph grouping deferred), changelog.md, wip.md. Move plan to completed/.

**Tests:** ~16 new

---

## Key Decisions

1. **React Flow native selection** — leverage `selectionOnDrag`, `selectionKeyCode`, `onSelectionChange` rather than custom lasso. Mirror to Zustand `Set<string>` for business logic.
2. **Internal clipboard** — graph-store holds `clipboard` state. Browser Clipboard API is inappropriate for complex domain objects.
3. **Custom history stack** — dedicated `useHistoryStore` with snapshot array. No new dependencies (vs zustand-temporal). Graph-only undo (not entities/sessions).
4. **History-store is a pure data store** — no imports from graph-store. Graph-store imports from history-store (same layer, allowed). Undo/redo actions live in graph-store.
5. **Subgraph grouping deferred** to Phase 5 — major UI complexity, not needed for exit criteria.

## Test Summary

| Commit | New Tests | Running Total |
|--------|-----------|---------------|
| 1. Multi-select | ~18 | 342 |
| 2. Clipboard | ~26 | 368 |
| 3. Edge styling | ~8 | 376 |
| 4. Arc label + rewire | ~10 | 386 |
| 5. Undo/redo | ~21 | 407 |
| 6. Integration + docs | ~16 | 423 |

## Verification

```bash
pnpm build          # No TS errors
pnpm lint           # Clean
pnpm test:ci        # All ~423 tests pass
pnpm dev            # Visual verification
```

Manual checklist:
- Shift+click nodes to build multi-selection
- Drag lasso on empty canvas to select a group
- Ctrl+C then Ctrl+V pastes copies with offset, internal edges preserved, new IDs
- Ctrl+X removes originals, Ctrl+V pastes them elsewhere
- Delete/Backspace removes all selected nodes
- Right-click edge → set Conditional → dashed amber stroke
- Right-click edge → set Secret → dotted faded stroke
- Right-click node → Arc Label → type "MISSION 3" → text appears above node
- Drag edge endpoint to different node (rewire)
- Ctrl+Z undoes, Ctrl+Shift+Z redoes, toolbar buttons grey out correctly
- Save/reload: edge styles, arc labels preserved
- Dark + light mode: all new elements render correctly
