import { describe, it, expect } from 'vitest'
import { createSnapshot, MAX_HISTORY_SIZE } from './history-operations'
import { createTestNode, createTestEdge } from '../../tests/fixtures/factories'

describe('createSnapshot', () => {
  it('creates a snapshot from nodes and edges', () => {
    const nodes = { n1: createTestNode({ id: 'n1' }) }
    const edges = { e1: createTestEdge({ id: 'e1' }) }
    const snapshot = createSnapshot(nodes, edges)
    expect(snapshot.nodes).toBe(nodes)
    expect(snapshot.edges).toBe(edges)
  })

  it('creates an empty snapshot', () => {
    const snapshot = createSnapshot({}, {})
    expect(Object.keys(snapshot.nodes)).toHaveLength(0)
    expect(Object.keys(snapshot.edges)).toHaveLength(0)
  })
})

describe('MAX_HISTORY_SIZE', () => {
  it('is defined as 50', () => {
    expect(MAX_HISTORY_SIZE).toBe(50)
  })
})
