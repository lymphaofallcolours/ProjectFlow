import { describe, it, expect } from 'vitest'
import {
  serializeSubgraph,
  deserializeSubgraph,
  validateSubgraphFile,
} from './subgraph-operations'
import { createTestNode, createTestEdge } from '../../tests/fixtures/factories'

describe('serializeSubgraph', () => {
  it('serializes selected nodes and internal edges', () => {
    const a = createTestNode({ id: 'a', sceneType: 'event' })
    const b = createTestNode({ id: 'b', sceneType: 'narration' })
    const c = createTestNode({ id: 'c', sceneType: 'combat' })
    const eAB = createTestEdge({ id: 'e-ab', source: 'a', target: 'b' })
    const eBC = createTestEdge({ id: 'e-bc', source: 'b', target: 'c' })

    const nodes = { a, b, c }
    const edges = { 'e-ab': eAB, 'e-bc': eBC }

    const json = serializeSubgraph(nodes, edges, ['a', 'b'])
    const parsed = JSON.parse(json)

    expect(parsed.format).toBe('projectflow-subgraph')
    expect(parsed.version).toBe(1)
    expect(parsed.nodes).toHaveLength(2)
    expect(parsed.edges).toHaveLength(1)
    expect(parsed.edges[0].id).toBe('e-ab')
  })

  it('excludes external edges', () => {
    const a = createTestNode({ id: 'a' })
    const b = createTestNode({ id: 'b' })
    const eAB = createTestEdge({ id: 'e-ab', source: 'a', target: 'b' })

    const json = serializeSubgraph({ a, b }, { 'e-ab': eAB }, ['a'])
    const parsed = JSON.parse(json)

    expect(parsed.nodes).toHaveLength(1)
    expect(parsed.edges).toHaveLength(0)
  })

  it('produces valid JSON string', () => {
    const a = createTestNode({ id: 'a' })
    const json = serializeSubgraph({ a }, {}, ['a'])
    expect(() => JSON.parse(json)).not.toThrow()
  })
})

describe('deserializeSubgraph', () => {
  it('deserializes a valid subgraph file', () => {
    const a = createTestNode({ id: 'a', sceneType: 'event' })
    const json = serializeSubgraph({ a }, {}, ['a'])

    const result = deserializeSubgraph(json)
    expect(result.nodes).toHaveLength(1)
    expect(result.nodes[0].id).toBe('a')
    expect(result.edges).toHaveLength(0)
  })

  it('throws on invalid format', () => {
    const json = JSON.stringify({ format: 'wrong', version: 1, nodes: [], edges: [] })
    expect(() => deserializeSubgraph(json)).toThrow('Invalid subgraph file format')
  })

  it('throws on invalid JSON', () => {
    expect(() => deserializeSubgraph('not json')).toThrow()
  })

  it('throws on missing fields', () => {
    const json = JSON.stringify({ format: 'projectflow-subgraph' })
    expect(() => deserializeSubgraph(json)).toThrow()
  })
})

describe('validateSubgraphFile', () => {
  it('validates a correct subgraph file', () => {
    const data = {
      format: 'projectflow-subgraph',
      version: 1,
      nodes: [],
      edges: [],
    }
    expect(validateSubgraphFile(data)).toBe(true)
  })

  it('rejects wrong format', () => {
    expect(validateSubgraphFile({ format: 'wrong', version: 1, nodes: [], edges: [] })).toBe(false)
  })

  it('rejects wrong version', () => {
    expect(validateSubgraphFile({ format: 'projectflow-subgraph', version: 2, nodes: [], edges: [] })).toBe(false)
  })

  it('rejects non-array nodes', () => {
    expect(validateSubgraphFile({ format: 'projectflow-subgraph', version: 1, nodes: {}, edges: [] })).toBe(false)
  })

  it('rejects null', () => {
    expect(validateSubgraphFile(null)).toBe(false)
  })

  it('rejects non-objects', () => {
    expect(validateSubgraphFile('string')).toBe(false)
    expect(validateSubgraphFile(42)).toBe(false)
  })
})
