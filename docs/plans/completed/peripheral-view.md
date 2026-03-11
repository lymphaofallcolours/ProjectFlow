# Peripheral View — Implementation Plan

## Context

Currently, accessing node field data requires either opening radial subnodes (Shift+click → click a field) or entering the full-screen cockpit (double-click). Both obscure the graph canvas. During live sessions, the GM needs to read field content (script, dialogue, GM notes, etc.) while maintaining sight of the node tree for navigation context.

**Peripheral View** is a toggleable mode where selecting a node automatically displays its populated fields as floating glass panels around the screen edges, keeping the graph canvas fully visible in the center. This is "Tier 1.5" — between radial subnodes and cockpit.

## Design Decisions

- **Layout**: Four screen edges, smart auto-layout distributing fields based on count
- **Rendering**: Read-first with click-to-edit (rendered content, click to switch to TipTap/list editor in-place)
- **Node switching**: Cross-fade animation when selecting a different node
- **Empty fields**: Hidden entirely — only populated fields shown
- **Toggle**: Toolbar button + `Ctrl+Shift+P` keyboard shortcut
- **Canvas**: Panels overlay with glass/blur transparency — no canvas resize
- **Interaction**: `pointer-events-none` on containers, `pointer-events-auto` on cards — clicks pass through to canvas

## Field-to-Edge Affinity

```
LEFT:   script, gmNotes, vibe
RIGHT:  characters, combat, secrets
TOP:    dialogues, events
BOTTOM: soundtrack, diceRolls, custom
```

Edge activation by populated field count:
- 1–2 → left only
- 3–4 → left + right
- 5–7 → left + right + top
- 8+  → all four edges

If a field's preferred edge isn't active, it falls back to the nearest active edge.

## New Files

| File | Layer | Purpose |
|------|-------|---------|
| `src/domain/peripheral-layout.ts` | domain | Pure layout algorithm: maps populated fields to edges |
| `src/domain/peripheral-layout.test.ts` | domain | Unit tests for layout algorithm |
| `src/ui/overlays/peripheral-view.tsx` | ui | Root component: subscribes to selection, computes layout, renders edges |
| `src/ui/overlays/peripheral-edge.tsx` | ui | Container for one screen edge with fixed positioning |
| `src/ui/overlays/peripheral-field-card.tsx` | ui | Individual glass card with read/edit toggle |
| `src/ui/overlays/field-read-view.tsx` | ui | Read-only renderer for all field types |

## Modified Files

| File | Changes |
|------|---------|
| `src/application/ui-store.ts` | Add `peripheralViewEnabled`, `peripheralEditingField`, `togglePeripheralView`, `setPeripheralEditingField` |
| `src/ui/layout/app-shell.tsx` | Add `<PeripheralView />` after `<OverlayRoot />` |
| `src/ui/layout/toolbar.tsx` | Add toggle button in right group (before Help) |
| `src/ui/hooks/use-keyboard-shortcuts.ts` | Add `Ctrl+Shift+P` shortcut; update Escape chain for peripheral edit mode |

## State Management

Add to `ui-store.ts`:

```typescript
// State
peripheralViewEnabled: boolean          // false by default
peripheralEditingField: FieldKey | null  // which field is in edit mode

// Actions
togglePeripheralView: () => void
setPeripheralEditingField: (fieldKey: FieldKey | null) => void
```

Key rules:
- Peripheral view is an **independent mode**, not an `activeOverlay` — it coexists with the canvas
- When `activeOverlay` is set (cockpit or field-panel open), peripheral panels temporarily hide
- When selection is empty or multi-select, peripheral panels hide (mode stays enabled)
- Toggling off clears `peripheralEditingField`

## Component Architecture

```
PeripheralView (root)
  reads: selectedNodeIds (graph-store), peripheralViewEnabled + activeOverlay (ui-store)
  computes: computePeripheralLayout(populatedFields)
  renders: one PeripheralEdge per active edge

  PeripheralEdge (left | right | top | bottom)
    fixed positioning per edge
    pointer-events-none container, flex column/row
    renders: PeripheralFieldCard per assigned field

    PeripheralFieldCard
      glass-panel, pointer-events-auto
      header: FieldIcon + label + color accent + edit pencil button
      body: FieldReadView (default) or FieldEditor (when peripheralEditingField matches)

      FieldReadView (new)
        dispatches by field type:
        - RichContent → TipTap editor with editable={false} (reuses entity chip rendering)
        - DialogueEntry[] → compact styled list
        - SoundtrackCue[] → compact styled list
        - DiceRollEntry[] → compact styled list
        - CustomField[] → label + content pairs
```

