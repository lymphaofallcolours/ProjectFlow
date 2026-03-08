import { describe, it, expect } from 'vitest'
import {
  createGroupNode,
  addNodesToGroup,
  removeNodesFromGroup,
  toggleGroupCollapsed,
  getGroupChildren,
  getGroupChildIds,
  getAllDescendants,
  getGroupDepth,
  getMaxDescendantDepth,
  isAncestorOf,
  isNodeInGroup,
  deleteGroupKeepChildren,
  deleteGroupWithChildren,
  getGroupBoundaryEdges,
  getInternalEdges,
} from './group-operations'
import {
  createTestNode,
  createTestGroupNode,
  createTestEdge,
} from '../../tests/fixtures/factories'

describe('createGroupNode', () => {
  it('creates a node with isGroup set to true', () => {
    const group = createGroupNode('event', { x: 100, y: 200 })
    expect(group.isGroup).toBe(true)
    expect(group.sceneType).toBe('event')
    expect(group.position).toEqual({ x: 100, y: 200 })
  })

  it('uses default label when none provided', () => {
    const group = createGroupNode('narration', { x: 0, y: 0 })
    expect(group.label).toBe('New Group')
  })

  it('uses custom label when provided', () => {
    const group = createGroupNode('combat', { x: 0, y: 0 }, 'Act 1')
    expect(group.label).toBe('Act 1')
  })

  it('generates a unique id', () => {
    const a = createGroupNode('event', { x: 0, y: 0 })
    const b = createGroupNode('event', { x: 0, y: 0 })
    expect(a.id).not.toBe(b.id)
  })
})

describe('addNodesToGroup', () => {
  it('sets groupId on the specified nodes', () => {
    const group = createTestGroupNode({ id: 'g1' })
    const child = createTestNode({ id: 'c1' })
    const nodes = { g1: group, c1: child }

    const result = addNodesToGroup(nodes, 'g1', ['c1'])
    expect(result['c1'].groupId).toBe('g1')
  })

  it('can add multiple nodes at once', () => {
    const group = createTestGroupNode({ id: 'g1' })
    const c1 = createTestNode({ id: 'c1' })
    const c2 = createTestNode({ id: 'c2' })
    const nodes = { g1: group, c1, c2 }

    const result = addNodesToGroup(nodes, 'g1', ['c1', 'c2'])
    expect(result['c1'].groupId).toBe('g1')
    expect(result['c2'].groupId).toBe('g1')
  })

  it('throws when target is not a group', () => {
    const regular = createTestNode({ id: 'n1' })
    const child = createTestNode({ id: 'c1' })
    const nodes = { n1: regular, c1: child }

    expect(() => addNodesToGroup(nodes, 'n1', ['c1'])).toThrow('not a group')
  })

  it('allows nesting a group inside another group', () => {
    const g1 = createTestGroupNode({ id: 'g1' })
    const g2 = createTestGroupNode({ id: 'g2' })
    const nodes = { g1, g2 }

    const result = addNodesToGroup(nodes, 'g1', ['g2'])
    expect(result['g2'].groupId).toBe('g1')
  })

  it('throws when nesting would create a cycle', () => {
    const g1 = createTestGroupNode({ id: 'g1', groupId: 'g2' })
    const g2 = createTestGroupNode({ id: 'g2' })
    const nodes = { g1, g2 }

    expect(() => addNodesToGroup(nodes, 'g1', ['g2'])).toThrow('descendant')
  })

  it('throws when node already belongs to a different group', () => {
    const g1 = createTestGroupNode({ id: 'g1' })
    const g2 = createTestGroupNode({ id: 'g2' })
    const child = createTestNode({ id: 'c1', groupId: 'g2' })
    const nodes = { g1, g2, c1: child }

    expect(() => addNodesToGroup(nodes, 'g1', ['c1'])).toThrow('already belongs to group')
  })

  it('allows adding a node already in the same group (idempotent)', () => {
    const group = createTestGroupNode({ id: 'g1' })
    const child = createTestNode({ id: 'c1', groupId: 'g1' })
    const nodes = { g1: group, c1: child }

    const result = addNodesToGroup(nodes, 'g1', ['c1'])
    expect(result['c1'].groupId).toBe('g1')
  })

  it('skips non-existent node IDs', () => {
    const group = createTestGroupNode({ id: 'g1' })
    const nodes = { g1: group }

    const result = addNodesToGroup(nodes, 'g1', ['missing'])
    expect(Object.keys(result)).toEqual(['g1'])
  })
})

