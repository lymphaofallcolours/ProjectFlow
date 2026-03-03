import { describe, it, expect, beforeEach } from 'vitest'
import { useGraphStore } from '@/application/graph-store'
import { useHistoryStore } from '@/application/history-store'
import { useEntityStore } from '@/application/entity-store'
import { useSessionStore } from '@/application/session-store'
import { computeIncomingRelationships } from '@/domain/entity-operations'
import type { Entity } from '@/domain/entity-types'
import type { StoryNode } from '@/domain/types'

describe('Dashboard integration', () => {
  beforeEach(() => {
    useGraphStore.getState().reset()
    useHistoryStore.getState().reset()
    useEntityStore.getState().reset()
    useSessionStore.getState().reset()
  })

  it('entity counts from store', () => {
    useEntityStore.getState().addEntity('pc', 'Alfa')
    useEntityStore.getState().addEntity('pc', 'Bravo')
    useEntityStore.getState().addEntity('npc', 'Voss')
    useEntityStore.getState().addEntity('enemy', 'Carnifex')

    const entities = useEntityStore.getState().entities
    const counts = new Map<string, number>()
    for (const e of Object.values(entities)) {
      counts.set(e.type, (counts.get(e.type) ?? 0) + 1)
    }

    expect(counts.get('pc')).toBe(2)
    expect(counts.get('npc')).toBe(1)
    expect(counts.get('enemy')).toBe(1)
    expect(Object.keys(entities)).toHaveLength(4)
  })

  it('node counts from store', () => {
    useGraphStore.getState().addNode('event', { x: 0, y: 0 })
    useGraphStore.getState().addNode('event', { x: 100, y: 0 })
    useGraphStore.getState().addNode('combat', { x: 200, y: 0 })
    useGraphStore.getState().addNode('narration', { x: 300, y: 0 })

    const nodes = useGraphStore.getState().nodes
    const counts = new Map<string, number>()
    for (const n of Object.values(nodes)) {
      counts.set(n.sceneType, (counts.get(n.sceneType) ?? 0) + 1)
    }

    expect(counts.get('event')).toBe(2)
    expect(counts.get('combat')).toBe(1)
    expect(counts.get('narration')).toBe(1)
    expect(Object.keys(nodes)).toHaveLength(4)
  })

  it('top connected entities (outgoing + incoming)', () => {
    const aId = useEntityStore.getState().addEntity('pc', 'Alfa')
    const bId = useEntityStore.getState().addEntity('npc', 'Voss')
    const cId = useEntityStore.getState().addEntity('enemy', 'Carnifex')

    // Alfa → Voss (ally), Alfa → Carnifex (enemy-of)
    useEntityStore.getState().addRelationship(aId, { targetEntityId: bId, type: 'ally' })
    useEntityStore.getState().addRelationship(aId, { targetEntityId: cId, type: 'enemy-of' })
    // Voss → Carnifex (hunts)
    useEntityStore.getState().addRelationship(bId, { targetEntityId: cId, type: 'hunts' })

    const entities = useEntityStore.getState().entities
    const scored = Object.values(entities).map((e: Entity) => {
      const outgoing = e.relationships?.length ?? 0
      const incoming = computeIncomingRelationships(entities, e.id).length
      return { name: e.name, total: outgoing + incoming }
    })
    scored.sort((a, b) => b.total - a.total)

    // Alfa: 2 outgoing + 0 incoming = 2
    // Carnifex: 0 outgoing + 2 incoming = 2
    // Voss: 1 outgoing + 1 incoming = 2
    expect(scored[0].total).toBe(2)
    expect(scored.every((s) => s.total === 2)).toBe(true)
  })

  it('top tagged nodes', () => {
    const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 }, 'A')
    const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 }, 'B')
    useGraphStore.getState().addNode('combat', { x: 200, y: 0 }, 'C')

    useGraphStore.getState().setNodeTags(a, ['quest', 'main', 'urgent'])
    useGraphStore.getState().setNodeTags(b, ['quest'])
    // C has no tags

    const nodes = useGraphStore.getState().nodes
    const topTagged = Object.values(nodes)
      .filter((n: StoryNode) => n.metadata.tags.length > 0)
      .sort((a: StoryNode, b: StoryNode) => b.metadata.tags.length - a.metadata.tags.length)

    expect(topTagged).toHaveLength(2)
    expect(topTagged[0].label).toBe('A')
    expect(topTagged[0].metadata.tags.length).toBe(3)
    expect(topTagged[1].label).toBe('B')
    expect(topTagged[1].metadata.tags.length).toBe(1)
  })
})
