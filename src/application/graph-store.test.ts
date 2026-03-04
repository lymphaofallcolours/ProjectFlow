import { describe, it, expect, beforeEach } from 'vitest'
import { useGraphStore } from './graph-store'
import { useHistoryStore } from './history-store'
import { useUIStore } from './ui-store'
import { createNode as domainCreateNode, createEdge as domainCreateEdge } from '@/domain/graph-operations'

beforeEach(() => {
  useGraphStore.getState().reset()
  useHistoryStore.getState().reset()
  useUIStore.getState().hideRadialSubnodes()
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

    it('clears radialNodeId when deleting the active radial node', () => {
      const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      useUIStore.getState().showRadialSubnodes(id)
      expect(useUIStore.getState().radialNodeId).toBe(id)
      useGraphStore.getState().deleteNode(id)
      expect(useUIStore.getState().radialNodeId).toBeNull()
    })

    it('preserves radialNodeId when deleting a different node', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 })
      useUIStore.getState().showRadialSubnodes(a)
      useGraphStore.getState().deleteNode(b)
      expect(useUIStore.getState().radialNodeId).toBe(a)
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

  describe('moveNodes', () => {
    it('updates multiple node positions atomically', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      const b = useGraphStore.getState().addNode('narration', { x: 100, y: 100 })
      useGraphStore.getState().moveNodes({
        [a]: { x: 50, y: 50 },
        [b]: { x: 200, y: 200 },
      })
      expect(useGraphStore.getState().nodes[a].position).toEqual({ x: 50, y: 50 })
      expect(useGraphStore.getState().nodes[b].position).toEqual({ x: 200, y: 200 })
    })

    it('moves group children when moving a group', () => {
      const gid = useGraphStore.getState().createGroup('event', { x: 0, y: 0 })
      const nid = useGraphStore.getState().addNode('narration', { x: 50, y: 100 })
      useGraphStore.getState().addToGroup(gid, [nid])
      useGraphStore.getState().moveNodes({ [gid]: { x: 100, y: 200 } })
      expect(useGraphStore.getState().nodes[gid].position).toEqual({ x: 100, y: 200 })
      expect(useGraphStore.getState().nodes[nid].position).toEqual({ x: 150, y: 300 })
    })

    it('skips non-existent node IDs', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      useGraphStore.getState().moveNodes({
        [a]: { x: 50, y: 50 },
        'nonexistent': { x: 999, y: 999 },
      })
      expect(useGraphStore.getState().nodes[a].position).toEqual({ x: 50, y: 50 })
    })

    it('does not save history automatically', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      useHistoryStore.getState().reset()
      useGraphStore.getState().moveNodes({ [a]: { x: 100, y: 100 } })
      expect(useHistoryStore.getState().past).toHaveLength(0)
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

    it('clears radialNodeId when selection contains radial target', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 })
      useUIStore.getState().showRadialSubnodes(a)
      useGraphStore.getState().selectNodes([a, b])
      useGraphStore.getState().deleteSelectedNodes()
      expect(useUIStore.getState().radialNodeId).toBeNull()
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

    it('transposes node positions when direction changes', () => {
      const store = useGraphStore.getState()
      store.addNode('event', { x: 0, y: 100 })
      store.addNode('narration', { x: 200, y: 100 })
      const nodesBefore = Object.values(useGraphStore.getState().nodes)
      expect(nodesBefore).toHaveLength(2)

      store.setScrollDirection('vertical')
      const nodesAfter = Object.values(useGraphStore.getState().nodes)

      // Positions should have changed (X/Y swapped relative to centroid)
      const posBefore = nodesBefore.map((n) => n.position).sort((a, b) => a.x - b.x)
      const posAfter = nodesAfter.map((n) => n.position).sort((a, b) => a.x - b.x)
      expect(posAfter).not.toEqual(posBefore)
    })

    it('does not transpose when setting same direction', () => {
      const store = useGraphStore.getState()
      store.addNode('event', { x: 50, y: 80 })
      const posBefore = Object.values(useGraphStore.getState().nodes)[0].position

      store.setScrollDirection('horizontal') // same as default
      const posAfter = Object.values(useGraphStore.getState().nodes)[0].position

      expect(posAfter).toEqual(posBefore)
    })

    it('pushes history before transposing', () => {
      const store = useGraphStore.getState()
      store.addNode('event', { x: 0, y: 0 })
      store.setScrollDirection('vertical')

      // Should be able to undo the transpose
      const { past } = useHistoryStore.getState()
      expect(past.length).toBeGreaterThan(0)
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

  describe('importSubgraph', () => {
    it('imports nodes with new IDs at offset position', () => {
      const node = domainCreateNode('event', { x: 0, y: 0 }, 'Imported')

      useGraphStore.getState().importSubgraph([node], [])
      const nodes = Object.values(useGraphStore.getState().nodes)
      expect(nodes).toHaveLength(1)
      // New IDs — not the original
      expect(nodes[0].id).not.toBe(node.id)
      expect(nodes[0].label).toBe('Imported')
      // Offset by 50,50
      expect(nodes[0].position.x).toBe(50)
      expect(nodes[0].position.y).toBe(50)
    })

    it('imports edges with remapped IDs', () => {
      const a = domainCreateNode('event', { x: 0, y: 0 }, 'A')
      const b = domainCreateNode('narration', { x: 100, y: 0 }, 'B')
      const edge = domainCreateEdge(a.id, b.id)

      useGraphStore.getState().importSubgraph([a, b], [edge])
      const edges = Object.values(useGraphStore.getState().edges)
      expect(edges).toHaveLength(1)
      // Edge should connect the new (remapped) node IDs
      const newNodes = Object.values(useGraphStore.getState().nodes)
      expect(edges[0].source).toBe(newNodes.find(n => n.label === 'A')!.id)
      expect(edges[0].target).toBe(newNodes.find(n => n.label === 'B')!.id)
    })

    it('selects imported nodes', () => {
      const a = domainCreateNode('event', { x: 0, y: 0 }, 'A')
      const b = domainCreateNode('narration', { x: 100, y: 0 }, 'B')

      useGraphStore.getState().importSubgraph([a, b], [])
      expect(useGraphStore.getState().selectedNodeIds.size).toBe(2)
    })

    it('pushes history before import', () => {
      useGraphStore.getState().addNode('combat', { x: 0, y: 0 })
      const historyBefore = useHistoryStore.getState().past.length

      const node = domainCreateNode('event', { x: 0, y: 0 })
      useGraphStore.getState().importSubgraph([node], [])
      expect(useHistoryStore.getState().past.length).toBe(historyBefore + 1)
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

  describe('createGroup', () => {
    it('creates a group node with isGroup true', () => {
      const gid = useGraphStore.getState().createGroup('event', { x: 0, y: 0 }, 'Act 1')
      const group = useGraphStore.getState().nodes[gid]
      expect(group.isGroup).toBe(true)
      expect(group.label).toBe('Act 1')
    })

    it('saves history before creation', () => {
      const before = useHistoryStore.getState().past.length
      useGraphStore.getState().createGroup('combat', { x: 0, y: 0 })
      expect(useHistoryStore.getState().past.length).toBe(before + 1)
    })
  })

  describe('addToGroup', () => {
    it('sets groupId on specified nodes', () => {
      const gid = useGraphStore.getState().createGroup('event', { x: 0, y: 0 })
      const nid = useGraphStore.getState().addNode('narration', { x: 50, y: 50 })
      useGraphStore.getState().addToGroup(gid, [nid])
      expect(useGraphStore.getState().nodes[nid].groupId).toBe(gid)
    })
  })

  describe('removeFromGroup', () => {
    it('clears groupId on specified nodes', () => {
      const gid = useGraphStore.getState().createGroup('event', { x: 0, y: 0 })
      const nid = useGraphStore.getState().addNode('narration', { x: 50, y: 50 })
      useGraphStore.getState().addToGroup(gid, [nid])
      useGraphStore.getState().removeFromGroup([nid])
      expect(useGraphStore.getState().nodes[nid].groupId).toBeUndefined()
    })
  })

  describe('deleteGroup', () => {
    it('ungroups children when cascade is false', () => {
      const gid = useGraphStore.getState().createGroup('event', { x: 0, y: 0 })
      const nid = useGraphStore.getState().addNode('narration', { x: 50, y: 50 })
      useGraphStore.getState().addToGroup(gid, [nid])
      useGraphStore.getState().deleteGroup(gid, false)
      expect(useGraphStore.getState().nodes[gid]).toBeUndefined()
      expect(useGraphStore.getState().nodes[nid]).toBeDefined()
      expect(useGraphStore.getState().nodes[nid].groupId).toBeUndefined()
    })

    it('deletes children when cascade is true', () => {
      const gid = useGraphStore.getState().createGroup('event', { x: 0, y: 0 })
      const nid = useGraphStore.getState().addNode('narration', { x: 50, y: 50 })
      useGraphStore.getState().addToGroup(gid, [nid])
      useGraphStore.getState().deleteGroup(gid, true)
      expect(useGraphStore.getState().nodes[gid]).toBeUndefined()
      expect(useGraphStore.getState().nodes[nid]).toBeUndefined()
    })

    it('is a no-op for missing group', () => {
      useGraphStore.getState().deleteGroup('nonexistent', false)
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(0)
    })
  })

  describe('toggleGroupCollapsed', () => {
    it('toggles collapsed state on a group', () => {
      const gid = useGraphStore.getState().createGroup('event', { x: 0, y: 0 })
      expect(useGraphStore.getState().nodes[gid].collapsed).toBeUndefined()
      useGraphStore.getState().toggleGroupCollapsed(gid)
      expect(useGraphStore.getState().nodes[gid].collapsed).toBe(true)
      useGraphStore.getState().toggleGroupCollapsed(gid)
      expect(useGraphStore.getState().nodes[gid].collapsed).toBe(false)
    })

    it('is a no-op for non-group node', () => {
      const nid = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      useGraphStore.getState().toggleGroupCollapsed(nid)
      expect(useGraphStore.getState().nodes[nid].collapsed).toBeUndefined()
    })
  })

  describe('moveNode with group', () => {
    it('moves children when moving a group', () => {
      const gid = useGraphStore.getState().createGroup('event', { x: 0, y: 0 })
      const nid = useGraphStore.getState().addNode('narration', { x: 50, y: 100 })
      useGraphStore.getState().addToGroup(gid, [nid])
      useGraphStore.getState().moveNode(gid, { x: 100, y: 200 })
      expect(useGraphStore.getState().nodes[gid].position).toEqual({ x: 100, y: 200 })
      expect(useGraphStore.getState().nodes[nid].position).toEqual({ x: 150, y: 300 })
    })
  })

  describe('setNodeTags', () => {
    it('sets tags on a node', () => {
      const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      useGraphStore.getState().setNodeTags(id, ['quest', 'main'])
      expect(useGraphStore.getState().nodes[id].metadata.tags).toEqual(['quest', 'main'])
    })

    it('saves history before updating', () => {
      const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      useHistoryStore.getState().reset()
      useGraphStore.getState().setNodeTags(id, ['tag1'])
      expect(useHistoryStore.getState().past.length).toBe(1)
    })

    it('ignores non-existent node', () => {
      useGraphStore.getState().setNodeTags('nope', ['tag'])
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(0)
    })

    it('replaces existing tags immutably', () => {
      const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      useGraphStore.getState().setNodeTags(id, ['a'])
      const before = useGraphStore.getState().nodes[id]
      useGraphStore.getState().setNodeTags(id, ['b'])
      const after = useGraphStore.getState().nodes[id]
      expect(before.metadata.tags).toEqual(['a'])
      expect(after.metadata.tags).toEqual(['b'])
    })
  })
})