describe('removeNodesFromGroup', () => {
  it('clears groupId from specified nodes', () => {
    const child = createTestNode({ id: 'c1', groupId: 'g1' })
    const nodes = { c1: child }

    const result = removeNodesFromGroup(nodes, ['c1'])
    expect(result['c1'].groupId).toBeUndefined()
  })

  it('leaves nodes without groupId unchanged', () => {
    const node = createTestNode({ id: 'n1' })
    const nodes = { n1: node }

    const result = removeNodesFromGroup(nodes, ['n1'])
    expect(result['n1'].groupId).toBeUndefined()
  })
})

describe('toggleGroupCollapsed', () => {
  it('toggles collapsed from undefined to true', () => {
    const group = createTestGroupNode({ id: 'g1' })
    const result = toggleGroupCollapsed(group)
    expect(result.collapsed).toBe(true)
  })

  it('toggles collapsed from true to false', () => {
    const group = createTestGroupNode({ id: 'g1', collapsed: true })
    const result = toggleGroupCollapsed(group)
    expect(result.collapsed).toBe(false)
  })

  it('returns the same node if not a group', () => {
    const node = createTestNode({ id: 'n1' })
    const result = toggleGroupCollapsed(node)
    expect(result).toBe(node)
  })
})

describe('getGroupChildren', () => {
  it('returns all nodes with matching groupId', () => {
    const group = createTestGroupNode({ id: 'g1' })
    const c1 = createTestNode({ id: 'c1', groupId: 'g1' })
    const c2 = createTestNode({ id: 'c2', groupId: 'g1' })
    const other = createTestNode({ id: 'n1' })
    const nodes = { g1: group, c1, c2, n1: other }

    const children = getGroupChildren(nodes, 'g1')
    expect(children).toHaveLength(2)
    expect(children.map((c) => c.id).sort()).toEqual(['c1', 'c2'])
  })

  it('returns empty array for group with no children', () => {
    const group = createTestGroupNode({ id: 'g1' })
    const nodes = { g1: group }

    expect(getGroupChildren(nodes, 'g1')).toHaveLength(0)
  })
})

describe('getGroupChildIds', () => {
  it('returns IDs of child nodes', () => {
    const group = createTestGroupNode({ id: 'g1' })
    const c1 = createTestNode({ id: 'c1', groupId: 'g1' })
    const nodes = { g1: group, c1 }

    expect(getGroupChildIds(nodes, 'g1')).toEqual(['c1'])
  })
})

describe('isAncestorOf', () => {
  it('returns true when nodeId is a descendant of ancestorId', () => {
    const g1 = createTestGroupNode({ id: 'g1' })
    const g2 = createTestGroupNode({ id: 'g2', groupId: 'g1' })
    const nodes = { g1, g2 }

    expect(isAncestorOf(nodes, 'g1', 'g2')).toBe(true)
  })

  it('returns false when no ancestor relationship', () => {
    const g1 = createTestGroupNode({ id: 'g1' })
    const g2 = createTestGroupNode({ id: 'g2' })
    const nodes = { g1, g2 }

    expect(isAncestorOf(nodes, 'g1', 'g2')).toBe(false)
  })

  it('detects multi-level ancestry', () => {
    const g1 = createTestGroupNode({ id: 'g1' })
    const g2 = createTestGroupNode({ id: 'g2', groupId: 'g1' })
    const g3 = createTestGroupNode({ id: 'g3', groupId: 'g2' })
    const nodes = { g1, g2, g3 }

    expect(isAncestorOf(nodes, 'g1', 'g3')).toBe(true)
  })
})

