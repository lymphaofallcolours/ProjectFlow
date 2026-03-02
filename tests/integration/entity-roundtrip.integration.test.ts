import { describe, it, expect, beforeEach } from 'vitest'
import { useEntityStore } from '@/application/entity-store'
import { useGraphStore } from '@/application/graph-store'
import { useCampaignStore } from '@/application/campaign-store'
import { assembleCampaign, hydrateCampaign } from '@/application/campaign-actions'
import { serializeCampaign, deserializeCampaign } from '@/infrastructure/serialization'

describe('Entity roundtrip (integration)', () => {
  beforeEach(() => {
    useEntityStore.getState().reset()
    useGraphStore.getState().reset()
    useCampaignStore.getState().reset()
  })

  it('persists entities through full save/load cycle', () => {
    // Create entities of each type
    const entityStore = useEntityStore.getState()
    const pcId = entityStore.addEntity('pc', 'Alfa', 'Kill-Team Leader')
    const npcId = entityStore.addEntity('npc', 'Voss', 'Stern sergeant')
    const enemyId = entityStore.addEntity('enemy', 'Carnifex', 'Tyranid bioform')
    entityStore.addEntity('object', 'Rosarius', 'Holy artifact')
    entityStore.addEntity('location', 'Hive Primus', 'Primary hive city')
    entityStore.addEntity('secret', 'Genestealer Cult', 'Hidden threat')

    // Add status history
    entityStore.addStatus(pcId, 'node-1', 'wounded', 'Caught in explosion')
    entityStore.addStatus(npcId, 'node-2', 'dead', 'Killed by Carnifex')
    entityStore.addStatus(enemyId, 'node-3', 'fleeing')

    // Also add a node with entity tags in its fields
    const graphStore = useGraphStore.getState()
    graphStore.addNode('combat', { x: 0, y: 0 }, 'Ambush')

    useCampaignStore.getState().setName('Entity Roundtrip Test')

    // Serialize
    const json = serializeCampaign(assembleCampaign())

    // Reset all stores
    useEntityStore.getState().reset()
    useGraphStore.getState().reset()
    useCampaignStore.getState().reset()

    // Verify clean
    expect(useEntityStore.getState().getAllEntities()).toHaveLength(0)

    // Restore
    hydrateCampaign(deserializeCampaign(json))

    // Verify entities
    const restored = useEntityStore.getState()
    expect(restored.getAllEntities()).toHaveLength(6)
    expect(restored.getByType('pc')).toHaveLength(1)
    expect(restored.getByType('npc')).toHaveLength(1)
    expect(restored.getByType('enemy')).toHaveLength(1)
    expect(restored.getByType('object')).toHaveLength(1)
    expect(restored.getByType('location')).toHaveLength(1)
    expect(restored.getByType('secret')).toHaveLength(1)

    // Verify status history
    const alfa = restored.entities[pcId]
    expect(alfa.statusHistory).toHaveLength(1)
    expect(alfa.statusHistory[0].status).toBe('wounded')
    expect(alfa.statusHistory[0].note).toBe('Caught in explosion')

    const voss = restored.entities[npcId]
    expect(voss.statusHistory).toHaveLength(1)
    expect(voss.statusHistory[0].status).toBe('dead')
  })

  it('preserves entity affiliations and relationships through roundtrip', () => {
    const entityStore = useEntityStore.getState()
    const id = entityStore.addEntity('npc', 'Voss', 'Sergeant')
    entityStore.updateEntity(id, {
      affiliations: ['Deathwatch', 'Ultramarines'],
      relationships: [
        { targetEntityId: 'some-id', type: 'subordinate', note: 'Reports to Brother-Captain' },
      ],
    })

    const json = serializeCampaign(assembleCampaign())
    useEntityStore.getState().reset()
    hydrateCampaign(deserializeCampaign(json))

    const restored = useEntityStore.getState().entities[id]
    expect(restored.affiliations).toEqual(['Deathwatch', 'Ultramarines'])
    expect(restored.relationships).toHaveLength(1)
    expect(restored.relationships![0].type).toBe('subordinate')
  })

  it('handles empty entity registry gracefully', () => {
    useCampaignStore.getState().setName('Empty Entity Test')
    const json = serializeCampaign(assembleCampaign())
    useEntityStore.getState().reset()
    hydrateCampaign(deserializeCampaign(json))
    expect(useEntityStore.getState().getAllEntities()).toHaveLength(0)
  })
})
