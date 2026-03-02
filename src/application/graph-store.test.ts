import { describe, it, expect, beforeEach } from 'vitest'
import { useGraphStore } from './graph-store'
import { useHistoryStore } from './history-store'

beforeEach(() => {
  useGraphStore.getState().reset()
  useHistoryStore.getState().reset()
})

describe('useGraphStore', () => {
  describe('addNode', () => {
    it('adds a node with correct sceneType', () => {
      const id = useGraphStore.getState().addNode('combat', { x: 100, y: 200 })
      const { nodes } = useGraphStore.getState()
      expect(nodes[id]).toBeDefined()
      expect(nodes[id].sceneType).toBe('combat')
      expect(nodes[id].position).toEqual({ x: 100, y: 200 })
    })

    it('returns the new node id', () => {
      const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })

    it('uses custom label when provided', () => {
      const id = useGraphStore.getState().addNode('narration', { x: 0, y: 0 }, 'Briefing')
      expect(useGraphStore.getState().nodes[id].label).toBe('Briefing')
    })
  })

  describe('deleteNode', () => {
    it('removes the node', () => {
      const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      useGraphStore.getState().deleteNode(id)
      expect(useGraphStore.getState().nodes[id]).toBeUndefined()
    })

    it('removes connected edges', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 })
      const edgeId = useGraphStore.getState().connectNodes(a, b)
      useGraphStore.getState().deleteNode(a)
      expect(useGraphStore.getState().edges[edgeId]).toBeUndefined()
    })

    it('removes deleted node from selectedNodeIds', () => {
      const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      useGraphStore.getState().selectNodes([id])
      useGraphStore.getState().deleteNode(id)
      expect(useGraphStore.getState().selectedNodeIds.has(id)).toBe(false)
    })
  })

  describe('connectNodes', () => {
    it('creates an edge between two nodes', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 })
      const edgeId = useGraphStore.getState().connectNodes(a, b)
      const edge = useGraphStore.getState().edges[edgeId]
      expect(edge.source).toBe(a)
      expect(edge.target).toBe(b)
    })
  })

  describe('disconnectEdge', () => {
    it('removes the edge', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 })
      const edgeId = useGraphStore.getState().connectNodes(a, b)
      useGraphStore.getState().disconnectEdge(edgeId)
      expect(useGraphStore.getState().edges[edgeId]).toBeUndefined()
    })
  })

  describe('moveNode', () => {
    it('updates the node position', () => {
      const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      useGraphStore.getState().moveNode(id, { x: 200, y: 300 })
      expect(useGraphStore.getState().nodes[id].position).toEqual({ x: 200, y: 300 })
    })
  })

  describe('renameNode', () => {
    it('updates the node label', () => {
      const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      useGraphStore.getState().renameNode(id, 'The Ambush')
      expect(useGraphStore.getState().nodes[id].label).toBe('The Ambush')
    })
  })

  describe('changeSceneType', () => {
    it('changes the scene type', () => {
      const id = useGraphStore.getState().addNode('narration', { x: 0, y: 0 })
      useGraphStore.getState().changeSceneType(id, 'combat')
      expect(useGraphStore.getState().nodes[id].sceneType).toBe('combat')
    })
  })

  describe('updateField', () => {
    it('updates a rich content field', () => {
      const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      useGraphStore.getState().updateField(id, 'script', { markdown: 'Read aloud text' })
      expect(useGraphStore.getState().nodes[id].fields.script.markdown).toBe('Read aloud text')
    })
  })

  describe('duplicateNode', () => {
    it('creates a copy with a new id', () => {
      const id = useGraphStore.getState().addNode('combat', { x: 0, y: 0 }, 'Encounter')
      const copyId = useGraphStore.getState().duplicateNode(id)
      expect(copyId).not.toBeNull()
      expect(copyId).not.toBe(id)
      const copy = useGraphStore.getState().nodes[copyId!]
      expect(copy.label).toBe('Encounter (copy)')
      expect(copy.sceneType).toBe('combat')
    })

    it('returns null for non-existent node', () => {
      const result = useGraphStore.getState().duplicateNode('fake-id')
      expect(result).toBeNull()
    })
  })

  describe('selection', () => {
    it('selectNodes sets the selected node ids', () => {
      useGraphStore.getState().selectNodes(['a', 'b'])
      expect(useGraphStore.getState().selectedNodeIds).toEqual(new Set(['a', 'b']))
    })

    it('clearSelection empties the set', () => {
      useGraphStore.getState().selectNodes(['a'])
      useGraphStore.getState().clearSelection()
      expect(useGraphStore.getState().selectedNodeIds.size).toBe(0)
    })

    it('toggleNodeSelection adds a node', () => {
      useGraphStore.getState().toggleNodeSelection('a')
      expect(useGraphStore.getState().selectedNodeIds.has('a')).toBe(true)
    })

    it('toggleNodeSelection removes a node if already selected', () => {
      useGraphStore.getState().selectNodes(['a', 'b'])
      useGraphStore.getState().toggleNodeSelection('a')
      expect(useGraphStore.getState().selectedNodeIds.has('a')).toBe(false)
      expect(useGraphStore.getState().selectedNodeIds.has('b')).toBe(true)
    })
  })

  describe('deleteSelectedNodes', () => {
    it('removes all selected nodes', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 })
      const c = useGraphStore.getState().addNode('combat', { x: 200, y: 0 })
      useGraphStore.getState().selectNodes([a, b])
      useGraphStore.getState().deleteSelectedNodes()
      expect(useGraphStore.getState().nodes[a]).toBeUndefined()
      expect(useGraphStore.getState().nodes[b]).toBeUndefined()
      expect(useGraphStore.getState().nodes[c]).toBeDefined()
      expect(useGraphStore.getState().selectedNodeIds.size).toBe(0)
    })

    it('removes edges between deleted nodes', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 })
      const c = useGraphStore.getState().addNode('combat', { x: 200, y: 0 })
      useGraphStore.getState().connectNodes(a, b)
      const edgeBc = useGraphStore.getState().connectNodes(b, c)
      useGraphStore.getState().selectNodes([a, b])
      useGraphStore.getState().deleteSelectedNodes()
      expect(Object.keys(useGraphStore.getState().edges)).toHaveLength(0)
      expect(useGraphStore.getState().edges[edgeBc]).toBeUndefined()
    })

    it('is a no-op with empty selection', () => {
      useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      useGraphStore.getState().deleteSelectedNodes()
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(1)
    })
  })

  describe('duplicateSelectedNodes', () => {
    it('duplicates selected nodes and selects copies', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 }, 'A')
      const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 }, 'B')
      useGraphStore.getState().selectNodes([a, b])
      const newIds = useGraphStore.getState().duplicateSelectedNodes()
      expect(newIds).toHaveLength(2)
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(4)
      // Selection should be the new copies
      expect(useGraphStore.getState().selectedNodeIds).toEqual(new Set(newIds))
    })

    it('duplicates interconnecting edges', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 })
      useGraphStore.getState().connectNodes(a, b)
      useGraphStore.getState().selectNodes([a, b])
      useGraphStore.getState().duplicateSelectedNodes()
      // Original edge + duplicated edge
      expect(Object.keys(useGraphStore.getState().edges)).toHaveLength(2)
    })

    it('returns empty array with no selection', () => {
      const result = useGraphStore.getState().duplicateSelectedNodes()
      expect(result).toEqual([])
    })
  })

  describe('clipboard', () => {
    it('copySelectedNodes stores nodes and edges', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 })
      useGraphStore.getState().connectNodes(a, b)
      useGraphStore.getState().selectNodes([a, b])
      useGraphStore.getState().copySelectedNodes()
      const clipboard = useGraphStore.getState().clipboard
      expect(clipboard).not.toBeNull()
      expect(clipboard!.nodes).toHaveLength(2)
      expect(clipboard!.edges).toHaveLength(1)
    })

    it('cutSelectedNodes copies then deletes', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 })
      useGraphStore.getState().selectNodes([a, b])
      useGraphStore.getState().cutSelectedNodes()
      expect(useGraphStore.getState().clipboard).not.toBeNull()
      expect(useGraphStore.getState().clipboard!.nodes).toHaveLength(2)
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(0)
    })

    it('pasteClipboard creates new nodes with new IDs', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 }, 'A')
      useGraphStore.getState().selectNodes([a])
      useGraphStore.getState().copySelectedNodes()
      useGraphStore.getState().pasteClipboard()
      const allNodes = Object.values(useGraphStore.getState().nodes)
      expect(allNodes).toHaveLength(2)
      const ids = allNodes.map((n) => n.id)
      expect(new Set(ids).size).toBe(2) // unique IDs
    })

    it('pasteClipboard preserves internal edges', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 })
      useGraphStore.getState().connectNodes(a, b)
      useGraphStore.getState().selectNodes([a, b])
      useGraphStore.getState().copySelectedNodes()
      useGraphStore.getState().pasteClipboard()
      // 2 original + 2 pasted nodes, 1 original + 1 pasted edge
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(4)
      expect(Object.keys(useGraphStore.getState().edges)).toHaveLength(2)
    })

    it('pasteClipboard selects pasted nodes', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      useGraphStore.getState().selectNodes([a])
      useGraphStore.getState().copySelectedNodes()
      useGraphStore.getState().pasteClipboard()
      const selected = useGraphStore.getState().selectedNodeIds
      expect(selected.size).toBe(1)
      expect(selected.has(a)).toBe(false) // pasted node has new ID
    })

    it('pasteClipboard is a no-op with empty clipboard', () => {
      useGraphStore.getState().pasteClipboard()
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(0)
    })

    it('copySelectedNodes is a no-op with empty selection', () => {
      useGraphStore.getState().copySelectedNodes()
      expect(useGraphStore.getState().clipboard).toBeNull()
    })

    it('clipboard survives selection change', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      useGraphStore.getState().selectNodes([a])
      useGraphStore.getState().copySelectedNodes()
      useGraphStore.getState().clearSelection()
      expect(useGraphStore.getState().clipboard).not.toBeNull()
    })
  })

  describe('setEdgeStyle', () => {
    it('changes edge style', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 })
      const edgeId = useGraphStore.getState().connectNodes(a, b)
      useGraphStore.getState().setEdgeStyle(edgeId, 'conditional')
      expect(useGraphStore.getState().edges[edgeId].style).toBe('conditional')
    })

    it('is a no-op for missing edge', () => {
      useGraphStore.getState().setEdgeStyle('fake', 'secret')
      expect(Object.keys(useGraphStore.getState().edges)).toHaveLength(0)
    })
  })

  describe('setEdgeLabel', () => {
    it('sets edge label', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 })
      const edgeId = useGraphStore.getState().connectNodes(a, b)
      useGraphStore.getState().setEdgeLabel(edgeId, 'if players agree')
      expect(useGraphStore.getState().edges[edgeId].label).toBe('if players agree')
    })

    it('clears edge label with undefined', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 })
      const edgeId = useGraphStore.getState().connectNodes(a, b, 'test')
      useGraphStore.getState().setEdgeLabel(edgeId, undefined)
      expect(useGraphStore.getState().edges[edgeId].label).toBeUndefined()
    })
  })

  describe('setArcLabel', () => {
    it('sets arc label on a node', () => {
      const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      useGraphStore.getState().setArcLabel(id, 'MISSION 3')
      expect(useGraphStore.getState().nodes[id].arcLabel).toBe('MISSION 3')
    })

    it('clears arc label with empty string', () => {
      const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      useGraphStore.getState().setArcLabel(id, 'ARC 1')
      useGraphStore.getState().setArcLabel(id, '')
      expect(useGraphStore.getState().nodes[id].arcLabel).toBeUndefined()
    })
  })

  describe('rewireEdge', () => {
    it('changes the source of an edge', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 })
      const c = useGraphStore.getState().addNode('combat', { x: 200, y: 0 })
      const edgeId = useGraphStore.getState().connectNodes(a, b)
      useGraphStore.getState().rewireEdge(edgeId, c)
      expect(useGraphStore.getState().edges[edgeId].source).toBe(c)
      expect(useGraphStore.getState().edges[edgeId].target).toBe(b)
    })

    it('changes the target of an edge', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 })
      const c = useGraphStore.getState().addNode('combat', { x: 200, y: 0 })
      const edgeId = useGraphStore.getState().connectNodes(a, b)
      useGraphStore.getState().rewireEdge(edgeId, undefined, c)
      expect(useGraphStore.getState().edges[edgeId].source).toBe(a)
      expect(useGraphStore.getState().edges[edgeId].target).toBe(c)
    })
  })

  describe('setScrollDirection', () => {
    it('changes scroll direction', () => {
      useGraphStore.getState().setScrollDirection('vertical')
      expect(useGraphStore.getState().scrollDirection).toBe('vertical')
    })
  })

  describe('loadGraph', () => {
    it('replaces all graph state', () => {
      useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      useGraphStore.getState().loadGraph(
        {},
        {},
        { x: 100, y: 200, zoom: 2 },
        'vertical',
      )
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(0)
      expect(useGraphStore.getState().viewport).toEqual({ x: 100, y: 200, zoom: 2 })
      expect(useGraphStore.getState().scrollDirection).toBe('vertical')
    })
  })

  describe('setPlaythroughStatus', () => {
    it('sets playthrough status on a node', () => {
      const id = useGraphStore.getState().addNode('combat', { x: 0, y: 0 })
      useGraphStore.getState().setPlaythroughStatus(id, 'played_as_planned')
      expect(useGraphStore.getState().nodes[id].playthroughStatus).toBe('played_as_planned')
    })

    it('sets notes when status is modified', () => {
      const id = useGraphStore.getState().addNode('combat', { x: 0, y: 0 })
      useGraphStore.getState().setPlaythroughStatus(id, 'modified', 'Team split up')
      const node = useGraphStore.getState().nodes[id]
      expect(node.playthroughStatus).toBe('modified')
      expect(node.playthroughNotes).toBe('Team split up')
    })

    it('is a no-op for missing node', () => {
      useGraphStore.getState().setPlaythroughStatus('nonexistent', 'skipped')
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(0)
    })
  })

  describe('clearPlaythroughStatus', () => {
    it('clears playthrough status and notes', () => {
      const id = useGraphStore.getState().addNode('combat', { x: 0, y: 0 })
      useGraphStore.getState().setPlaythroughStatus(id, 'modified', 'Note')
      useGraphStore.getState().clearPlaythroughStatus(id)
      const node = useGraphStore.getState().nodes[id]
      expect(node.playthroughStatus).toBeUndefined()
      expect(node.playthroughNotes).toBeUndefined()
    })
  })

  describe('reset', () => {
    it('clears all state', () => {
      useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      useGraphStore.getState().selectNodes(['some-id'])
      useGraphStore.getState().reset()
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(0)
      expect(useGraphStore.getState().selectedNodeIds.size).toBe(0)
    })
  })

  describe('undo / redo', () => {
    it('undo restores previous state after addNode', () => {
      const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(1)
      useGraphStore.getState().undo()
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(0)
      expect(useGraphStore.getState().nodes[id]).toBeUndefined()
    })

    it('redo re-applies undone state', () => {
      const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      useGraphStore.getState().undo()
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(0)
      useGraphStore.getState().redo()
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(1)
      expect(useGraphStore.getState().nodes[id]).toBeDefined()
    })

    it('undo after deleteNode restores the node', () => {
      const id = useGraphStore.getState().addNode('event', { x: 10, y: 20 }, 'Test')
      useGraphStore.getState().deleteNode(id)
      expect(useGraphStore.getState().nodes[id]).toBeUndefined()
      useGraphStore.getState().undo()
      // undoes the delete — node is back
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(1)
    })

    it('undo after deleteNode restores connected edges', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 })
      const edgeId = useGraphStore.getState().connectNodes(a, b)
      useGraphStore.getState().deleteNode(a)
      useGraphStore.getState().undo()
      // undoes the delete — node + edge are back
      expect(useGraphStore.getState().edges[edgeId]).toBeDefined()
    })

    it('undo is a no-op when history is empty', () => {
      const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      // Clear history so undo has nothing to work with
      useHistoryStore.getState().clear()
      useGraphStore.getState().undo()
      expect(useGraphStore.getState().nodes[id]).toBeDefined()
    })

    it('redo is a no-op when future is empty', () => {
      useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      useGraphStore.getState().redo()
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(1)
    })

    it('new mutation clears redo stack', () => {
      useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      useGraphStore.getState().addNode('narration', { x: 100, y: 0 })
      useGraphStore.getState().undo()
      expect(useHistoryStore.getState().canRedo()).toBe(true)
      // New mutation clears future
      useGraphStore.getState().addNode('combat', { x: 200, y: 0 })
      expect(useHistoryStore.getState().canRedo()).toBe(false)
    })

    it('undo clears selection', () => {
      const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      useGraphStore.getState().selectNodes([id])
      useGraphStore.getState().undo()
      expect(useGraphStore.getState().selectedNodeIds.size).toBe(0)
    })

    it('multiple undo then redo roundtrip', () => {
      useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      useGraphStore.getState().addNode('narration', { x: 100, y: 0 })
      useGraphStore.getState().addNode('combat', { x: 200, y: 0 })
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(3)

      useGraphStore.getState().undo()
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(2)
      useGraphStore.getState().undo()
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(1)
      useGraphStore.getState().redo()
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(2)
      useGraphStore.getState().redo()
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(3)
    })

    it('pushHistory saves a snapshot without mutation', () => {
      useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      // pushHistory adds one more entry (2 total: initial add + manual push)
      useGraphStore.getState().pushHistory()
      useGraphStore.getState().moveNode(
        Object.keys(useGraphStore.getState().nodes)[0],
        { x: 500, y: 500 },
      )
      // Undo should restore pre-move state
      useGraphStore.getState().undo()
      const node = Object.values(useGraphStore.getState().nodes)[0]
      expect(node.position).toEqual({ x: 0, y: 0 })
    })

    it('mutating actions save history automatically', () => {
      expect(useHistoryStore.getState().past).toHaveLength(0)
      useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      expect(useHistoryStore.getState().past).toHaveLength(1)
      const id = Object.keys(useGraphStore.getState().nodes)[0]
      useGraphStore.getState().renameNode(id, 'New Name')
      expect(useHistoryStore.getState().past).toHaveLength(2)
    })

    it('moveNode does not save history automatically', () => {
      const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      const historyBefore = useHistoryStore.getState().past.length
      useGraphStore.getState().moveNode(id, { x: 100, y: 100 })
      expect(useHistoryStore.getState().past).toHaveLength(historyBefore)
    })
  })
})