describe('getAllDescendants', () => {
  it('returns direct children', () => {
    const g1 = createTestGroupNode({ id: 'g1' })
    const c1 = createTestNode({ id: 'c1', groupId: 'g1' })
    const c2 = createTestNode({ id: 'c2', groupId: 'g1' })
    const nodes = { g1, c1, c2 }

    const result = getAllDescendants(nodes, 'g1')
    expect(result.sort()).toEqual(['c1', 'c2'])
  })

  it('returns nested descendants recursively', () => {
    const g1 = createTestGroupNode({ id: 'g1' })
    const g2 = createTestGroupNode({ id: 'g2', groupId: 'g1' })
    const c1 = createTestNode({ id: 'c1', groupId: 'g2' })
    const c2 = createTestNode({ id: 'c2', groupId: 'g1' })
    const nodes = { g1, g2, c1, c2 }

    const result = getAllDescendants(nodes, 'g1')
    expect(result.sort()).toEqual(['c1', 'c2', 'g2'])
  })

  it('handles 3+ levels of nesting', () => {
    const g1 = createTestGroupNode({ id: 'g1' })
    const g2 = createTestGroupNode({ id: 'g2', groupId: 'g1' })
    const g3 = createTestGroupNode({ id: 'g3', groupId: 'g2' })
    const c1 = createTestNode({ id: 'c1', groupId: 'g3' })
    const nodes = { g1, g2, g3, c1 }

    const result = getAllDescendants(nodes, 'g1')
    expect(result.sort()).toEqual(['c1', 'g2', 'g3'])
  })

  it('returns empty for group with no children', () => {
    const g1 = createTestGroupNode({ id: 'g1' })
    const nodes = { g1 }

    expect(getAllDescendants(nodes, 'g1')).toEqual([])
  })
})

describe('getGroupDepth', () => {
  it('returns 0 for a top-level group', () => {
    const g1 = createTestGroupNode({ id: 'g1' })
    const nodes = { g1 }

    expect(getGroupDepth(nodes, 'g1')).toBe(0)
  })

  it('returns 1 for a group inside another group', () => {
    const g1 = createTestGroupNode({ id: 'g1' })
    const g2 = createTestGroupNode({ id: 'g2', groupId: 'g1' })
    const nodes = { g1, g2 }

    expect(getGroupDepth(nodes, 'g2')).toBe(1)
  })

  it('returns 2 for a doubly nested group', () => {
    const g1 = createTestGroupNode({ id: 'g1' })
    const g2 = createTestGroupNode({ id: 'g2', groupId: 'g1' })
    const g3 = createTestGroupNode({ id: 'g3', groupId: 'g2' })
    const nodes = { g1, g2, g3 }

    expect(getGroupDepth(nodes, 'g3')).toBe(2)
  })
})

describe('getMaxDescendantDepth', () => {
  it('returns 0 for a group with no sub-groups', () => {
    const g1 = createTestGroupNode({ id: 'g1' })
    const c1 = createTestNode({ id: 'c1', groupId: 'g1' })
    const nodes = { g1, c1 }

    expect(getMaxDescendantDepth(nodes, 'g1')).toBe(0)
  })

  it('returns 1 for a group containing one sub-group', () => {
    const g1 = createTestGroupNode({ id: 'g1' })
    const g2 = createTestGroupNode({ id: 'g2', groupId: 'g1' })
    const nodes = { g1, g2 }

    expect(getMaxDescendantDepth(nodes, 'g1')).toBe(1)
  })

  it('returns 2 for a group containing nested sub-groups', () => {
    const g1 = createTestGroupNode({ id: 'g1' })
    const g2 = createTestGroupNode({ id: 'g2', groupId: 'g1' })
    const g3 = createTestGroupNode({ id: 'g3', groupId: 'g2' })
    const nodes = { g1, g2, g3 }

    expect(getMaxDescendantDepth(nodes, 'g1')).toBe(2)
  })

  it('returns max depth across multiple branches', () => {
    const g1 = createTestGroupNode({ id: 'g1' })
    const g2 = createTestGroupNode({ id: 'g2', groupId: 'g1' })
    const g3 = createTestGroupNode({ id: 'g3', groupId: 'g1' })
    const g4 = createTestGroupNode({ id: 'g4', groupId: 'g3' })
    const nodes = { g1, g2, g3, g4 }

    // g1 → g2 (depth 1), g1 → g3 → g4 (depth 2)
    expect(getMaxDescendantDepth(nodes, 'g1')).toBe(2)
  })

  it('each group in a 3-level hierarchy reports correct descendant depth', () => {
    const g1 = createTestGroupNode({ id: 'g1' })
    const g2 = createTestGroupNode({ id: 'g2', groupId: 'g1' })
    const g3 = createTestGroupNode({ id: 'g3', groupId: 'g2' })
    const c1 = createTestNode({ id: 'c1', groupId: 'g3' })
    const nodes = { g1, g2, g3, c1 }

    // g1 contains g2 contains g3 contains c1
    expect(getMaxDescendantDepth(nodes, 'g1')).toBe(2) // g1 → g2 → g3
    expect(getMaxDescendantDepth(nodes, 'g2')).toBe(1) // g2 → g3
    expect(getMaxDescendantDepth(nodes, 'g3')).toBe(0) // g3 has no sub-groups
  })

  it('descendant depth is independent of ancestor depth', () => {
    const g1 = createTestGroupNode({ id: 'g1' })
    const g2 = createTestGroupNode({ id: 'g2', groupId: 'g1' })
    const g3 = createTestGroupNode({ id: 'g3', groupId: 'g2' })
    const g4 = createTestGroupNode({ id: 'g4', groupId: 'g3' })
    const nodes = { g1, g2, g3, g4 }

    // g1 → g2 → g3 → g4 (4 levels total)
    // Each group's descendant depth should NOT include ancestors
    expect(getMaxDescendantDepth(nodes, 'g1')).toBe(3) // g2, g3, g4 below
    expect(getMaxDescendantDepth(nodes, 'g2')).toBe(2) // g3, g4 below
    expect(getMaxDescendantDepth(nodes, 'g3')).toBe(1) // g4 below
    expect(getMaxDescendantDepth(nodes, 'g4')).toBe(0) // nothing below

    // Meanwhile ancestor depth (getGroupDepth) measures upward
    expect(getGroupDepth(nodes, 'g1')).toBe(0)
    expect(getGroupDepth(nodes, 'g2')).toBe(1)
    expect(getGroupDepth(nodes, 'g3')).toBe(2)
    expect(getGroupDepth(nodes, 'g4')).toBe(3)
  })

  it('handles non-group children without counting them as depth', () => {
    const g1 = createTestGroupNode({ id: 'g1' })
    const n1 = createTestNode({ id: 'n1', groupId: 'g1' })
    const n2 = createTestNode({ id: 'n2', groupId: 'g1' })
    const nodes = { g1, n1, n2 }

    // Non-group children don't add descendant depth
    expect(getMaxDescendantDepth(nodes, 'g1')).toBe(0)
  })

  it('handles circular references without infinite loop', () => {
    // Simulate corrupted data: g1 → g2 → g1
    const g1 = createTestGroupNode({ id: 'g1', groupId: 'g2' })
    const g2 = createTestGroupNode({ id: 'g2', groupId: 'g1' })
    const nodes = { g1, g2 }

    // Should terminate without error due to visited-set guard
    expect(getMaxDescendantDepth(nodes, 'g1')).toBeDefined()
  })
})

