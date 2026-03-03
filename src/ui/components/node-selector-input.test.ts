import { describe, it, expect, beforeEach } from 'vitest'
import { useGraphStore } from '@/application/graph-store'

describe('edge rewire via store', () => {
  beforeEach(() => {
    useGraphStore.getState().reset()
  })

  it('rewires edge source via store action', () => {
    const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
    const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 })
    const c = useGraphStore.getState().addNode('combat', { x: 200, y: 0 })
    useGraphStore.getState().connectNodes(a, b)
    const edges = Object.values(useGraphStore.getState().edges)
    const edgeId = edges[0].id

    useGraphStore.getState().rewireEdge(edgeId, c)
    expect(useGraphStore.getState().edges[edgeId].source).toBe(c)
    expect(useGraphStore.getState().edges[edgeId].target).toBe(b)
  })

  it('rewires edge target via store action', () => {
    const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
    const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 })
    const c = useGraphStore.getState().addNode('combat', { x: 200, y: 0 })
    useGraphStore.getState().connectNodes(a, b)
    const edges = Object.values(useGraphStore.getState().edges)
    const edgeId = edges[0].id

    useGraphStore.getState().rewireEdge(edgeId, undefined, c)
    expect(useGraphStore.getState().edges[edgeId].source).toBe(a)
    expect(useGraphStore.getState().edges[edgeId].target).toBe(c)
  })
})
