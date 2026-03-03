import { describe, it, expect, beforeEach } from 'vitest'
import { useGraphStore } from '@/application/graph-store'
import { useHistoryStore } from '@/application/history-store'
import { useCampaignStore } from '@/application/campaign-store'
import { useEntityStore } from '@/application/entity-store'
import { useSessionStore } from '@/application/session-store'
import {
  assembleCampaign,
  hydrateCampaign,
  newCampaignAction,
} from '@/application/campaign-actions'
import { serializeCampaign, deserializeCampaign } from '@/infrastructure/serialization'
import { MAX_HISTORY_SIZE } from '@/domain/history-operations'
import { serializeSubgraph, deserializeSubgraph, validateSubgraphFile } from '@/domain/subgraph-operations'
import { exportEntityRegistryAsMarkdown } from '@/domain/entity-operations'
import { useUIStore } from '@/application/ui-store'

describe('Graph operations integration', () => {
  beforeEach(() => {
    useGraphStore.getState().reset()
    useHistoryStore.getState().reset()
    useCampaignStore.getState().reset()
    useEntityStore.getState().reset()
    useSessionStore.getState().reset()
  })

  describe('multi-select + clipboard', () => {
    it('copy + paste preserves internal edges', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 }, 'A')
      const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 }, 'B')
      const c = useGraphStore.getState().addNode('combat', { x: 200, y: 0 }, 'C')
      useGraphStore.getState().connectNodes(a, b)
      useGraphStore.getState().connectNodes(b, c)

      // Select A and B (edge A→B is internal, B→C is external)
      useGraphStore.getState().selectNodes([a, b])
      useGraphStore.getState().copySelectedNodes()
      useGraphStore.getState().pasteClipboard()

      // 3 originals + 2 pasted = 5 nodes
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(5)
      // 2 original edges + 1 pasted (A→B copy only, B→C not internal)
      expect(Object.keys(useGraphStore.getState().edges)).toHaveLength(3)
    })

    it('cut removes originals, paste creates copies with new IDs', () => {
      const store = useGraphStore.getState()
      const a = store.addNode('event', { x: 0, y: 0 }, 'A')
      const b = store.addNode('narration', { x: 100, y: 0 }, 'B')
      store.connectNodes(a, b)

      store.selectNodes([a, b])
      store.cutSelectedNodes()

      // Originals removed
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(0)
      expect(Object.keys(useGraphStore.getState().edges)).toHaveLength(0)

      // Paste
      useGraphStore.getState().pasteClipboard()
      const pastedNodes = Object.values(useGraphStore.getState().nodes)
      expect(pastedNodes).toHaveLength(2)
      // New IDs
      expect(pastedNodes.some((n) => n.id === a)).toBe(false)
      expect(pastedNodes.some((n) => n.id === b)).toBe(false)
      // Edge reconnected between pasted nodes
      expect(Object.keys(useGraphStore.getState().edges)).toHaveLength(1)
    })

    it('clipboard survives selection change', () => {
      const store = useGraphStore.getState()
      const a = store.addNode('event', { x: 0, y: 0 })
      store.selectNodes([a])
      store.copySelectedNodes()
      store.clearSelection()
      // Clipboard still exists
      expect(useGraphStore.getState().clipboard).not.toBeNull()
      // Paste still works
      useGraphStore.getState().pasteClipboard()
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(2)
    })
  })

  describe('undo / redo', () => {
    it('undo after delete restores nodes and edges', () => {
      const store = useGraphStore.getState()
      const a = store.addNode('event', { x: 0, y: 0 }, 'A')
      const b = store.addNode('narration', { x: 100, y: 0 }, 'B')
      store.connectNodes(a, b)

      store.selectNodes([a, b])
      store.deleteSelectedNodes()
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(0)

      useGraphStore.getState().undo()
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(2)
      expect(Object.keys(useGraphStore.getState().edges)).toHaveLength(1)
    })

    it('undo after paste removes pasted nodes, redo re-applies', () => {
      const store = useGraphStore.getState()
      const a = store.addNode('event', { x: 0, y: 0 })
      store.selectNodes([a])
      store.copySelectedNodes()
      store.pasteClipboard()
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(2)

      useGraphStore.getState().undo()
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(1)

      useGraphStore.getState().redo()
      expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(2)
    })

    it('history clears on campaign load', () => {
      const store = useGraphStore.getState()
      store.addNode('event', { x: 0, y: 0 })
      store.addNode('narration', { x: 100, y: 0 })
      expect(useHistoryStore.getState().canUndo()).toBe(true)

      useCampaignStore.getState().setName('Test')
      const campaign = assembleCampaign()
      const json = serializeCampaign(campaign)
      hydrateCampaign(deserializeCampaign(json))

      expect(useHistoryStore.getState().canUndo()).toBe(false)
      expect(useHistoryStore.getState().canRedo()).toBe(false)
    })

    it('history caps at MAX_HISTORY_SIZE', () => {
      for (let i = 0; i < MAX_HISTORY_SIZE + 10; i++) {
        useGraphStore.getState().addNode('event', { x: i * 10, y: 0 })
      }
      expect(useHistoryStore.getState().past.length).toBeLessThanOrEqual(MAX_HISTORY_SIZE)
    })

    it('new campaign action resets history', () => {
      useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      expect(useHistoryStore.getState().canUndo()).toBe(true)

      newCampaignAction('Fresh Start')

      expect(useHistoryStore.getState().canUndo()).toBe(false)
      expect(useHistoryStore.getState().canRedo()).toBe(false)
    })
  })

  describe('edge style + arc label persistence', () => {
    it('edge style persists through save/load', () => {
      const store = useGraphStore.getState()
      const a = store.addNode('event', { x: 0, y: 0 })
      const b = store.addNode('narration', { x: 100, y: 0 })
      const edgeId = store.connectNodes(a, b)
      store.setEdgeStyle(edgeId, 'conditional')

      useCampaignStore.getState().setName('Style Test')
      const json = serializeCampaign(assembleCampaign())

      useGraphStore.getState().reset()
      hydrateCampaign(deserializeCampaign(json))

      expect(useGraphStore.getState().edges[edgeId].style).toBe('conditional')
    })

    it('arc label persists through save/load', () => {
      const store = useGraphStore.getState()
      const id = store.addNode('event', { x: 0, y: 0 }, 'Mission Start')
      store.setArcLabel(id, 'MISSION 3')

      useCampaignStore.getState().setName('Arc Test')
      const json = serializeCampaign(assembleCampaign())

      useGraphStore.getState().reset()
      hydrateCampaign(deserializeCampaign(json))

      expect(useGraphStore.getState().nodes[id].arcLabel).toBe('MISSION 3')
    })
  })

  describe('edge label persistence', () => {
    it('edge label persists through save/load', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 })
      const edgeId = useGraphStore.getState().connectNodes(a, b)
      useGraphStore.getState().setEdgeLabel(edgeId, 'if players agree')

      useCampaignStore.getState().setName('Label Test')
      const json = serializeCampaign(assembleCampaign())

      useGraphStore.getState().reset()
      hydrateCampaign(deserializeCampaign(json))

      expect(useGraphStore.getState().edges[edgeId].label).toBe('if players agree')
    })

    it('clearing edge label persists as undefined', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 })
      const edgeId = useGraphStore.getState().connectNodes(a, b)
      useGraphStore.getState().setEdgeLabel(edgeId, 'some label')
      useGraphStore.getState().setEdgeLabel(edgeId, undefined)

      useCampaignStore.getState().setName('Clear Label Test')
      const json = serializeCampaign(assembleCampaign())

      useGraphStore.getState().reset()
      hydrateCampaign(deserializeCampaign(json))

      expect(useGraphStore.getState().edges[edgeId].label).toBeUndefined()
    })
  })

  describe('edge style + undo interaction', () => {
    it('undo reverts edge style change', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 })
      const edgeId = useGraphStore.getState().connectNodes(a, b)

      useGraphStore.getState().setEdgeStyle(edgeId, 'secret')
      expect(useGraphStore.getState().edges[edgeId].style).toBe('secret')

      useGraphStore.getState().undo()
      expect(useGraphStore.getState().edges[edgeId].style).toBe('default')
    })

    it('undo reverts arc label change', () => {
      const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      useGraphStore.getState().setArcLabel(id, 'ARC 5')
      expect(useGraphStore.getState().nodes[id].arcLabel).toBe('ARC 5')

      useGraphStore.getState().undo()
      expect(useGraphStore.getState().nodes[id].arcLabel).toBeUndefined()
    })
  })

  describe('subgraph export/import', () => {
    it('subgraph export + import preserves nodes and edges with new IDs', () => {
      const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 }, 'A')
      const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 }, 'B')
      const edgeId = useGraphStore.getState().connectNodes(a, b)

      // Select both and extract subgraph
      const { nodes, edges } = useGraphStore.getState()
      const json = serializeSubgraph(nodes, edges, [a, b])

      // Load into a fresh campaign
      newCampaignAction('Import Target')
      const { nodes: importedNodes, edges: importedEdges } = deserializeSubgraph(json)
      useGraphStore.getState().importSubgraph(importedNodes, importedEdges)

      const newNodes = Object.values(useGraphStore.getState().nodes)
      const newEdges = Object.values(useGraphStore.getState().edges)
      expect(newNodes).toHaveLength(2)
      expect(newEdges).toHaveLength(1)
      // IDs are different from originals
      expect(newNodes.some((n) => n.id === a)).toBe(false)
      expect(newNodes.some((n) => n.id === b)).toBe(false)
      expect(newEdges[0].id).not.toBe(edgeId)
    })

    it('subgraph file format validates correctly', () => {
      expect(validateSubgraphFile({ format: 'projectflow-subgraph', version: 1, nodes: [], edges: [] })).toBe(true)
      expect(validateSubgraphFile({ format: 'wrong', version: 1, nodes: [], edges: [] })).toBe(false)
      expect(validateSubgraphFile(null)).toBe(false)
    })

    it('imported nodes survive save/load roundtrip', () => {
      // Create and import a subgraph
      const a = useGraphStore.getState().addNode('combat', { x: 0, y: 0 }, 'Original')
      const state = useGraphStore.getState()
      const json = serializeSubgraph(state.nodes, state.edges, [a])
      const { nodes, edges } = deserializeSubgraph(json)

      // Import adds a copy alongside the original
      useGraphStore.getState().importSubgraph(nodes, edges)
      expect(Object.values(useGraphStore.getState().nodes)).toHaveLength(2)

      // Save and reload
      useCampaignStore.getState().setName('Import Persist')
      const campaignJson = serializeCampaign(assembleCampaign())
      hydrateCampaign(deserializeCampaign(campaignJson))

      const reloadedNodes = Object.values(useGraphStore.getState().nodes)
      expect(reloadedNodes).toHaveLength(2)
      expect(reloadedNodes.every((n) => n.sceneType === 'combat')).toBe(true)
    })
  })

  describe('auto-save state', () => {
    it('auto-save toggle persists in UI state', () => {
      expect(useUIStore.getState().autoSaveEnabled).toBe(false)
      useUIStore.getState().toggleAutoSave()
      expect(useUIStore.getState().autoSaveEnabled).toBe(true)
      useUIStore.getState().toggleAutoSave()
      expect(useUIStore.getState().autoSaveEnabled).toBe(false)
    })
  })

  describe('entity codex export', () => {
    it('codex export contains all entities grouped by type', () => {
      const entityStore = useEntityStore.getState()
      entityStore.addEntity('pc', 'Alfa', 'The leader')
      entityStore.addEntity('npc', 'Voss', 'A merchant')
      entityStore.addEntity('enemy', 'Target', 'The beast')
      entityStore.addEntity('location', 'North District', 'Main district')

      const registry = { entities: useEntityStore.getState().entities }
      const markdown = exportEntityRegistryAsMarkdown(registry)

      expect(markdown).toContain('# Campaign Entity Codex')
      expect(markdown).toContain('Alfa')
      expect(markdown).toContain('Voss')
      expect(markdown).toContain('Target')
      expect(markdown).toContain('North District')
      // PCs should appear before NPCs
      expect(markdown.indexOf('Alfa')).toBeLessThan(markdown.indexOf('Voss'))
      // NPCs before Enemies
      expect(markdown.indexOf('Voss')).toBeLessThan(markdown.indexOf('Target'))
    })
  })

  describe('rewire edge', () => {
    it('rewire edge updates source/target correctly', () => {
      const store = useGraphStore.getState()
      const a = store.addNode('event', { x: 0, y: 0 })
      const b = store.addNode('narration', { x: 100, y: 0 })
      const c = store.addNode('combat', { x: 200, y: 0 })
      const edgeId = store.connectNodes(a, b)

      // Rewire target from B to C
      store.rewireEdge(edgeId, undefined, c)

      const edge = useGraphStore.getState().edges[edgeId]
      expect(edge.source).toBe(a)
      expect(edge.target).toBe(c)
    })
  })
})
