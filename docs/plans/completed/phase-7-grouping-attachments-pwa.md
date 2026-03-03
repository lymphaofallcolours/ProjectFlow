# Phase 7 — Subgraph Grouping, Image Attachments, PWA Icons

## Context

Phase 6 is complete (~500 tests, ~10.5K LOC). ProjectFlow has the full graph editor with custom field templates, entity system, playthrough tracking, clipboard/undo-redo, auto-save, subgraph import/export, performance optimizations (shared SVG defs, HighlightContext), and PWA offline mode.

Phase 7 completes the remaining deferred features: collapsible subgraph groups, image/attachment support in node fields, and proper branded PWA icons.

---

## What Already Exists

- **`StoryNode` type** (`domain/types.ts:152-162`) — no grouping fields yet, but all fields optional-friendly
- **`Attachment` type** already defined (`domain/types.ts:70-75`) — `{ id, filename, mimeType, dataUrl }`
- **`RichContent.attachments?`** field exists (`domain/types.ts:65-68`) — never populated or rendered
- **`subgraph-operations.ts`** — serialize/deserialize subgraphs for cross-campaign export
- **`graph-operations.ts`** — `extractSubgraph()`, `pasteSubgraph()`, `duplicateNodes()` with ID remapping
- **React Flow v12** (`@xyflow/react@^12.10.1`) — supports `parentId` on nodes but no native visual grouping
- **TipTap v3.20.0** — StarterKit + Placeholder + 2 entity Mention extensions, content stored as plain text via `getText()`
- **`file-io.ts`** — File System Access API with fallback, file handle caching for auto-save
- **PWA icons** — placeholder 1x1 PNGs in `public/`

---

## Key Decisions

1. **Groups as `isGroup` boolean flag, not a new SceneType** — SceneType drives shape rendering via 1:1 `SCENE_TYPE_CONFIG` mapping, 5 glass gradients, SVG paths. Groups are a structural concept orthogonal to narrative classification. A group node retains its sceneType for visual identity.

2. **No React Flow `parentId`** — RF's `parentId` makes children relative-positioned and clipped to parent bounds, which is too constraining. Instead, groups are managed manually: moving a group moves children by the same delta. This gives full control over group behavior.

3. **Collapsed groups: view-level edge remapping** — When collapsed, `useFlowNodes()` hides children and creates temporary display edges pointing to the group node. Domain `StoryEdge` records are never modified. Internal edges are hidden.

4. **Delete group: two options via context menu** — "Ungroup" removes group node, clears children's `groupId`. "Delete Group + Children" cascade-deletes group and all members.

5. **No nested groups** — Phase 7 scope control. A group cannot be a child of another group.

6. **Attachments as a gallery below the editor, not inline TipTap nodes** — TipTap currently uses `getText()` (plain text storage). Inline images would require switching to JSON serialization or complex content migration. A separate attachment gallery below the TipTap editor is simpler, avoids any content format changes, and better suits the tabletop use case (maps, handouts, reference art). Inline TipTap images can be added in a future phase.

7. **Attachment size warnings** — Per-file soft warning at 2MB, total campaign warning at 50MB. Warnings shown inline, not hard blocks.

8. **`collapsed` persisted on StoryNode** — So collapse state survives save/load. The GM opens a campaign and sees groups as they left them.

---

## Implementation Steps (5 Commits)

### Commit 1: Group domain types + operations

Extend domain types with grouping fields and add pure group operations.

**`src/domain/types.ts`** — add to StoryNode:
```typescript
isGroup?: boolean      // true = collapsible group container
groupId?: string       // parent group node ID (child membership)
collapsed?: boolean    // whether group's children are hidden
```

**New: `src/domain/group-operations.ts`** — pure functions:
- `createGroupNode(sceneType, position, label)` → StoryNode with `isGroup: true`
- `addNodesToGroup(nodes, groupId, nodeIds)` → updated nodes record (validates: no nesting, no already-grouped)
- `removeNodesFromGroup(nodes, nodeIds)` → updated nodes with `groupId` cleared
- `toggleGroupCollapsed(node)` → toggled node
- `getGroupChildren(nodes, groupId)` → StoryNode[]
- `getGroupChildIds(nodes, groupId)` → string[]
- `deleteGroupKeepChildren(nodes, edges, groupId)` → { nodes, edges }
- `deleteGroupWithChildren(nodes, edges, groupId)` → { nodes, edges }
- `isNodeInGroup(node)` → boolean
- `getGroupBoundaryEdges(nodes, edges, groupId)` → edges crossing group boundary
- `getInternalEdges(nodes, edges, groupId)` → edges between children

