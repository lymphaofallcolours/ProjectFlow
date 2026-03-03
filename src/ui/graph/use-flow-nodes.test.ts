import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGraphStore } from '@/application/graph-store'
import { useFlowNodes } from './use-flow-nodes'

beforeEach(() => {
  useGraphStore.getState().reset()
})

describe('useFlowNodes', () => {
  it('returns all nodes when no groups exist', () => {
    useGraphStore.getState().addNode('event', { x: 0, y: 0 }, 'A')
    useGraphStore.getState().addNode('combat', { x: 100, y: 0 }, 'B')

    const { result } = renderHook(() => useFlowNodes())
    expect(result.current.flowNodes).toHaveLength(2)
  })

  it('includes expanded group and its children', () => {
    const groupId = useGraphStore.getState().createGroup('narration', { x: 0, y: 0 }, 'Group')
    const childId = useGraphStore.getState().addNode('event', { x: 50, y: 50 }, 'Child')
    useGraphStore.getState().addToGroup(groupId, [childId])

    const { result } = renderHook(() => useFlowNodes())
    const nodeIds = result.current.flowNodes.map((n) => n.id)
    expect(nodeIds).toContain(groupId)
    expect(nodeIds).toContain(childId)
  })

  it('hides children of collapsed groups', () => {
    const groupId = useGraphStore.getState().createGroup('narration', { x: 0, y: 0 }, 'Group')
    const childId = useGraphStore.getState().addNode('event', { x: 50, y: 50 }, 'Child')
    useGraphStore.getState().addToGroup(groupId, [childId])

    act(() => {
      useGraphStore.getState().toggleGroupCollapsed(groupId)
    })

    const { result } = renderHook(() => useFlowNodes())
    const nodeIds = result.current.flowNodes.map((n) => n.id)
    expect(nodeIds).toContain(groupId)
    expect(nodeIds).not.toContain(childId)
  })

  it('remaps boundary edges to collapsed group node', () => {
    const groupId = useGraphStore.getState().createGroup('narration', { x: 0, y: 0 }, 'Group')
    const childId = useGraphStore.getState().addNode('event', { x: 50, y: 50 }, 'Child')
    const externalId = useGraphStore.getState().addNode('combat', { x: 200, y: 0 }, 'External')
    useGraphStore.getState().addToGroup(groupId, [childId])
    useGraphStore.getState().connectNodes(childId, externalId)

    act(() => {
      useGraphStore.getState().toggleGroupCollapsed(groupId)
    })

    const { result } = renderHook(() => useFlowNodes())
    const edge = result.current.flowEdges[0]
    expect(edge.source).toBe(groupId)
    expect(edge.target).toBe(externalId)
  })

  it('hides internal edges when group is collapsed', () => {
    const groupId = useGraphStore.getState().createGroup('narration', { x: 0, y: 0 }, 'Group')
    const child1 = useGraphStore.getState().addNode('event', { x: 50, y: 50 }, 'C1')
    const child2 = useGraphStore.getState().addNode('event', { x: 100, y: 50 }, 'C2')
    useGraphStore.getState().addToGroup(groupId, [child1, child2])
    useGraphStore.getState().connectNodes(child1, child2)

    act(() => {
      useGraphStore.getState().toggleGroupCollapsed(groupId)
    })

    const { result } = renderHook(() => useFlowNodes())
    // Internal edge between child1→child2 should be hidden (both remap to groupId)
    expect(result.current.flowEdges).toHaveLength(0)
  })

  it('deduplicates remapped edges from multiple children to same target', () => {
    const groupId = useGraphStore.getState().createGroup('narration', { x: 0, y: 0 }, 'Group')
    const child1 = useGraphStore.getState().addNode('event', { x: 50, y: 50 }, 'C1')
    const child2 = useGraphStore.getState().addNode('event', { x: 100, y: 50 }, 'C2')
    const externalId = useGraphStore.getState().addNode('combat', { x: 200, y: 0 }, 'External')
    useGraphStore.getState().addToGroup(groupId, [child1, child2])
    useGraphStore.getState().connectNodes(child1, externalId)
    useGraphStore.getState().connectNodes(child2, externalId)

    act(() => {
      useGraphStore.getState().toggleGroupCollapsed(groupId)
    })

    const { result } = renderHook(() => useFlowNodes())
    // Both child→external edges should merge into a single group→external edge
    const edgesFromGroup = result.current.flowEdges.filter(
      (e) => e.source === groupId && e.target === externalId,
    )
    expect(edgesFromGroup).toHaveLength(1)
  })

  it('shows all edges when group is expanded', () => {
    const groupId = useGraphStore.getState().createGroup('narration', { x: 0, y: 0 }, 'Group')
    const child1 = useGraphStore.getState().addNode('event', { x: 50, y: 50 }, 'C1')
    const child2 = useGraphStore.getState().addNode('event', { x: 100, y: 50 }, 'C2')
    useGraphStore.getState().addToGroup(groupId, [child1, child2])
    useGraphStore.getState().connectNodes(child1, child2)

    const { result } = renderHook(() => useFlowNodes())
    // Group is expanded, so internal edge should be visible
    expect(result.current.flowEdges).toHaveLength(1)
    expect(result.current.flowEdges[0].source).toBe(child1)
    expect(result.current.flowEdges[0].target).toBe(child2)
  })

  it('re-shows children after expanding a collapsed group', () => {
    const groupId = useGraphStore.getState().createGroup('narration', { x: 0, y: 0 }, 'Group')
    const childId = useGraphStore.getState().addNode('event', { x: 50, y: 50 }, 'Child')
    useGraphStore.getState().addToGroup(groupId, [childId])

    // Collapse
    act(() => {
      useGraphStore.getState().toggleGroupCollapsed(groupId)
    })

    const { result, rerender } = renderHook(() => useFlowNodes())
    expect(result.current.flowNodes.map((n) => n.id)).not.toContain(childId)

    // Expand
    act(() => {
      useGraphStore.getState().toggleGroupCollapsed(groupId)
    })
    rerender()
    expect(result.current.flowNodes.map((n) => n.id)).toContain(childId)
  })
})
