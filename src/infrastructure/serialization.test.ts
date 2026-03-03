import { describe, it, expect } from 'vitest'
import { serializeCampaign, deserializeCampaign, validateCampaignSchema } from './serialization'
import { createTestCampaign } from '../../tests/fixtures/factories'

describe('serializeCampaign', () => {
  it('produces valid JSON', () => {
    const campaign = createTestCampaign()
    const json = serializeCampaign(campaign)
    expect(() => JSON.parse(json)).not.toThrow()
  })

  it('includes schema version', () => {
    const campaign = createTestCampaign()
    const json = serializeCampaign(campaign)
    const parsed = JSON.parse(json)
    expect(parsed.schemaVersion).toBe(1)
  })
})

describe('deserializeCampaign', () => {
  it('roundtrips a campaign without data loss', () => {
    const original = createTestCampaign({ name: 'Test Campaign' })
    const json = serializeCampaign(original)
    const restored = deserializeCampaign(json)

    expect(restored.id).toBe(original.id)
    expect(restored.name).toBe('Test Campaign')
    expect(restored.graph.nodes).toEqual(original.graph.nodes)
    expect(restored.graph.edges).toEqual(original.graph.edges)
    expect(restored.settings).toEqual(original.settings)
    expect(restored.schemaVersion).toBe(1)
  })

  it('throws on invalid JSON', () => {
    expect(() => deserializeCampaign('not json')).toThrow()
  })

  it('throws on missing required fields', () => {
    expect(() => deserializeCampaign('{}')).toThrow('Invalid campaign file')
  })
})

describe('validateCampaignSchema', () => {
  it('returns true for valid campaign', () => {
    const campaign = createTestCampaign()
    expect(validateCampaignSchema(campaign)).toBe(true)
  })

  it('returns false for null', () => {
    expect(validateCampaignSchema(null)).toBe(false)
  })

  it('returns false for missing id', () => {
    const campaign = createTestCampaign()
    const broken = { ...campaign, id: undefined }
    expect(validateCampaignSchema(broken)).toBe(false)
  })

  it('returns false for missing graph', () => {
    const campaign = createTestCampaign()
    const broken = { ...campaign, graph: undefined }
    expect(validateCampaignSchema(broken)).toBe(false)
  })

  it('returns false for missing schemaVersion', () => {
    const campaign = createTestCampaign()
    const broken = { ...campaign, schemaVersion: undefined }
    expect(validateCampaignSchema(broken)).toBe(false)
  })

  it('accepts campaign without playthroughLog (backward compat)', () => {
    const campaign = createTestCampaign()
    const withoutLog = Object.fromEntries(
      Object.entries(campaign).filter(([key]) => key !== 'playthroughLog'),
    )
    expect(validateCampaignSchema(withoutLog)).toBe(true)
  })

  it('returns false for non-array playthroughLog', () => {
    const campaign = createTestCampaign()
    const broken = { ...campaign, playthroughLog: 'not-an-array' }
    expect(validateCampaignSchema(broken)).toBe(false)
  })

  it('accepts campaign with valid playthroughLog array', () => {
    const campaign = createTestCampaign({
      playthroughLog: [
        { id: 's1', sessionDate: '2026-01-01', nodesVisited: [] },
      ],
    })
    expect(validateCampaignSchema(campaign)).toBe(true)
  })
})
