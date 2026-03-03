import { describe, it, expect, vi } from 'vitest'
import {
  createNode,
  createEdge,
  createEmptyNodeFields,
  createEmptyRichContent,
  removeNode,
  removeEdge,
  removeNodes,
  duplicateNodes,
  updateNodeLabel,
  updateNodeSceneType,
  updateNodePosition,
  updateNodeField,
  isFieldPopulated,
  duplicateNode,
  updateEdgeStyle,
  updateEdgeLabel,
  updateNodeArcLabel,
  extractSubgraph,
  pasteSubgraph,
  rewireEdge,
} from './graph-operations'
import { createTestNode, createTestGroupNode, createTestEdge, createPopulatedNodeFields } from '../../tests/fixtures/factories'

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

describe('removeNodes', () => {
  it('removes multiple nodes at once', () => {
    const nodes = {
      n1: createTestNode({ id: 'n1' }),
      n2: createTestNode({ id: 'n2' }),
      n3: createTestNode({ id: 'n3' }),
    }
    const result = removeNodes(nodes, {}, ['n1', 'n3'])
    expect(Object.keys(result.nodes)).toEqual(['n2'])
  })

  it('removes all edges connected to any removed node', () => {
    const nodes = {
      n1: createTestNode({ id: 'n1' }),
      n2: createTestNode({ id: 'n2' }),
      n3: createTestNode({ id: 'n3' }),
    }
    const edges = {
      e1: createTestEdge({ id: 'e1', source: 'n1', target: 'n2' }),
      e2: createTestEdge({ id: 'e2', source: 'n2', target: 'n3' }),
    }
    const result = removeNodes(nodes, edges, ['n1'])
    expect(Object.keys(result.edges)).toEqual(['e2'])
  })

  it('handles empty nodeIds array', () => {
    const nodes = { n1: createTestNode({ id: 'n1' }) }
    const result = removeNodes(nodes, {}, [])
    expect(Object.keys(result.nodes)).toHaveLength(1)
  })

  it('ungroups children when removing a group node', () => {
    const group = createTestGroupNode({ id: 'g1' })
    const c1 = createTestNode({ id: 'c1', groupId: 'g1' })
    const c2 = createTestNode({ id: 'c2', groupId: 'g1' })
    const nodes = { g1: group, c1, c2 }

    const result = removeNodes(nodes, {}, ['g1'])
    expect(result.nodes['g1']).toBeUndefined()
    expect(result.nodes['c1']).toBeDefined()
    expect(result.nodes['c1'].groupId).toBeUndefined()
    expect(result.nodes['c2'].groupId).toBeUndefined()
  })
})