**`src/domain/graph-operations.ts`** — updates:
- `removeNodes()`: if removing a group, cascade-ungroup children
- `duplicateNodes()`: when duplicating group+children together, remap `groupId` via idMap
- `pasteSubgraph()`: remap `groupId` via idMap
- `extractSubgraph()`: if a group is selected, auto-include its children

**Tests:** ~25 new (group-operations.test.ts + graph-operations group scenarios)

---

### Commit 2: Group store actions + attachment domain operations

Wire group operations into graph store. Add attachment domain operations. Update serialization.

**`src/application/graph-store.ts`** — new actions:
- `createGroup(sceneType, position, label?)` → string (returns group ID)
- `addToGroup(groupId, nodeIds)` → void
- `removeFromGroup(nodeIds)` → void
- `deleteGroup(groupId, cascade: boolean)` → void
- `toggleGroupCollapsed(groupId)` → void
- Update `moveNode`: if moving a group, translate all children by same delta

All actions call `saveHistory()` before mutation.

**New: `src/domain/attachment-operations.ts`** — pure functions:
- `createAttachment(filename, mimeType, dataUrl)` → Attachment
- `validateAttachmentSize(dataUrl)` → { sizeBytes, warning }
- `addAttachment(richContent, attachment)` → RichContent
- `removeAttachment(richContent, attachmentId)` → RichContent
- `getAttachmentById(richContent, attachmentId)` → Attachment | undefined
- `estimateCampaignSize(json)` → { sizeBytes, sizeMB, warning }
- Constants: `ATTACHMENT_SIZE_WARNING_BYTES`, `CAMPAIGN_SIZE_WARNING_BYTES`

**`src/infrastructure/serialization.ts`** — validate `isGroup` (boolean), `groupId` (string), `collapsed` (boolean) if present on nodes

**`src/infrastructure/file-io.ts`** — add `readFileAsDataUrl(file: File): Promise<string>`

**`tests/fixtures/factories.ts`** — add `createTestGroupNode()`, `createTestAttachment()` factories

**Tests:** ~22 new (9 store group actions, 10 attachment operations, 2 serialization, 1 file-io)

---

### Commit 3: Group-aware rendering + context menu

Groups visually render on the canvas. Collapsed groups hide children and reroute edges. Context menu supports group operations.

**`src/ui/graph/use-flow-nodes.ts`** — major update:
- Partition nodes: groups, ungrouped, grouped children
- Collapsed groups: hide children from flow nodes array
- Edge remapping: create temporary display edges for collapsed groups (boundary edges rerouted to group node, internal edges hidden)
- Expanded groups: include children as normal flow nodes
- Group node marked with `type: 'group'` for distinct rendering

**`src/ui/graph/story-node.tsx`** — group rendering additions:
- If `isGroup`: render child count badge, collapse/expand chevron button
- When collapsed: "stacked" visual indicator
- Extract group-specific rendering into helper sub-component

**`src/ui/graph/graph-canvas.tsx`** — register `group` node type in `nodeTypes`, add group-specific drag handler (move children with group), add shared SVG gradient for group nodes

**`src/ui/graph/context-menu.tsx`** — new menu items:
- Multi-select: "Group Selected" → creates group from selection
- Group node: "Ungroup", "Delete Group + Children", "Collapse/Expand"
- Grouped child: "Remove from Group"

**`src/ui/layout/status-bar.tsx`** — show group count

**Tests:** ~8 new (useFlowNodes collapse/expand filtering, edge remapping, move-group-moves-children, status bar)

---

### Commit 4: Attachment gallery UI in field editors + file I/O

Image/file attachments can be added to any RichContent field via a gallery below the TipTap editor.

**New: `src/ui/editor/attachment-gallery.tsx`** — gallery component:
- Renders thumbnails of existing attachments from `RichContent.attachments`
- "Add Image" button opens file picker (`accept="image/*"`)
- Drag-and-drop zone for image files
- Each attachment: thumbnail, filename, size badge, remove button
- Size warning inline when file exceeds 2MB
- Glass-panel styling consistent with existing UI

**`src/ui/overlays/field-editors/rich-content-editor.tsx`** — update:
- Mount `AttachmentGallery` below TipTap editor
- Pass `value.attachments` and `onChange` handler
- `onAttachmentAdd`: creates Attachment via domain ops, validates size, updates RichContent
- `onAttachmentRemove`: removes from attachments array

**`src/ui/overlays/field-editors/custom-field-editor.tsx`** — update:
- Mount `AttachmentGallery` for custom field content (which is RichContent)

