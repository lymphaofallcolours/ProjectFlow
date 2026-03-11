import type { Campaign, StoryNode } from '@/domain/types'
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

  // Migrate v1 → v2: add missing conditions field to nodes
  if (data.schemaVersion < 2) {
    const nodes = data.graph.nodes as Record<string, StoryNode>
    for (const node of Object.values(nodes)) {
      if (!node.fields.conditions) {
        node.fields.conditions = []
      }
    }
    data.schemaVersion = CURRENT_SCHEMA_VERSION
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

  // entityRegistry is optional for backward compat, but must be valid if present
  if (obj.entityRegistry !== undefined) {
    if (typeof obj.entityRegistry !== 'object' || obj.entityRegistry === null) return false
    const registry = obj.entityRegistry as Record<string, unknown>
    if (typeof registry.entities !== 'object' || registry.entities === null) return false
  }

  // playthroughLog is optional for backward compat, but must be an array if present
  if (obj.playthroughLog !== undefined) {
    if (!Array.isArray(obj.playthroughLog)) return false
  }

  // customFieldTemplates is optional for backward compat, but must be an array if present
  if (obj.customFieldTemplates !== undefined) {
    if (!Array.isArray(obj.customFieldTemplates)) return false
  }

  // graphTemplates is optional for backward compat, but must be an array if present
  if (obj.graphTemplates !== undefined) {
    if (!Array.isArray(obj.graphTemplates)) return false
  }

  return true
}