describe('isNodeInGroup', () => {
  it('returns true when node has groupId', () => {
    const node = createTestNode({ id: 'c1', groupId: 'g1' })
    expect(isNodeInGroup(node)).toBe(true)
  })

  it('returns false when node has no groupId', () => {
    const node = createTestNode({ id: 'n1' })
    expect(isNodeInGroup(node)).toBe(false)
  })
})

describe('deleteGroupKeepChildren', () => {
  it('removes the group node but keeps children', () => {
    const group = createTestGroupNode({ id: 'g1' })
    const c1 = createTestNode({ id: 'c1', groupId: 'g1' })
    const c2 = createTestNode({ id: 'c2', groupId: 'g1' })
    const nodes = { g1: group, c1, c2 }

    const result = deleteGroupKeepChildren(nodes, {}, 'g1')
    expect(result.nodes['g1']).toBeUndefined()
    expect(result.nodes['c1']).toBeDefined()
    expect(result.nodes['c2']).toBeDefined()
    expect(result.nodes['c1'].groupId).toBeUndefined()
    expect(result.nodes['c2'].groupId).toBeUndefined()
  })

  it('re-parents children to the parent group when nested', () => {
    const g1 = createTestGroupNode({ id: 'g1' })
    const g2 = createTestGroupNode({ id: 'g2', groupId: 'g1' })
    const c1 = createTestNode({ id: 'c1', groupId: 'g2' })
    const nodes = { g1, g2, c1 }

    const result = deleteGroupKeepChildren(nodes, {}, 'g2')
    expect(result.nodes['g2']).toBeUndefined()
    expect(result.nodes['c1'].groupId).toBe('g1')
  })

  it('removes edges connected to the group node', () => {
    const group = createTestGroupNode({ id: 'g1' })
    const c1 = createTestNode({ id: 'c1', groupId: 'g1' })
    const ext = createTestNode({ id: 'ext' })
    const nodes = { g1: group, c1, ext }
    const edges = {
      e1: createTestEdge({ id: 'e1', source: 'g1', target: 'ext' }),
      e2: createTestEdge({ id: 'e2', source: 'c1', target: 'ext' }),
    }

    const result = deleteGroupKeepChildren(nodes, edges, 'g1')
    expect(Object.keys(result.edges)).toEqual(['e2'])
  })
})