**`src/ui/layout/status-bar.tsx`** — show campaign size warning when total JSON exceeds 50MB threshold

**Tests:** ~10 new (attachment gallery renders, add/remove flow, size warning display, campaign size estimation, roundtrip through save/load)

---

### Commit 5: PWA icons + integration tests + docs + polish

Replace placeholder icons. Final integration tests. All docs updated. Plan archived.

**PWA Icons:**
- `scripts/generate-icons.mjs` — Node.js script using `sharp` (devDep) to render SVG → PNG
- `scripts/icon.svg` — source SVG icon (graph-node motif with ProjectFlow branding)
- `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/apple-touch-icon.png` — replaced

**New integration tests:**
- `tests/integration/group-operations.integration.test.ts`:
  - Group relationships survive save/load roundtrip
  - Collapse state persists across save/load
  - Group + clipboard: copy group with children, paste, verify new group
  - Subgraph export includes group, import preserves structure
  - Delete group cascade removes children
  - Delete group ungroup keeps children
- `tests/integration/attachment-roundtrip.integration.test.ts`:
  - Attachment data survives save/load roundtrip
  - Multiple attachments on same field
  - Campaign size estimation with attachments
  - Backward compat: campaign without attachments loads fine

**Docs updates:**
- `docs/architecture.md` — add group-operations.ts, attachment-operations.ts, attachment-gallery.tsx
- `docs/decisions-log.md` — 8 ADRs from this phase
- `docs/changelog.md` — Phase 7 entries
- `docs/wip.md` — update session state, Phase 8 next steps
- `docs/dependencies.md` — document `sharp` (devDep, icon generation only)
- Archive plan to `docs/plans/completed/`

**Tests:** ~15 new (10 integration + 2 PWA icon validity + 3 misc)

---

## Critical Files

| File | Changes |
|------|---------|
| `src/domain/types.ts` | Add `isGroup?`, `groupId?`, `collapsed?` to StoryNode |
| `src/domain/group-operations.ts` | **NEW** — pure group CRUD operations |
| `src/domain/attachment-operations.ts` | **NEW** — pure attachment operations |
| `src/domain/graph-operations.ts` | Group-aware extraction, duplication, paste |
| `src/application/graph-store.ts` | Group store actions, group-aware moveNode |
| `src/ui/graph/use-flow-nodes.ts` | Collapsed group filtering, edge remapping |
| `src/ui/graph/story-node.tsx` | Group visual treatment, collapse/expand UI |
| `src/ui/graph/graph-canvas.tsx` | Group node type, group drag handler |
| `src/ui/graph/context-menu.tsx` | Group menu items |
| `src/ui/editor/attachment-gallery.tsx` | **NEW** — attachment gallery below editor |
| `src/ui/overlays/field-editors/rich-content-editor.tsx` | Mount attachment gallery |
| `src/infrastructure/file-io.ts` | `readFileAsDataUrl()` utility |

## Test Summary

| Commit | New Tests | Running Total |
|--------|-----------|---------------|
| 1. Group domain types + operations | ~25 | ~525 |
| 2. Group store + attachment domain | ~22 | ~547 |
| 3. Group-aware rendering + menu | ~8 | ~555 |
| 4. Attachment gallery UI | ~10 | ~565 |
| 5. PWA icons + integration + docs | ~15 | ~580 |

## Verification

```bash
pnpm build          # No TS errors
pnpm lint           # Clean
pnpm test:ci        # All ~580 tests pass
pnpm dev            # Visual verification
```

Manual checklist:
- Create 3 nodes, multi-select, right-click → "Group Selected" → group node appears
- Collapse group → children hidden, edges reroute to group boundary
- Expand group → children visible again
- Move group → children follow
- "Ungroup" → children remain, group removed
- "Delete Group + Children" → group and children gone
- Save campaign with groups → load → groups preserved, collapse state preserved
- Copy/paste group → new group with children created
- Open any rich content field editor → attachment gallery visible below editor
- Click "Add Image" → file picker → select image → thumbnail appears in gallery
- Drag image onto gallery area → attachment added
- Image >2MB → size warning shown inline
- Remove attachment → deleted from gallery
- Save/load campaign → attachments preserved
- PWA icons are proper branded images (not 1x1 placeholders)
- Dark + light mode: group nodes and attachment gallery render correctly

## Deferred to Future Phase

- Inline TipTap image nodes (requires content format migration to JSON)
- Nested groups (groups containing groups)
- Entity portrait attachment support
- External file references (avoid base64 bloat for very large assets)
