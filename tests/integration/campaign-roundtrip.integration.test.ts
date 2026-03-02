import { describe, it, expect, beforeEach } from 'vitest'
import { useGraphStore } from '@/application/graph-store'
import { useCampaignStore } from '@/application/campaign-store'
import { assembleCampaign, hydrateCampaign, newCampaignAction } from '@/application/campaign-actions'
import { serializeCampaign, deserializeCampaign } from '@/infrastructure/serialization'

describe('Campaign roundtrip (integration)', () => {
  beforeEach(() => {
    useGraphStore.getState().reset()
    useCampaignStore.getState().reset()
  })

  it('serializes and deserializes a campaign with nodes and edges', () => {
    // Arrange: build a small graph via store actions
    const store = useGraphStore.getState()
    const id1 = store.addNode('event', { x: 100, y: 200 }, 'Ambush')
    const id2 = store.addNode('combat', { x: 300, y: 200 }, 'Boss Fight')
    store.connectNodes(id1, id2)
    store.updateField(id1, 'script', { markdown: 'The party is ambushed!' })
    useCampaignStore.getState().setName('Dark Heresy Campaign')

    // Act: serialize, then deserialize
    const campaign = assembleCampaign()
    const json = serializeCampaign(campaign)
    const restored = deserializeCampaign(json)

    // Assert: campaign metadata
    expect(restored.name).toBe('Dark Heresy Campaign')
    expect(restored.schemaVersion).toBe(1)

    // Assert: graph structure
    expect(Object.keys(restored.graph.nodes)).toHaveLength(2)
    expect(Object.keys(restored.graph.edges)).toHaveLength(1)
    expect(restored.graph.nodes[id1].label).toBe('Ambush')
    expect(restored.graph.nodes[id2].label).toBe('Boss Fight')
    expect(restored.graph.nodes[id2].sceneType).toBe('combat')

    // Assert: field data preserved
    expect(restored.graph.nodes[id1].fields.script.markdown).toBe('The party is ambushed!')
  })

  it('hydrates stores from a deserialized campaign', () => {
    // Arrange: build and serialize
    const store = useGraphStore.getState()
    const id1 = store.addNode('narration', { x: 0, y: 0 }, 'Intro')
    store.setScrollDirection('vertical')
    useCampaignStore.getState().setName('Test Session')

    const campaign = assembleCampaign()
    const json = serializeCampaign(campaign)

    // Reset stores to simulate fresh load
    useGraphStore.getState().reset()
    useCampaignStore.getState().reset()
    expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(0)

    // Act: restore
    const restored = deserializeCampaign(json)
    hydrateCampaign(restored)

    // Assert: stores are hydrated
    const graphState = useGraphStore.getState()
    expect(Object.keys(graphState.nodes)).toHaveLength(1)
    expect(graphState.nodes[id1].label).toBe('Intro')
    expect(graphState.scrollDirection).toBe('vertical')
    expect(useCampaignStore.getState().name).toBe('Test Session')
  })

  it('preserves all field types through the roundtrip', () => {
    const store = useGraphStore.getState()
    const id = store.addNode('social', { x: 0, y: 0 }, 'Tavern Scene')

    // Populate each field type
    store.updateField(id, 'script', { markdown: 'Read this aloud' })
    store.updateField(id, 'dialogues', [
      { entityRef: '!@Voss', lines: 'Welcome, travelers.' },
    ])
    store.updateField(id, 'soundtrack', [
      { trackName: 'Tavern Ambience', note: 'Low volume' },
    ])
    store.updateField(id, 'diceRolls', [
      { description: 'Perception', formula: '1d100 vs 45' },
    ])
    store.updateField(id, 'custom', [
      { label: 'MOOD', content: { markdown: 'Tense but hopeful' } },
    ])
    store.updateField(id, 'gmNotes', { markdown: 'Secret door behind bar' })
    store.updateField(id, 'vibe', { markdown: 'Warm, amber lighting' })
    store.updateField(id, 'events', { markdown: 'Bar fight at midnight' })
    store.updateField(id, 'combat', { markdown: 'No combat expected' })
    store.updateField(id, 'characters', { markdown: '@Alfa, !@Voss' })
    store.updateField(id, 'secrets', { markdown: 'Cult meeting upstairs' })

    useCampaignStore.getState().setName('Field Test')

    // Roundtrip
    const json = serializeCampaign(assembleCampaign())
    useGraphStore.getState().reset()
    useCampaignStore.getState().reset()
    hydrateCampaign(deserializeCampaign(json))

    const node = useGraphStore.getState().nodes[id]
    expect(node.fields.script.markdown).toBe('Read this aloud')
    expect(node.fields.dialogues).toHaveLength(1)
    expect(node.fields.dialogues[0].entityRef).toBe('!@Voss')
    expect(node.fields.soundtrack).toHaveLength(1)
    expect(node.fields.soundtrack[0].trackName).toBe('Tavern Ambience')
    expect(node.fields.diceRolls).toHaveLength(1)
    expect(node.fields.diceRolls[0].formula).toBe('1d100 vs 45')
    expect(node.fields.custom).toHaveLength(1)
    expect(node.fields.custom[0].label).toBe('MOOD')
    expect(node.fields.gmNotes.markdown).toBe('Secret door behind bar')
    expect(node.fields.secrets.markdown).toBe('Cult meeting upstairs')
  })

  it('newCampaignAction resets to clean state', () => {
    const store = useGraphStore.getState()
    store.addNode('event', { x: 0, y: 0 }, 'Old Node')
    useCampaignStore.getState().setName('Old Campaign')

    newCampaignAction('Fresh Start')

    expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(0)
    expect(useCampaignStore.getState().name).toBe('Fresh Start')
  })

  it('rejects invalid JSON on deserialization', () => {
    expect(() => deserializeCampaign('not json')).toThrow()
    expect(() => deserializeCampaign('{}')).toThrow('Invalid campaign file')
    expect(() => deserializeCampaign('{"id":"x"}')).toThrow('Invalid campaign file')
  })
})
