import { describe, it, expect, beforeEach } from 'vitest'
import { useEntityStore } from '@/application/entity-store'
import { computeEntityGraphLayout } from '@/domain/entity-graph-layout'
import type { EntityType } from '@/domain/entity-types'

describe('Entity graph integration', () => {
  beforeEach(() => {
    useEntityStore.getState().reset()
  })

  it('layout positions computed from store entities', () => {
    useEntityStore.getState().addEntity('pc', 'Alfa')
    useEntityStore.getState().addEntity('npc', 'Voss')
    useEntityStore.getState().addEntity('enemy', 'Target')

    const entities = useEntityStore.getState().getAllEntities()
    const { nodes } = computeEntityGraphLayout(entities)

    expect(nodes).toHaveLength(3)
    expect(nodes.map((n) => n.name).sort()).toEqual(['Alfa', 'Target', 'Voss'])
  })

  it('edges reflect store relationships', () => {
    const aId = useEntityStore.getState().addEntity('pc', 'Alfa')
    const bId = useEntityStore.getState().addEntity('npc', 'Voss')
    useEntityStore.getState().addRelationship(aId, {
      targetEntityId: bId,
      type: 'commander',
    })

    const entities = useEntityStore.getState().getAllEntities()
    const { edges } = computeEntityGraphLayout(entities)

    expect(edges).toHaveLength(1)
    expect(edges[0].sourceId).toBe(aId)
    expect(edges[0].targetId).toBe(bId)
    expect(edges[0].label).toBe('commander')
  })

  it('type filter excludes entities from layout', () => {
    useEntityStore.getState().addEntity('pc', 'Alfa')
    useEntityStore.getState().addEntity('enemy', 'Target')
    useEntityStore.getState().addEntity('location', 'North District')

    const entities = useEntityStore.getState().getAllEntities()
    const filter = new Set<EntityType>(['pc', 'location'])
    const { nodes } = computeEntityGraphLayout(entities, filter)

    expect(nodes).toHaveLength(2)
    expect(nodes.every((n) => n.type === 'pc' || n.type === 'location')).toBe(true)
  })
})
