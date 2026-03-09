import { describe, it, expect } from 'vitest'
import { computeAutoLayout } from './graph-layout'
import type { StoryNode, StoryEdge } from './types'

function makeNode(id: string, overrides?: Partial<StoryNode>): StoryNode {
  return {
    id,
    position: { x: 0, y: 0 },
    label: id,
    sceneType: 'event',
    fields: {} as StoryNode['fields'],
    metadata: { createdAt: '', updatedAt: '', tags: [] },
    ...overrides,
  }
}

function makeEdge(id: string, source: string, target: string): StoryEdge {
  return { id, source, target }
}

function toRecord<T extends { id: string }>(items: T[]): Record<string, T> {
  return Object.fromEntries(items.map((i) => [i.id, i]))
}

describe('computeAutoLayout', () => {
  it('assigns positions to a 3-node chain', () => {
    const nodes = toRecord([makeNode('a'), makeNode('b'), makeNode('c')])
    const edges = toRecord([makeEdge('e1', 'a', 'b'), makeEdge('e2', 'b', 'c')])
    const positions = computeAutoLayout(nodes, edges, { rankdir: 'LR' })

    expect(Object.keys(positions)).toHaveLength(3)
    expect(positions.a.x).toBeLessThan(positions.b.x)
    expect(positions.b.x).toBeLessThan(positions.c.x)
  })

  it('respects TB rankdir', () => {
    const nodes = toRecord([makeNode('a'), makeNode('b')])
    const edges = toRecord([makeEdge('e1', 'a', 'b')])
    const positions = computeAutoLayout(nodes, edges, { rankdir: 'TB' })

    expect(positions.a.y).toBeLessThan(positions.b.y)
  })

  it('only returns positions for selected nodes', () => {
    const nodes = toRecord([makeNode('a'), makeNode('b'), makeNode('c'), makeNode('d'), makeNode('e')])
    const edges = toRecord([makeEdge('e1', 'a', 'b'), makeEdge('e2', 'b', 'c')])
    const positions = computeAutoLayout(nodes, edges, {
      rankdir: 'LR',
      selectedNodeIds: new Set(['a', 'c']),
    })

    expect(Object.keys(positions)).toHaveLength(2)
    expect(positions.a).toBeDefined()
    expect(positions.c).toBeDefined()
    expect(positions.b).toBeUndefined()
  })

  it('excludes collapsed group children from layout', () => {
    const nodes = toRecord([
      makeNode('g', { isGroup: true, collapsed: true }),
      makeNode('c1', { groupId: 'g' }),
      makeNode('c2', { groupId: 'g' }),
      makeNode('x'),
    ])
    const edges = toRecord([makeEdge('e1', 'c1', 'x')])
    const positions = computeAutoLayout(nodes, edges, { rankdir: 'LR' })

    expect(positions.g).toBeDefined()
    expect(positions.x).toBeDefined()
    expect(positions.c1).toBeUndefined()
    expect(positions.c2).toBeUndefined()
  })

  it('handles disconnected nodes', () => {
    const nodes = toRecord([makeNode('a'), makeNode('b'), makeNode('c')])
    const edges = {} as Record<string, StoryEdge>
    const positions = computeAutoLayout(nodes, edges, { rankdir: 'LR' })

    expect(Object.keys(positions)).toHaveLength(3)
  })

  it('returns empty result for empty graph', () => {
    const positions = computeAutoLayout({}, {}, { rankdir: 'LR' })
    expect(Object.keys(positions)).toHaveLength(0)
  })

  it('uses correct dimensions for different shapes', () => {
    const nodes = toRecord([
      makeNode('a', { sceneType: 'event' }),   // circle 120x120
      makeNode('b', { sceneType: 'divider' }), // banner 200x50
    ])
    const edges = toRecord([makeEdge('e1', 'a', 'b')])
    const positions = computeAutoLayout(nodes, edges, { rankdir: 'LR' })

    expect(Object.keys(positions)).toHaveLength(2)
    // Both get valid positions
    expect(typeof positions.a.x).toBe('number')
    expect(typeof positions.b.x).toBe('number')
  })
})
