// Pure campaign operations — ZERO framework imports
import type { Campaign, CampaignSettings, NarrativeGraph } from './types'
import type { EntityRegistry } from './entity-types'

export const CURRENT_SCHEMA_VERSION = 1

export function createDefaultSettings(): CampaignSettings {
  return {
    theme: 'dark',
    scrollDirection: 'horizontal',
    autoSaveEnabled: false,
    autoSaveIntervalMs: 60_000,
  }
}

export function createEmptyGraph(): NarrativeGraph {
  return {
    nodes: {},
    edges: {},
    viewport: { x: 0, y: 0, zoom: 1 },
    scrollDirection: 'horizontal',
  }
}

export function createEmptyEntityRegistry(): EntityRegistry {
  return {
    entities: {},
  }
}

export function createCampaign(name: string): Campaign {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name,
    description: '',
    createdAt: now,
    updatedAt: now,
    graph: createEmptyGraph(),
    entityRegistry: createEmptyEntityRegistry(),
    customFieldTemplates: [],
    graphTemplates: [],
    settings: createDefaultSettings(),
    playthroughLog: [],
    schemaVersion: CURRENT_SCHEMA_VERSION,
  }
}