describe('deleteGroupWithChildren', () => {
  it('removes the group and all its children', () => {
    const group = createTestGroupNode({ id: 'g1' })
    const c1 = createTestNode({ id: 'c1', groupId: 'g1' })
    const c2 = createTestNode({ id: 'c2', groupId: 'g1' })
    const other = createTestNode({ id: 'n1' })
    const nodes = { g1: group, c1, c2, n1: other }

    const result = deleteGroupWithChildren(nodes, {}, 'g1')
    expect(Object.keys(result.nodes)).toEqual(['n1'])
  })

  it('removes nested groups and their children recursively', () => {
    const g1 = createTestGroupNode({ id: 'g1' })
    const g2 = createTestGroupNode({ id: 'g2', groupId: 'g1' })
    const c1 = createTestNode({ id: 'c1', groupId: 'g2' })
    const other = createTestNode({ id: 'n1' })
    const nodes = { g1, g2, c1, n1: other }

    const result = deleteGroupWithChildren(nodes, {}, 'g1')
    expect(Object.keys(result.nodes)).toEqual(['n1'])
  })

  it('removes all edges connected to group or children', () => {
    const group = createTestGroupNode({ id: 'g1' })
    const c1 = createTestNode({ id: 'c1', groupId: 'g1' })
    const other = createTestNode({ id: 'n1' })
    const nodes = { g1: group, c1, n1: other }
    const edges = {
      e1: createTestEdge({ id: 'e1', source: 'c1', target: 'n1' }),
      e2: createTestEdge({ id: 'e2', source: 'n1', target: 'g1' }),
    }

    const result = deleteGroupWithChildren(nodes, edges, 'g1')
    expect(Object.keys(result.edges)).toEqual([])
  })
})

describe('getGroupBoundaryEdges', () => {
  it('returns edges that cross the group boundary', () => {
    const group = createTestGroupNode({ id: 'g1' })
    const c1 = createTestNode({ id: 'c1', groupId: 'g1' })
    const ext = createTestNode({ id: 'ext' })
    const nodes = { g1: group, c1, ext }
    const edges = {
      e1: createTestEdge({ id: 'e1', source: 'c1', target: 'ext' }),
      e2: createTestEdge({ id: 'e2', source: 'ext', target: 'c1' }),
      e3: createTestEdge({ id: 'e3', source: 'ext', target: 'ext' }),
    }

    const boundary = getGroupBoundaryEdges(nodes, edges, 'g1')
    expect(boundary).toHaveLength(2)
    expect(boundary.map((e) => e.id).sort()).toEqual(['e1', 'e2'])
  })

  it('returns empty for group with no external connections', () => {
    const group = createTestGroupNode({ id: 'g1' })
    const c1 = createTestNode({ id: 'c1', groupId: 'g1' })
    const c2 = createTestNode({ id: 'c2', groupId: 'g1' })
    const nodes = { g1: group, c1, c2 }
    const edges = {
      e1: createTestEdge({ id: 'e1', source: 'c1', target: 'c2' }),
    }

    expect(getGroupBoundaryEdges(nodes, edges, 'g1')).toHaveLength(0)
  })
})

describe('getInternalEdges', () => {
  it('returns edges between children of the same group', () => {
    const group = createTestGroupNode({ id: 'g1' })
    const c1 = createTestNode({ id: 'c1', groupId: 'g1' })
    const c2 = createTestNode({ id: 'c2', groupId: 'g1' })
    const ext = createTestNode({ id: 'ext' })
    const nodes = { g1: group, c1, c2, ext }
    const edges = {
      e1: createTestEdge({ id: 'e1', source: 'c1', target: 'c2' }),
      e2: createTestEdge({ id: 'e2', source: 'c1', target: 'ext' }),
    }

    const internal = getInternalEdges(nodes, edges, 'g1')
    expect(internal).toHaveLength(1)
    expect(internal[0].id).toBe('e1')
  })

  it('returns empty when no internal edges exist', () => {
    const group = createTestGroupNode({ id: 'g1' })
    const c1 = createTestNode({ id: 'c1', groupId: 'g1' })
    const nodes = { g1: group, c1 }

    expect(getInternalEdges(nodes, {}, 'g1')).toHaveLength(0)
  })
})