## Edge Positioning

```
Left:   fixed left-0 top-[toolbar] bottom-[statusbar] w-[300px]
Right:  fixed right-0 top-[toolbar] bottom-[statusbar] w-[300px]
Top:    fixed top-[toolbar] left-[leftW] right-[rightW] max-h-[180px]
Bottom: fixed bottom-[statusbar] left-[leftW] right-[rightW] max-h-[180px]
```

Top/bottom insets adjust based on which side edges are active (avoid overlap). All edges use `overflow-y-auto` (sides) or `overflow-x-auto` (top/bottom).

## Reuse from Existing Code

| Existing | Reused For |
|----------|------------|
| `isFieldPopulated` (`domain/graph-operations.ts:132`) | Filter which fields to show |
| `FIELD_DEFINITIONS` (`domain/types.ts`) | Field metadata (key, label, color, icon) |
| `FieldEditor` (`ui/overlays/field-editors/field-editor.tsx`) | Edit mode in PeripheralFieldCard |
| `FieldIcon` (`ui/overlays/field-icon.tsx`) | Card headers |
| `glass-panel` CSS class | Card styling |
| `ToolbarButton` / `ToolbarDivider` (local to `toolbar.tsx`) | Toolbar toggle |

## Animation

Cross-fade on node switch:
1. Track `prevNodeId` via `useRef`
2. When `nodeId` changes: set opacity 0 → update content on next frame → set opacity 1
3. CSS `transition: opacity 200ms ease` on the peripheral view container
4. Simple and performant — no dual content holding needed

## Sidebar Collision Handling

When `entitySidebarOpen` or `searchPanelOpen` is true, suppress the conflicting edge (left for entity sidebar, left for search panel) and redistribute those fields to other active edges.

## Implementation Order

### Phase 1: Domain + State
1. Create `src/domain/peripheral-layout.ts` — pure `computePeripheralLayout` function
2. Create `src/domain/peripheral-layout.test.ts` — test thresholds, affinity, fallback
3. Add peripheral state/actions to `src/application/ui-store.ts`

### Phase 2: Read-Only Renderer
4. Create `src/ui/overlays/field-read-view.tsx` — read-only dispatcher for all field types

### Phase 3: Core Components
5. Create `src/ui/overlays/peripheral-field-card.tsx` — glass card with read/edit toggle
6. Create `src/ui/overlays/peripheral-edge.tsx` — edge container with positioning
7. Create `src/ui/overlays/peripheral-view.tsx` — root with selection subscription + layout

### Phase 4: Integration
8. Add `<PeripheralView />` to `app-shell.tsx`
9. Add toolbar button to `toolbar.tsx` (in right group, before Help divider)
10. Add `Ctrl+Shift+P` to `use-keyboard-shortcuts.ts`
11. Update Escape chain: if `peripheralEditingField` is set, clear it first

### Phase 5: Animation + Polish
12. Add cross-fade transition on node switch
13. Handle sidebar collision (suppress conflicting edges)
14. Responsive: reduce panel width or collapse edges on narrow viewports

## Verification

1. **Toggle**: Click toolbar button or press `Ctrl+Shift+P` — mode indicator activates
2. **Selection**: Click a node with populated fields — panels appear at edges with glass styling
3. **Only populated**: Empty fields do not appear; node with no data shows nothing
4. **Smart layout**: Node with 2 fields → left only; 4 fields → left+right; 7 → left+right+top; etc.
5. **Read mode**: Content is rendered read-only with proper formatting
6. **Click-to-edit**: Click pencil on a card → switches to full editor; click another → previous reverts to read
7. **Node switch**: Select different node → cross-fade transition, panels update
8. **Escape**: In edit mode, Escape exits edit first; otherwise follows normal chain
9. **Overlay suppression**: Open cockpit (double-click) → peripheral panels hide; close cockpit → they return
10. **Canvas interaction**: Click/drag on canvas between panels works normally (pointer-events pass through)
11. **Run `pnpm lint` and `pnpm test`** — all pass