describe('duplicateNodes', () => {
  it('duplicates multiple nodes with new IDs', () => {
    const nodes = {
      n1: createTestNode({ id: 'n1', label: 'A' }),
      n2: createTestNode({ id: 'n2', label: 'B' }),
    }
    const result = duplicateNodes(nodes, {}, ['n1', 'n2'], { x: 50, y: 50 })
    expect(Object.keys(result.nodes)).toHaveLength(2)
    expect(result.idMap['n1']).toBeDefined()
    expect(result.idMap['n2']).toBeDefined()
    expect(result.idMap['n1']).not.toBe('n1')
  })

  it('duplicates interconnecting edges with remapped IDs', () => {
    const nodes = {
      n1: createTestNode({ id: 'n1' }),
      n2: createTestNode({ id: 'n2' }),
    }
    const edges = {
      e1: createTestEdge({ id: 'e1', source: 'n1', target: 'n2' }),
    }
    const result = duplicateNodes(nodes, edges, ['n1', 'n2'], { x: 50, y: 50 })
    const newEdges = Object.values(result.edges)
    expect(newEdges).toHaveLength(1)
    expect(newEdges[0].source).toBe(result.idMap['n1'])
    expect(newEdges[0].target).toBe(result.idMap['n2'])
  })

  it('does not duplicate edges to nodes outside the selection', () => {
    const nodes = {
      n1: createTestNode({ id: 'n1' }),
      n2: createTestNode({ id: 'n2' }),
      n3: createTestNode({ id: 'n3' }),
    }
    const edges = {
      e1: createTestEdge({ id: 'e1', source: 'n1', target: 'n3' }),
    }
    const result = duplicateNodes(nodes, edges, ['n1', 'n2'], { x: 50, y: 50 })
    expect(Object.keys(result.edges)).toHaveLength(0)
  })

  it('applies position offset', () => {
    const nodes = {
      n1: createTestNode({ id: 'n1', position: { x: 100, y: 200 } }),
    }
    const result = duplicateNodes(nodes, {}, ['n1'], { x: 30, y: 40 })
    const copy = Object.values(result.nodes)[0]
    expect(copy.position).toEqual({ x: 130, y: 240 })
  })

  it('remaps groupId when duplicating group with children', () => {
    const group = createTestGroupNode({ id: 'g1' })
    const c1 = createTestNode({ id: 'c1', groupId: 'g1' })
    const nodes = { g1: group, c1 }

    const result = duplicateNodes(nodes, {}, ['g1', 'c1'], { x: 50, y: 0 })
    const newGroupId = result.idMap['g1']
    const newChildId = result.idMap['c1']
    expect(result.nodes[newChildId].groupId).toBe(newGroupId)
  })

  it('clears groupId when parent group is not in selection', () => {
    const group = createTestGroupNode({ id: 'g1' })
    const c1 = createTestNode({ id: 'c1', groupId: 'g1' })
    const nodes = { g1: group, c1 }

    const result = duplicateNodes(nodes, {}, ['c1'], { x: 50, y: 0 })
    const newChild = Object.values(result.nodes)[0]
    expect(newChild.groupId).toBeUndefined()
  })
})

describe('updateEdgeStyle', () => {
  it('sets edge style to conditional', () => {
    const edge = createTestEdge({ style: 'default' })
    const updated = updateEdgeStyle(edge, 'conditional')
    expect(updated.style).toBe('conditional')
    expect(edge.style).toBe('default')
  })

  it('sets edge style to secret', () => {
    const edge = createTestEdge()
    const updated = updateEdgeStyle(edge, 'secret')
    expect(updated.style).toBe('secret')
  })
})

describe('updateEdgeLabel', () => {
  it('sets an edge label', () => {
    const edge = createTestEdge()
    const updated = updateEdgeLabel(edge, 'if players agree')
    expect(updated.label).toBe('if players agree')
  })

  it('clears label with undefined', () => {
    const edge = createTestEdge({ label: 'old' })
    const updated = updateEdgeLabel(edge, undefined)
    expect(updated.label).toBeUndefined()
  })
})

describe('updateNodeArcLabel', () => {
  it('sets an arc label', () => {
    const node = createTestNode()
    const updated = updateNodeArcLabel(node, 'MISSION 3')
    expect(updated.arcLabel).toBe('MISSION 3')
  })

  it('clears arc label with empty string', () => {
    const node = createTestNode({ arcLabel: 'ARC 1' })
    const updated = updateNodeArcLabel(node, '')
    expect(updated.arcLabel).toBeUndefined()
  })

  it('updates the updatedAt timestamp', () => {
    const node = createTestNode()
    vi.useFakeTimers()
    vi.advanceTimersByTime(1000)
    const updated = updateNodeArcLabel(node, 'ARC 2')
    vi.useRealTimers()
    expect(updated.metadata.updatedAt).not.toBe(node.metadata.updatedAt)
  })
})

