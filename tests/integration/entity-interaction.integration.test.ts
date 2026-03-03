import { describe, it, expect, beforeEach } from 'vitest'
import { useEntityStore } from '@/application/entity-store'
import { useGraphStore } from '@/application/graph-store'
import { useUIStore } from '@/application/ui-store'
import { extractStatusTagsFromText, extractEntityTypesFromNodeFields } from '@/domain/entity-tag-parser'
import { createTestNode, createPopulatedNodeFields } from '../fixtures/factories'

describe('Entity interaction (integration)', () => {
  beforeEach(() => {
    useEntityStore.getState().reset()
    useGraphStore.getState().reset()
    // Reset UI store
    if (useUIStore.getState().entitySidebarOpen) {
      useUIStore.getState().toggleEntitySidebar()
    }
    useUIStore.getState().selectEntity(null)
  })

  it('entity chip click flow opens sidebar and selects correct entity', () => {
    const alfaId = useEntityStore.getState().addEntity('pc', 'Alfa')
    useEntityStore.getState().addEntity('npc', 'Voss')

    // Simulate chip click: lookup entity by name, open sidebar, select
    const entity = useEntityStore.getState().getByName('Alfa', 'pc')
    expect(entity).toBeDefined()

    useUIStore.getState().openEntitySidebar()
    useUIStore.getState().selectEntity(entity!.id)

    expect(useUIStore.getState().entitySidebarOpen).toBe(true)
    expect(useUIStore.getState().selectedEntityId).toBe(alfaId)
  })

  it('status auto-logging: adding status tag to field creates entity status entry', () => {
    const entityId = useEntityStore.getState().addEntity('pc', 'Alfa')
    const nodeId = useGraphStore.getState().addNode('event', { x: 0, y: 0 }, 'Scene 1')

    const oldText = '@Alfa enters the tavern'
    const newText = '@Alfa+wounded enters the tavern'

    // Simulate TipTap's onUpdate diff logic
    const oldTags = extractStatusTagsFromText(oldText)
    const newTags = extractStatusTagsFromText(newText)
    const oldSet = new Set(oldTags.map((t) => `${t.name}:${t.status}`))

    for (const tag of newTags) {
      const key = `${tag.name}:${tag.status}`
      if (!oldSet.has(key)) {
        const entity = useEntityStore.getState().getByName(tag.name, tag.entityType)
        if (entity) {
          useEntityStore.getState().addStatus(entity.id, nodeId, tag.status)
        }
      }
    }

    const entity = useEntityStore.getState().entities[entityId]
    expect(entity.statusHistory).toHaveLength(1)
    expect(entity.statusHistory[0].status).toBe('wounded')
    expect(entity.statusHistory[0].nodeId).toBe(nodeId)
  })

  it('entity type summary on node shows correct types from fields', () => {
    const node = createTestNode({
      fields: createPopulatedNodeFields({
        script: { markdown: '@Alfa meets !@Voss at ~@North District' },
        gmNotes: { markdown: '%@Target lurks nearby' },
      }),
    })

    const types = extractEntityTypesFromNodeFields(node)
    expect(types.has('pc')).toBe(true)
    expect(types.has('npc')).toBe(true)
    expect(types.has('location')).toBe(true)
    expect(types.has('enemy')).toBe(true)
    expect(types.size).toBe(4)
  })

  it('edge rewire via store action updates edge endpoints', () => {
    const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 }, 'A')
    const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 }, 'B')
    const c = useGraphStore.getState().addNode('combat', { x: 200, y: 0 }, 'C')
    useGraphStore.getState().connectNodes(a, b)

    const edges = Object.values(useGraphStore.getState().edges)
    expect(edges).toHaveLength(1)
    const edgeId = edges[0].id

    // Rewire source from A to C
    useGraphStore.getState().rewireEdge(edgeId, c, undefined)

    const rewired = useGraphStore.getState().edges[edgeId]
    expect(rewired.source).toBe(c)
    expect(rewired.target).toBe(b)
  })

  it('relationship navigation: entity A links to entity B', () => {
    const alfaId = useEntityStore.getState().addEntity('pc', 'Alfa')
    const vossId = useEntityStore.getState().addEntity('npc', 'Voss')

    useEntityStore.getState().addRelationship(alfaId, {
      targetEntityId: vossId,
      type: 'ally',
    })

    // Simulate navigating to Voss from Alfa's relationship
    useUIStore.getState().openEntitySidebar()
    useUIStore.getState().selectEntity(alfaId)
    expect(useUIStore.getState().selectedEntityId).toBe(alfaId)

    // Click on relationship target → navigate
    useUIStore.getState().selectEntity(vossId)
    expect(useUIStore.getState().selectedEntityId).toBe(vossId)
  })

  it('multiple status auto-logs across different entity types', () => {
    useEntityStore.getState().addEntity('pc', 'Alfa')
    useEntityStore.getState().addEntity('npc', 'Voss')
    useEntityStore.getState().addEntity('enemy', 'Target')

    const oldText = ''
    const newText = '@Alfa+wounded by %@Target+enraged while !@Voss+dead'

    const oldTags = extractStatusTagsFromText(oldText)
    const newTags = extractStatusTagsFromText(newText)
    const oldSet = new Set(oldTags.map((t) => `${t.name}:${t.status}`))

    for (const tag of newTags) {
      const key = `${tag.name}:${tag.status}`
      if (!oldSet.has(key)) {
        const entity = useEntityStore.getState().getByName(tag.name, tag.entityType)
        if (entity) {
          useEntityStore.getState().addStatus(entity.id, 'test-node', tag.status)
        }
      }
    }

    const alfa = useEntityStore.getState().getByName('Alfa', 'pc')
    const voss = useEntityStore.getState().getByName('Voss', 'npc')
    const targetEnemy = useEntityStore.getState().getByName('Target', 'enemy')

    expect(alfa!.statusHistory).toHaveLength(1)
    expect(alfa!.statusHistory[0].status).toBe('wounded')
    expect(voss!.statusHistory).toHaveLength(1)
    expect(voss!.statusHistory[0].status).toBe('dead')
    expect(targetEnemy!.statusHistory).toHaveLength(1)
    expect(targetEnemy!.statusHistory[0].status).toBe('enraged')
  })
})
