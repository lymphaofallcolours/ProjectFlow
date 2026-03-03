import { describe, it, expect, beforeEach } from 'vitest'
import { useEntityStore } from '@/application/entity-store'
import { useGraphStore } from '@/application/graph-store'
import { useCampaignStore } from '@/application/campaign-store'
import { assembleCampaign, hydrateCampaign } from '@/application/campaign-actions'
import { serializeCampaign, deserializeCampaign } from '@/infrastructure/serialization'
import { createTestAttachment } from '../fixtures/factories'

describe('Entity profile data roundtrip (integration)', () => {
  beforeEach(() => {
    useEntityStore.getState().reset()
    useGraphStore.getState().reset()
    useCampaignStore.getState().reset()
  })

  it('portrait survives save/load roundtrip', () => {
    const id = useEntityStore.getState().addEntity('pc', 'Alfa')
    const portrait = createTestAttachment({ filename: 'alfa-portrait.png' })
    useEntityStore.getState().setPortrait(id, portrait)

    const json = serializeCampaign(assembleCampaign())
    useEntityStore.getState().reset()
    hydrateCampaign(deserializeCampaign(json))

    const restored = useEntityStore.getState().entities[id]
    expect(restored.portrait).toBeDefined()
    expect(restored.portrait?.filename).toBe('alfa-portrait.png')
    expect(restored.portrait?.dataUrl).toBe(portrait.dataUrl)
  })

  it('relationships survive save/load roundtrip', () => {
    const alfaId = useEntityStore.getState().addEntity('pc', 'Alfa')
    const vossId = useEntityStore.getState().addEntity('npc', 'Voss')
    useEntityStore.getState().addRelationship(alfaId, {
      targetEntityId: vossId,
      type: 'mentor',
      note: 'Trained together',
    })

    const json = serializeCampaign(assembleCampaign())
    useEntityStore.getState().reset()
    hydrateCampaign(deserializeCampaign(json))

    const restored = useEntityStore.getState().entities[alfaId]
    expect(restored.relationships).toHaveLength(1)
    expect(restored.relationships![0].targetEntityId).toBe(vossId)
    expect(restored.relationships![0].type).toBe('mentor')
    expect(restored.relationships![0].note).toBe('Trained together')
  })

  it('custom fields survive save/load roundtrip', () => {
    const id = useEntityStore.getState().addEntity('pc', 'Alfa')
    useEntityStore.getState().updateEntity(id, {
      custom: { Weapon: 'Weapon', Armor: 'Armor' },
    })

    const json = serializeCampaign(assembleCampaign())
    useEntityStore.getState().reset()
    hydrateCampaign(deserializeCampaign(json))

    const restored = useEntityStore.getState().entities[id]
    expect(restored.custom['Weapon']).toBe('Weapon')
    expect(restored.custom['Armor']).toBe('Armor')
  })

  it('status history with manual entries survives save/load roundtrip', () => {
    const id = useEntityStore.getState().addEntity('pc', 'Alfa')
    useEntityStore.getState().addStatus(id, 'node-1', 'wounded', 'Hit in combat')
    useEntityStore.getState().addStatus(id, 'manual', 'promoted')
    useEntityStore.getState().addStatus(id, 'node-2', 'healed')

    const json = serializeCampaign(assembleCampaign())
    useEntityStore.getState().reset()
    hydrateCampaign(deserializeCampaign(json))

    const restored = useEntityStore.getState().entities[id]
    expect(restored.statusHistory).toHaveLength(3)
    expect(restored.statusHistory[0].status).toBe('wounded')
    expect(restored.statusHistory[0].note).toBe('Hit in combat')
    expect(restored.statusHistory[1].status).toBe('promoted')
    expect(restored.statusHistory[1].nodeId).toBe('manual')
    expect(restored.statusHistory[2].status).toBe('healed')
  })

  it('backward compat: entity without portrait/relationships loads fine', () => {
    const id = useEntityStore.getState().addEntity('pc', 'Alfa')

    const json = serializeCampaign(assembleCampaign())
    useEntityStore.getState().reset()
    hydrateCampaign(deserializeCampaign(json))

    const restored = useEntityStore.getState().entities[id]
    expect(restored.portrait).toBeUndefined()
    expect(restored.relationships).toBeUndefined()
    expect(restored.custom).toEqual({})
  })
})
