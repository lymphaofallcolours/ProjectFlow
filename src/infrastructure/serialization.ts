import type { Campaign } from '@/domain/types'
import { CURRENT_SCHEMA_VERSION } from '@/domain/campaign-operations'

export function serializeCampaign(campaign: Campaign): string {
  const data = {
    ...campaign,
    schemaVersion: CURRENT_SCHEMA_VERSION,
  }
  return JSON.stringify(data, null, 2)
}

export function deserializeCampaign(json: string): Campaign {
  const data: unknown = JSON.parse(json)

  if (!validateCampaignSchema(data)) {
    throw new Error('Invalid campaign file: missing required fields')
  }

  return data
}

export function validateCampaignSchema(data: unknown): data is Campaign {
  if (typeof data !== 'object' || data === null) return false

  const obj = data as Record<string, unknown>

  const requiredStrings = ['id', 'name', 'createdAt', 'updatedAt']
  for (const key of requiredStrings) {
    if (typeof obj[key] !== 'string') return false
  }

  if (typeof obj.schemaVersion !== 'number') return false

  if (typeof obj.graph !== 'object' || obj.graph === null) return false
  const graph = obj.graph as Record<string, unknown>
  if (typeof graph.nodes !== 'object' || graph.nodes === null) return false
  if (typeof graph.edges !== 'object' || graph.edges === null) return false

  if (typeof obj.settings !== 'object' || obj.settings === null) return false

  return true
}
