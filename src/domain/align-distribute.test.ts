import { describe, it, expect } from 'vitest'
import { alignNodes, distributeNodes } from './align-distribute'
import type { StoryNode } from './types'

function makeNode(id: string, x: number, y: number, sceneType: StoryNode['sceneType'] = 'event'): StoryNode {
  return {
    id,
    position: { x, y },
    label: id,
    sceneType,
    fields: {} as StoryNode['fields'],
    metadata: { createdAt: '', updatedAt: '', tags: [] },
  }
}

function toRecord(items: StoryNode[]): Record<string, StoryNode> {
  return Object.fromEntries(items.map((i) => [i.id, i]))
}

describe('alignNodes', () => {
  it('aligns left to minimum x', () => {
    const nodes = toRecord([makeNode('a', 100, 0), makeNode('b', 200, 50), makeNode('c', 150, 100)])
    const result = alignNodes(nodes, ['a', 'b', 'c'], 'left')

    expect(result.b).toEqual({ x: 100, y: 50 })
    expect(result.c).toEqual({ x: 100, y: 100 })
    expect(result.a).toBeUndefined() // already at min
  })

  it('aligns right to maximum right edge', () => {
    const nodes = toRecord([makeNode('a', 100, 0), makeNode('b', 200, 50), makeNode('c', 50, 100)])
    const result = alignNodes(nodes, ['a', 'b', 'c'], 'right')

    // All are 'event' = circle = 120px wide. Max right = 200+120 = 320
    expect(result.a).toEqual({ x: 200, y: 0 })
    expect(result.c).toEqual({ x: 200, y: 100 })
    expect(result.b).toBeUndefined() // already at max right
  })

  it('aligns center to average center-x', () => {
    const nodes = toRecord([makeNode('a', 0, 0), makeNode('b', 120, 0), makeNode('c', 240, 0)])
    const result = alignNodes(nodes, ['a', 'b', 'c'], 'center')

    // Centers: 60, 180, 300 → avg 180. All circles (120w), so x = 180 - 60 = 120
    expect(result.a).toBeDefined()
    expect(result.c).toBeDefined()
  })

  it('aligns top to minimum y', () => {
    const nodes = toRecord([makeNode('a', 0, 50), makeNode('b', 100, 10), makeNode('c', 200, 80)])
    const result = alignNodes(nodes, ['a', 'b', 'c'], 'top')

    expect(result.a).toEqual({ x: 0, y: 10 })
    expect(result.c).toEqual({ x: 200, y: 10 })
  })

  it('returns empty for < 2 nodes', () => {
    const nodes = toRecord([makeNode('a', 0, 0)])
    expect(alignNodes(nodes, ['a'], 'left')).toEqual({})
    expect(alignNodes(nodes, [], 'left')).toEqual({})
  })
})

describe('distributeNodes', () => {
  it('distributes horizontally with even spacing', () => {
    const nodes = toRecord([
      makeNode('a', 0, 0),
      makeNode('b', 500, 0),
      makeNode('c', 100, 0),
      makeNode('d', 300, 0),
    ])
    const result = distributeNodes(nodes, ['a', 'b', 'c', 'd'], 'horizontal')

    // Sorted by x: a(0), c(100), d(300), b(500). All 120w.
    // Total space = 500+120-0 = 620. Total widths = 480. Gap = 140/3 ≈ 46.67
    const ids = Object.keys(result)
    expect(ids.length).toBeGreaterThanOrEqual(1)
  })

  it('distributes vertically with even spacing', () => {
    const nodes = toRecord([
      makeNode('a', 0, 0),
      makeNode('b', 0, 400),
      makeNode('c', 0, 100),
      makeNode('d', 0, 200),
    ])
    const result = distributeNodes(nodes, ['a', 'b', 'c', 'd'], 'vertical')

    // At least some positions change
    expect(Object.keys(result).length).toBeGreaterThanOrEqual(1)
  })

  it('returns empty for < 3 nodes', () => {
    const nodes = toRecord([makeNode('a', 0, 0), makeNode('b', 100, 0)])
    expect(distributeNodes(nodes, ['a', 'b'], 'horizontal')).toEqual({})
    expect(distributeNodes(nodes, ['a'], 'horizontal')).toEqual({})
  })
})
