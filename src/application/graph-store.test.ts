import { describe, it, expect, beforeEach } from 'vitest'
import { useGraphStore } from './graph-store'

beforeEach(() => {
  useGraphStore.getState().reset()
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

    it('clears selectedNodeId if deleted node was selected', () => {
      const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      useGraphStore.getState().selectNode(id)
      useGraphStore.getState().deleteNode(id)
      expect(useGraphStore.getState().selectedNodeId).toBeNull()
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

  describe('selectNode', () => {
    it('sets the selected node id', () => {
      useGraphStore.getState().selectNode('node-1')
      expect(useGraphStore.getState().selectedNodeId).toBe('node-1')
    })

    it('clears selection with null', () => {
      useGraphStore.getState().selectNode('node-1')
      useGraphStore.getState().selectNode(null)
      expect(useGraphStore.getState().selectedNodeId).toBeNull()
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
      useGraphStore.getState().selectNode('some-id')
      useGraphStore.getState().reset()
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(0)
      expect(useGraphStore.getState().selectedNodeId).toBeNull()
    })
  })
})
