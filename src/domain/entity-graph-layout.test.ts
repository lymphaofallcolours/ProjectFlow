import { describe, it, expect } from 'vitest'
import { computeEntityGraphLayout } from './entity-graph-layout'
import { createTestEntity } from '../../tests/fixtures/factories'

describe('computeEntityGraphLayout', () => {
  it('positions entities of the same type in a cluster', () => {
    const entities = [
      createTestEntity({ id: 'a', type: 'pc', name: 'Alfa' }),
      createTestEntity({ id: 'b', type: 'pc', name: 'Bravo' }),
    ]
    const { nodes } = computeEntityGraphLayout(entities)
    expect(nodes).toHaveLength(2)
    // Both should be near the pc cluster center (0, -300)
    for (const node of nodes) {
      expect(Math.abs(node.position.y + 300)).toBeLessThan(200)
    }
  })

  it('separates entities of different types into different clusters', () => {
    const entities = [
      createTestEntity({ id: 'a', type: 'pc', name: 'Alfa' }),
      createTestEntity({ id: 'b', type: 'enemy', name: 'Carnifex' }),
    ]
    const { nodes } = computeEntityGraphLayout(entities)
    const pc = nodes.find((n) => n.entityId === 'a')!
    const enemy = nodes.find((n) => n.entityId === 'b')!
    // They should be well separated
    const dist = Math.sqrt(
      (pc.position.x - enemy.position.x) ** 2 + (pc.position.y - enemy.position.y) ** 2,
    )
    expect(dist).toBeGreaterThan(200)
  })

  it('computes edges from entity relationships', () => {
    const entities = [
      createTestEntity({
        id: 'a', type: 'pc', name: 'Alfa',
        relationships: [{ targetEntityId: 'b', type: 'ally' }],
      }),
      createTestEntity({ id: 'b', type: 'npc', name: 'Voss' }),
    ]
    const { edges } = computeEntityGraphLayout(entities)
    expect(edges).toHaveLength(1)
    expect(edges[0].sourceId).toBe('a')
    expect(edges[0].targetId).toBe('b')
    expect(edges[0].label).toBe('ally')
  })

  it('filters entities by type', () => {
    const entities = [
      createTestEntity({ id: 'a', type: 'pc', name: 'Alfa' }),
      createTestEntity({ id: 'b', type: 'enemy', name: 'Carnifex' }),
      createTestEntity({ id: 'c', type: 'npc', name: 'Voss' }),
    ]
    const { nodes } = computeEntityGraphLayout(entities, new Set(['pc', 'npc']))
    expect(nodes).toHaveLength(2)
    expect(nodes.every((n) => n.type === 'pc' || n.type === 'npc')).toBe(true)
  })

  it('excludes edges to filtered-out entities', () => {
    const entities = [
      createTestEntity({
        id: 'a', type: 'pc', name: 'Alfa',
        relationships: [{ targetEntityId: 'b', type: 'enemy-of' }],
      }),
      createTestEntity({ id: 'b', type: 'enemy', name: 'Carnifex' }),
    ]
    // Filter out enemies
    const { edges } = computeEntityGraphLayout(entities, new Set(['pc']))
    expect(edges).toHaveLength(0)
  })

  it('returns empty layout for no entities', () => {
    const { nodes, edges } = computeEntityGraphLayout([])
    expect(nodes).toHaveLength(0)
    expect(edges).toHaveLength(0)
  })
})