describe('extractSubgraph', () => {
  it('extracts selected nodes and their connecting edges', () => {
    const nodes = {
      n1: createTestNode({ id: 'n1' }),
      n2: createTestNode({ id: 'n2' }),
      n3: createTestNode({ id: 'n3' }),
    }
    const edges = {
      e1: createTestEdge({ id: 'e1', source: 'n1', target: 'n2' }),
      e2: createTestEdge({ id: 'e2', source: 'n2', target: 'n3' }),
    }
    const result = extractSubgraph(nodes, edges, ['n1', 'n2'])
    expect(result.nodes).toHaveLength(2)
    expect(result.edges).toHaveLength(1) // only e1 connects n1↔n2
    expect(result.edges[0].id).toBe('e1')
  })

  it('skips non-existent node IDs', () => {
    const nodes = { n1: createTestNode({ id: 'n1' }) }
    const result = extractSubgraph(nodes, {}, ['n1', 'n99'])
    expect(result.nodes).toHaveLength(1)
  })

  it('auto-includes children when extracting a group', () => {
    const group = createTestGroupNode({ id: 'g1' })
    const c1 = createTestNode({ id: 'c1', groupId: 'g1' })
    const c2 = createTestNode({ id: 'c2', groupId: 'g1' })
    const other = createTestNode({ id: 'n1' })
    const nodes = { g1: group, c1, c2, n1: other }
    const edges = {
      e1: createTestEdge({ id: 'e1', source: 'c1', target: 'c2' }),
    }

    const result = extractSubgraph(nodes, edges, ['g1'])
    expect(result.nodes).toHaveLength(3) // group + 2 children
    expect(result.edges).toHaveLength(1) // internal edge included
  })
})

describe('pasteSubgraph', () => {
  it('creates new nodes with new IDs and offset positions', () => {
    const clipNodes = [createTestNode({ id: 'old1', position: { x: 100, y: 200 } })]
    const result = pasteSubgraph(clipNodes, [], { x: 50, y: 50 })
    const newNodes = Object.values(result.nodes)
    expect(newNodes).toHaveLength(1)
    expect(newNodes[0].id).not.toBe('old1')
    expect(newNodes[0].position).toEqual({ x: 150, y: 250 })
  })

  it('remaps edge source and target to new IDs', () => {
    const clipNodes = [
      createTestNode({ id: 'old1' }),
      createTestNode({ id: 'old2' }),
    ]
    const clipEdges = [createTestEdge({ id: 'oldE', source: 'old1', target: 'old2' })]
    const result = pasteSubgraph(clipNodes, clipEdges, { x: 0, y: 0 })
    const newEdges = Object.values(result.edges)
    expect(newEdges).toHaveLength(1)
    expect(newEdges[0].source).not.toBe('old1')
    expect(newEdges[0].target).not.toBe('old2')
    // Check that sources and targets point to the new node IDs
    const newNodeIds = new Set(Object.keys(result.nodes))
    expect(newNodeIds.has(newEdges[0].source)).toBe(true)
    expect(newNodeIds.has(newEdges[0].target)).toBe(true)
  })

  it('remaps groupId references in pasted group', () => {
    const group = createTestGroupNode({ id: 'g1' })
    const child = createTestNode({ id: 'c1', groupId: 'g1' })
    const result = pasteSubgraph([group, child], [], { x: 50, y: 50 })
    const newNodes = Object.values(result.nodes)
    const newGroup = newNodes.find((n) => n.isGroup)!
    const newChild = newNodes.find((n) => !n.isGroup)!
    expect(newChild.groupId).toBe(newGroup.id)
  })

  it('clears groupId when parent group is not in pasted set', () => {
    const child = createTestNode({ id: 'c1', groupId: 'g-missing' })
    const result = pasteSubgraph([child], [], { x: 0, y: 0 })
    const newChild = Object.values(result.nodes)[0]
    expect(newChild.groupId).toBeUndefined()
  })
})

describe('rewireEdge', () => {
  it('changes the source of an edge', () => {
    const edges = {
      e1: createTestEdge({ id: 'e1', source: 'a', target: 'b' }),
    }
    const result = rewireEdge(edges, 'e1', 'c')
    expect(result['e1'].source).toBe('c')
    expect(result['e1'].target).toBe('b')
  })

  it('changes the target of an edge', () => {
    const edges = {
      e1: createTestEdge({ id: 'e1', source: 'a', target: 'b' }),
    }
    const result = rewireEdge(edges, 'e1', undefined, 'c')
    expect(result['e1'].source).toBe('a')
    expect(result['e1'].target).toBe('c')
  })

  it('returns unchanged edges for missing edgeId', () => {
    const edges = { e1: createTestEdge({ id: 'e1' }) }
    const result = rewireEdge(edges, 'missing', 'x')
    expect(result).toBe(edges)
  })
})
