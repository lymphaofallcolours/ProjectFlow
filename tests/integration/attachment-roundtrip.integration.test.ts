import { describe, it, expect, beforeEach } from 'vitest'
import { useGraphStore } from '@/application/graph-store'
import { useCampaignStore } from '@/application/campaign-store'
import { useEntityStore } from '@/application/entity-store'
import { assembleCampaign, hydrateCampaign } from '@/application/campaign-actions'
import { serializeCampaign, deserializeCampaign } from '@/infrastructure/serialization'
import { estimateCampaignSize } from '@/domain/attachment-operations'

beforeEach(() => {
  useGraphStore.getState().reset()
  useCampaignStore.getState().reset()
  useEntityStore.getState().reset()
})

describe('Attachment roundtrip (integration)', () => {
  it('attachment data survives save/load roundtrip', () => {
    const store = useGraphStore.getState()
    const nodeId = store.addNode('event', { x: 0, y: 0 }, 'Map Scene')
    store.updateField(nodeId, 'script', {
      markdown: 'Show the map',
      attachments: [
        {
          id: 'att-1',
          filename: 'dungeon-map.png',
          mimeType: 'image/png',
          dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk',
        },
      ],
    })

    const json = serializeCampaign(assembleCampaign())
    useGraphStore.getState().reset()
    hydrateCampaign(deserializeCampaign(json))

    const node = useGraphStore.getState().nodes[nodeId]
    expect(node.fields.script.attachments).toHaveLength(1)
    expect(node.fields.script.attachments![0].filename).toBe('dungeon-map.png')
    expect(node.fields.script.attachments![0].mimeType).toBe('image/png')
    expect(node.fields.script.attachments![0].dataUrl).toContain('data:image/png;base64')
  })

  it('multiple attachments on same field survive roundtrip', () => {
    const store = useGraphStore.getState()
    const nodeId = store.addNode('narration', { x: 0, y: 0 }, 'Gallery')
    store.updateField(nodeId, 'gmNotes', {
      markdown: 'Reference images',
      attachments: [
        { id: 'img-1', filename: 'ref1.png', mimeType: 'image/png', dataUrl: 'data:image/png;base64,abc' },
        { id: 'img-2', filename: 'ref2.jpg', mimeType: 'image/jpeg', dataUrl: 'data:image/jpeg;base64,xyz' },
        { id: 'img-3', filename: 'ref3.webp', mimeType: 'image/webp', dataUrl: 'data:image/webp;base64,123' },
      ],
    })

    const json = serializeCampaign(assembleCampaign())
    useGraphStore.getState().reset()
    hydrateCampaign(deserializeCampaign(json))

    const node = useGraphStore.getState().nodes[nodeId]
    expect(node.fields.gmNotes.attachments).toHaveLength(3)
    expect(node.fields.gmNotes.attachments![0].filename).toBe('ref1.png')
    expect(node.fields.gmNotes.attachments![2].filename).toBe('ref3.webp')
  })

  it('campaign size estimation with attachments', () => {
    const store = useGraphStore.getState()
    const nodeId = store.addNode('event', { x: 0, y: 0 }, 'Node')
    store.updateField(nodeId, 'script', {
      markdown: 'With attachment',
      attachments: [
        { id: 'big', filename: 'large.png', mimeType: 'image/png', dataUrl: 'data:image/png;base64,' + 'A'.repeat(1000) },
      ],
    })

    const json = serializeCampaign(assembleCampaign())
    const result = estimateCampaignSize(json)

    expect(result.sizeBytes).toBeGreaterThan(1000)
    expect(result.warning).toBe(false) // Well under 50MB
  })

  it('backward compat: campaign without attachments loads fine', () => {
    const store = useGraphStore.getState()
    const nodeId = store.addNode('event', { x: 0, y: 0 }, 'Old Node')
    store.updateField(nodeId, 'script', { markdown: 'No attachments here' })

    const json = serializeCampaign(assembleCampaign())

    // Verify no attachments key in serialized data
    const parsed = JSON.parse(json)
    expect(parsed.graph.nodes[nodeId].fields.script.attachments).toBeUndefined()

    useGraphStore.getState().reset()
    hydrateCampaign(deserializeCampaign(json))

    const node = useGraphStore.getState().nodes[nodeId]
    expect(node.fields.script.markdown).toBe('No attachments here')
    expect(node.fields.script.attachments).toBeUndefined()
  })

  it('custom field attachments survive roundtrip', () => {
    const store = useGraphStore.getState()
    const nodeId = store.addNode('social', { x: 0, y: 0 }, 'Custom')
    store.updateField(nodeId, 'custom', [
      {
        label: 'Maps',
        content: {
          markdown: 'Battle map',
          attachments: [
            { id: 'map-1', filename: 'battle.png', mimeType: 'image/png', dataUrl: 'data:image/png;base64,map' },
          ],
        },
      },
    ])

    const json = serializeCampaign(assembleCampaign())
    useGraphStore.getState().reset()
    hydrateCampaign(deserializeCampaign(json))

    const node = useGraphStore.getState().nodes[nodeId]
    expect(node.fields.custom[0].content.attachments).toHaveLength(1)
    expect(node.fields.custom[0].content.attachments![0].filename).toBe('battle.png')
  })
})
