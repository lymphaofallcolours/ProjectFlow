import { describe, it, expect, beforeEach } from 'vitest'
import { useGraphStore } from '@/application/graph-store'
import { useCampaignStore } from '@/application/campaign-store'
import { useEntityStore } from '@/application/entity-store'
import { assembleCampaign, hydrateCampaign } from '@/application/campaign-actions'
import { serializeCampaign, deserializeCampaign } from '@/infrastructure/serialization'
import { serializeSubgraph, deserializeSubgraph } from '@/domain/subgraph-operations'
import { pasteSubgraph } from '@/domain/graph-operations'

beforeEach(() => {
  useGraphStore.getState().reset()
  useCampaignStore.getState().reset()
  useEntityStore.getState().reset()
})

describe('Group operations roundtrip (integration)', () => {
  it('group relationships survive save/load roundtrip', () => {
    const store = useGraphStore.getState()
    const groupId = store.createGroup('narration', { x: 0, y: 0 }, 'Act 1')
    const child1 = store.addNode('event', { x: 50, y: 50 }, 'Scene A')
    const child2 = store.addNode('combat', { x: 100, y: 50 }, 'Scene B')
    store.addToGroup(groupId, [child1, child2])

    const json = serializeCampaign(assembleCampaign())
    useGraphStore.getState().reset()
    hydrateCampaign(deserializeCampaign(json))

    const restored = useGraphStore.getState().nodes
    expect(restored[groupId].isGroup).toBe(true)
    expect(restored[groupId].label).toBe('Act 1')
    expect(restored[child1].groupId).toBe(groupId)
    expect(restored[child2].groupId).toBe(groupId)
  })

  it('collapse state persists across save/load', () => {
    const store = useGraphStore.getState()
    const groupId = store.createGroup('narration', { x: 0, y: 0 }, 'Collapsed')
    const childId = store.addNode('event', { x: 50, y: 50 }, 'Hidden')
    store.addToGroup(groupId, [childId])
    store.toggleGroupCollapsed(groupId)

    const json = serializeCampaign(assembleCampaign())
    useGraphStore.getState().reset()
    hydrateCampaign(deserializeCampaign(json))

    expect(useGraphStore.getState().nodes[groupId].collapsed).toBe(true)
  })

  it('subgraph export includes group and children', () => {
    const groupId = useGraphStore.getState().createGroup('narration', { x: 0, y: 0 }, 'Group')
    const child = useGraphStore.getState().addNode('event', { x: 50, y: 50 }, 'Child')
    useGraphStore.getState().addToGroup(groupId, [child])
    useGraphStore.getState().connectNodes(child, groupId)

    // Export just the group — extractSubgraph auto-includes children
    const { nodes, edges } = useGraphStore.getState()
    const json = serializeSubgraph(nodes, edges, [groupId])
    const subgraph = deserializeSubgraph(json)

    expect(subgraph.nodes).toHaveLength(2) // group + child
    expect(subgraph.edges).toHaveLength(1)
  })

  it('subgraph import preserves group structure', () => {
    const groupId = useGraphStore.getState().createGroup('narration', { x: 0, y: 0 }, 'Source Group')
    const child = useGraphStore.getState().addNode('social', { x: 50, y: 50 }, 'Source Child')
    useGraphStore.getState().addToGroup(groupId, [child])

    const { nodes, edges } = useGraphStore.getState()
    const json = serializeSubgraph(nodes, edges, [groupId])
    const subgraph = deserializeSubgraph(json)

    // Paste into a fresh graph
    useGraphStore.getState().reset()
    const result = pasteSubgraph(
      subgraph.nodes,
      subgraph.edges,
      { x: 100, y: 100 },
    )

    const newNodes = Object.values(result.nodes)
    const newGroup = newNodes.find((n) => n.isGroup)
    const newChild = newNodes.find((n) => !n.isGroup)

    expect(newGroup).toBeTruthy()
    expect(newChild).toBeTruthy()
    expect(newChild!.groupId).toBe(newGroup!.id)
    // IDs should be remapped (different from originals)
    expect(newGroup!.id).not.toBe(groupId)
    expect(newChild!.id).not.toBe(child)
  })

  it('delete group cascade removes children', () => {
    const store = useGraphStore.getState()
    const groupId = store.createGroup('narration', { x: 0, y: 0 }, 'Group')
    const child1 = store.addNode('event', { x: 50, y: 50 }, 'C1')
    const child2 = store.addNode('event', { x: 100, y: 50 }, 'C2')
    const external = store.addNode('combat', { x: 200, y: 0 }, 'Ext')
    store.addToGroup(groupId, [child1, child2])
    store.connectNodes(child1, external)

    store.deleteGroup(groupId, true)

    const state = useGraphStore.getState()
    expect(state.nodes[groupId]).toBeUndefined()
    expect(state.nodes[child1]).toBeUndefined()
    expect(state.nodes[child2]).toBeUndefined()
    expect(state.nodes[external]).toBeTruthy()
    // Edge from child1→external should be removed
    expect(Object.keys(state.edges)).toHaveLength(0)
  })

  it('delete group ungroup keeps children', () => {
    const store = useGraphStore.getState()
    const groupId = store.createGroup('narration', { x: 0, y: 0 }, 'Group')
    const child = store.addNode('event', { x: 50, y: 50 }, 'Child')
    store.addToGroup(groupId, [child])

    store.deleteGroup(groupId, false)

    const state = useGraphStore.getState()
    expect(state.nodes[groupId]).toBeUndefined()
    expect(state.nodes[child]).toBeTruthy()
    expect(state.nodes[child].groupId).toBeUndefined()
  })

  it('move group moves children by same delta', () => {
    const store = useGraphStore.getState()
    const groupId = store.createGroup('narration', { x: 0, y: 0 }, 'Group')
    const child = store.addNode('event', { x: 50, y: 50 }, 'Child')
    store.addToGroup(groupId, [child])

    store.moveNode(groupId, { x: 100, y: 100 })

    const state = useGraphStore.getState()
    expect(state.nodes[groupId].position).toEqual({ x: 100, y: 100 })
    // Child should move by same delta (+100, +100)
    expect(state.nodes[child].position).toEqual({ x: 150, y: 150 })
  })

  it('clipboard: copy group + paste preserves group structure', () => {
    const store = useGraphStore.getState()
    const groupId = store.createGroup('narration', { x: 0, y: 0 }, 'Group')
    const child = store.addNode('event', { x: 50, y: 50 }, 'Child')
    store.addToGroup(groupId, [child])
    store.selectNodes([groupId, child])

    store.copySelectedNodes()
    store.pasteClipboard()

    const state = useGraphStore.getState()
    const allNodes = Object.values(state.nodes)
    // Should have 4 nodes: original group, original child, pasted group, pasted child
    expect(allNodes).toHaveLength(4)

    const pastedGroup = allNodes.find((n) => n.isGroup && n.id !== groupId)
    const pastedChild = allNodes.find((n) => !n.isGroup && n.id !== child)
    expect(pastedGroup).toBeTruthy()
    expect(pastedChild).toBeTruthy()
    expect(pastedChild!.groupId).toBe(pastedGroup!.id)
  })
})
