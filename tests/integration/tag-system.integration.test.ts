import { describe, it, expect, beforeEach } from 'vitest'
import { useGraphStore } from '@/application/graph-store'
import { useHistoryStore } from '@/application/history-store'
import { useCampaignStore } from '@/application/campaign-store'
import { useEntityStore } from '@/application/entity-store'
import { useSessionStore } from '@/application/session-store'
import { assembleCampaign, hydrateCampaign } from '@/application/campaign-actions'
import { serializeCampaign, deserializeCampaign } from '@/infrastructure/serialization'

describe('Tag system integration', () => {
  beforeEach(() => {
    useGraphStore.getState().reset()
    useHistoryStore.getState().reset()
    useCampaignStore.getState().reset()
    useEntityStore.getState().reset()
    useSessionStore.getState().reset()
  })

  it('tags survive save/load roundtrip', () => {
    const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 }, 'Tagged Node')
    useGraphStore.getState().setNodeTags(id, ['quest', 'main-arc', 'urgent'])

    // Save
    const campaign = assembleCampaign()
    const json = serializeCampaign(campaign)
    const parsed = deserializeCampaign(json)

    // Reset and reload
    useGraphStore.getState().reset()
    hydrateCampaign(parsed)

    const restored = useGraphStore.getState().nodes[id]
    expect(restored.metadata.tags).toEqual(['quest', 'main-arc', 'urgent'])
  })

  it('undo restores previous tags', () => {
    const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
    useGraphStore.getState().setNodeTags(id, ['v1'])
    useGraphStore.getState().setNodeTags(id, ['v2'])

    useGraphStore.getState().undo()
    expect(useGraphStore.getState().nodes[id].metadata.tags).toEqual(['v1'])
  })

  it('collects all unique tags from multiple nodes', () => {
    const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
    const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 })
    const c = useGraphStore.getState().addNode('combat', { x: 200, y: 0 })
    useGraphStore.getState().setNodeTags(a, ['quest', 'main'])
    useGraphStore.getState().setNodeTags(b, ['main', 'side'])
    useGraphStore.getState().setNodeTags(c, ['combat', 'quest'])

    const nodes = useGraphStore.getState().nodes
    const allTags = new Set<string>()
    for (const node of Object.values(nodes)) {
      for (const tag of node.metadata.tags) allTags.add(tag)
    }
    expect(allTags.size).toBe(4)
    expect(allTags.has('quest')).toBe(true)
    expect(allTags.has('main')).toBe(true)
    expect(allTags.has('side')).toBe(true)
    expect(allTags.has('combat')).toBe(true)
  })

  it('tag filtering selects correct nodes', () => {
    const a = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
    const b = useGraphStore.getState().addNode('narration', { x: 100, y: 0 })
    const c = useGraphStore.getState().addNode('combat', { x: 200, y: 0 })
    useGraphStore.getState().setNodeTags(a, ['quest'])
    useGraphStore.getState().setNodeTags(b, ['quest', 'side'])
    // c has no tags

    // Simulate tag click: select all nodes with tag 'quest'
    const nodes = useGraphStore.getState().nodes
    const matchingIds = Object.values(nodes)
      .filter((n) => n.metadata.tags.includes('quest'))
      .map((n) => n.id)

    useGraphStore.getState().selectNodes(matchingIds)
    const selected = useGraphStore.getState().selectedNodeIds
    expect(selected.size).toBe(2)
    expect(selected.has(a)).toBe(true)
    expect(selected.has(b)).toBe(true)
    expect(selected.has(c)).toBe(false)
  })
})
