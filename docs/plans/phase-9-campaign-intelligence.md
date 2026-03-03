# Phase 9 — Campaign Intelligence & Navigation

## Status: In Progress

## Goal
Add campaign intelligence tools: node tags, entity relationship graph, incoming relationships, and campaign dashboard.

## Implementation Order

### Commit 1: Node tag system
- `updateNodeTags` in graph-operations.ts
- `setNodeTags` in graph-store.ts
- Tags section in context-menu.tsx
- Tags mode in search-panel.tsx
- Tag indicator in story-node.tsx
- Tests: ~12

### Commit 2: Entity relationship graph
- `entityGraphOpen` + `toggleEntityGraph` in ui-store.ts
- `entity-graph-layout.ts` (pure domain)
- `entity-graph-node.tsx` (custom RF node)
- `entity-relationship-graph.tsx` (main panel)
- Toolbar button, keyboard shortcut, app-shell mount
- Tests: ~8

### Commit 3: Incoming relationships + campaign dashboard
- `computeIncomingRelationships` in entity-operations.ts
- "Referenced By" section in entity-relationships-editor.tsx
- `dashboardOpen` + `toggleDashboard` in ui-store.ts
- `campaign-dashboard.tsx` (stats panel)
- Toolbar button, keyboard shortcut, app-shell mount
- Tests: ~10

### Commit 4: Integration tests + docs + polish
- Integration tests for tags, entity graph, dashboard
- All docs updated
- Plan archived

## Key Decisions
1. Type-clustered layout over dagre — no new dependency
2. Tag highlighting via selectNodes() — reuses multi-select
3. Dashboard reads all stores — no derived/cached state
4. Second ReactFlowProvider for entity graph
5. Incoming relationships computed on demand
