import { describe, it, expect, vi } from 'vitest'
import {
  createNode,
  createEdge,
  createEmptyNodeFields,
  createEmptyRichContent,
  removeNode,
  removeEdge,
  updateNodeLabel,
  updateNodeSceneType,
  updateNodePosition,
  updateNodeField,
  isFieldPopulated,
  duplicateNode,
} from './graph-operations'
import { createTestNode, createTestEdge, createPopulatedNodeFields } from '../../tests/fixtures/factories'

describe('createEmptyRichContent', () => {
  it('returns empty markdown', () => {
    const content = createEmptyRichContent()
    expect(content.markdown).toBe('')
    expect(content.attachments).toBeUndefined()
  })
})

describe('createEmptyNodeFields', () => {
  it('returns all 11 fields in empty state', () => {
    const fields = createEmptyNodeFields()
    expect(fields.script.markdown).toBe('')
    expect(fields.dialogues).toEqual([])
    expect(fields.gmNotes.markdown).toBe('')
    expect(fields.vibe.markdown).toBe('')
    expect(fields.soundtrack).toEqual([])
    expect(fields.events.markdown).toBe('')
    expect(fields.combat.markdown).toBe('')
    expect(fields.characters.markdown).toBe('')
    expect(fields.diceRolls).toEqual([])
    expect(fields.secrets.markdown).toBe('')
    expect(fields.custom).toEqual([])
  })
})

describe('createNode', () => {
  it('creates a node with the given scene type and position', () => {
    const node = createNode('combat', { x: 100, y: 200 })
    expect(node.sceneType).toBe('combat')
    expect(node.position).toEqual({ x: 100, y: 200 })
  })

  it('generates a unique id', () => {
    const a = createNode('event', { x: 0, y: 0 })
    const b = createNode('event', { x: 0, y: 0 })
    expect(a.id).not.toBe(b.id)
  })

  it('uses default label when none provided', () => {
    const node = createNode('narration', { x: 0, y: 0 })
    expect(node.label).toBe('New Scene')
  })

  it('uses custom label when provided', () => {
    const node = createNode('narration', { x: 0, y: 0 }, 'The Briefing')
    expect(node.label).toBe('The Briefing')
  })

  it('creates empty fields', () => {
    const node = createNode('social', { x: 0, y: 0 })
    expect(node.fields.script.markdown).toBe('')
    expect(node.fields.dialogues).toEqual([])
  })

  it('sets metadata timestamps', () => {
    const node = createNode('investigation', { x: 0, y: 0 })
    expect(node.metadata.createdAt).toBeTruthy()
    expect(node.metadata.updatedAt).toBeTruthy()
    expect(node.metadata.tags).toEqual([])
  })
})

describe('createEdge', () => {
  it('creates an edge connecting source to target', () => {
    const edge = createEdge('node-1', 'node-2')
    expect(edge.source).toBe('node-1')
    expect(edge.target).toBe('node-2')
    expect(edge.id).toBeTruthy()
    expect(edge.style).toBe('default')
  })

  it('accepts optional label', () => {
    const edge = createEdge('a', 'b', 'if players agree')
    expect(edge.label).toBe('if players agree')
  })
})

describe('removeNode', () => {
  it('removes the node from the record', () => {
    const node = createTestNode({ id: 'n1' })
    const nodes = { n1: node }
    const result = removeNode(nodes, {}, 'n1')
    expect(result.nodes).toEqual({})
  })

  it('removes all edges connected to the node', () => {
    const nodes = {
      n1: createTestNode({ id: 'n1' }),
      n2: createTestNode({ id: 'n2' }),
      n3: createTestNode({ id: 'n3' }),
    }
    const edges = {
      e1: createTestEdge({ id: 'e1', source: 'n1', target: 'n2' }),
      e2: createTestEdge({ id: 'e2', source: 'n2', target: 'n3' }),
      e3: createTestEdge({ id: 'e3', source: 'n3', target: 'n1' }),
    }

    const result = removeNode(nodes, edges, 'n1')
    expect(Object.keys(result.nodes)).toEqual(['n2', 'n3'])
    expect(Object.keys(result.edges)).toEqual(['e2'])
  })

  it('preserves unrelated nodes and edges', () => {
    const nodes = {
      n1: createTestNode({ id: 'n1' }),
      n2: createTestNode({ id: 'n2' }),
    }
    const edges = {
      e1: createTestEdge({ id: 'e1', source: 'n1', target: 'n2' }),
    }
    const result = removeNode(nodes, edges, 'n1')
    expect(result.nodes.n2).toBeDefined()
  })
})

describe('removeEdge', () => {
  it('removes the specified edge', () => {
    const edges = {
      e1: createTestEdge({ id: 'e1' }),
      e2: createTestEdge({ id: 'e2' }),
    }
    const result = removeEdge(edges, 'e1')
    expect(result.e1).toBeUndefined()
    expect(result.e2).toBeDefined()
  })
})

describe('updateNodeLabel', () => {
  it('returns a new node with updated label', () => {
    const original = createTestNode({ label: 'Old' })
    const updated = updateNodeLabel(original, 'New')
    expect(updated.label).toBe('New')
    expect(original.label).toBe('Old')
  })

  it('updates the updatedAt timestamp', () => {
    const original = createTestNode()
    vi.useFakeTimers()
    vi.advanceTimersByTime(1000)
    const updated = updateNodeLabel(original, 'Changed')
    vi.useRealTimers()
    expect(updated.metadata.updatedAt).not.toBe(original.metadata.updatedAt)
  })
})

describe('updateNodeSceneType', () => {
  it('changes the scene type', () => {
    const node = createTestNode({ sceneType: 'narration' })
    const updated = updateNodeSceneType(node, 'combat')
    expect(updated.sceneType).toBe('combat')
  })
})

describe('updateNodePosition', () => {
  it('changes the position', () => {
    const node = createTestNode({ position: { x: 0, y: 0 } })
    const updated = updateNodePosition(node, { x: 50, y: 100 })
    expect(updated.position).toEqual({ x: 50, y: 100 })
  })
})

describe('updateNodeField', () => {
  it('updates a rich content field', () => {
    const node = createTestNode()
    const updated = updateNodeField(node, 'script', { markdown: 'Hello world' })
    expect(updated.fields.script.markdown).toBe('Hello world')
    expect(node.fields.script.markdown).toBe('')
  })

  it('updates an array field', () => {
    const node = createTestNode()
    const dialogues = [{ entityRef: '!@Voss', line: 'Report, Brother.' }]
    const updated = updateNodeField(node, 'dialogues', dialogues)
    expect(updated.fields.dialogues).toHaveLength(1)
  })
})

describe('isFieldPopulated', () => {
  it('returns false for empty rich content', () => {
    const fields = createEmptyNodeFields()
    expect(isFieldPopulated(fields, 'script')).toBe(false)
  })

  it('returns true for non-empty rich content', () => {
    const fields = createPopulatedNodeFields()
    expect(isFieldPopulated(fields, 'script')).toBe(true)
  })

  it('returns false for whitespace-only rich content', () => {
    const fields = createPopulatedNodeFields({
      script: { markdown: '   \n  ' },
    })
    expect(isFieldPopulated(fields, 'script')).toBe(false)
  })

  it('returns false for empty array fields', () => {
    const fields = createEmptyNodeFields()
    expect(isFieldPopulated(fields, 'dialogues')).toBe(false)
    expect(isFieldPopulated(fields, 'soundtrack')).toBe(false)
    expect(isFieldPopulated(fields, 'diceRolls')).toBe(false)
    expect(isFieldPopulated(fields, 'custom')).toBe(false)
  })

  it('returns true for non-empty array fields', () => {
    const fields = createPopulatedNodeFields({
      dialogues: [{ entityRef: '!@Voss', line: 'Hello' }],
    })
    expect(isFieldPopulated(fields, 'dialogues')).toBe(true)
  })
})

describe('duplicateNode', () => {
  it('creates a new node with a different id', () => {
    const original = createTestNode()
    const copy = duplicateNode(original, { x: 50, y: 50 })
    expect(copy.id).not.toBe(original.id)
  })

  it('uses the new position', () => {
    const original = createTestNode()
    const copy = duplicateNode(original, { x: 200, y: 300 })
    expect(copy.position).toEqual({ x: 200, y: 300 })
  })

  it('appends (copy) to the label', () => {
    const original = createTestNode({ label: 'Ambush' })
    const copy = duplicateNode(original, { x: 0, y: 0 })
    expect(copy.label).toBe('Ambush (copy)')
  })

  it('deep copies fields so mutations are independent', () => {
    const original = createTestNode()
    original.fields.script.markdown = 'Original content'
    const copy = duplicateNode(original, { x: 0, y: 0 })
    copy.fields.script.markdown = 'Modified copy'
    expect(original.fields.script.markdown).toBe('Original content')
  })

  it('preserves the scene type', () => {
    const original = createTestNode({ sceneType: 'combat' })
    const copy = duplicateNode(original, { x: 0, y: 0 })
    expect(copy.sceneType).toBe('combat')
  })
})
