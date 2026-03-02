// Entity system types — ZERO framework imports
import type { Attachment, RichContent } from './types'

export type EntityType = 'pc' | 'npc' | 'enemy' | 'object' | 'location' | 'secret'

export type EntityTypeConfig = {
  type: EntityType
  prefix: string
  presentSymbol: string
  mentionedSymbol: string
  color: string
  icon: string
  label: string
}

export const ENTITY_TYPE_CONFIGS: EntityTypeConfig[] = [
  { type: 'pc', prefix: '', presentSymbol: '@', mentionedSymbol: '#', color: '#3b82f6', icon: 'Shield', label: 'PC' },
  { type: 'npc', prefix: '!', presentSymbol: '@', mentionedSymbol: '#', color: '#22c55e', icon: 'User', label: 'NPC' },
  { type: 'enemy', prefix: '%', presentSymbol: '@', mentionedSymbol: '#', color: '#ef4444', icon: 'Skull', label: 'Enemy' },
  { type: 'object', prefix: '$', presentSymbol: '@', mentionedSymbol: '#', color: '#f59e0b', icon: 'Package', label: 'Object' },
  { type: 'location', prefix: '~', presentSymbol: '@', mentionedSymbol: '#', color: '#a855f7', icon: 'MapPin', label: 'Location' },
  { type: 'secret', prefix: '&', presentSymbol: '@', mentionedSymbol: '#', color: '#6b7280', icon: 'EyeOff', label: 'Secret' },
]

export type EntityRelationship = {
  targetEntityId: string
  type: string
  note?: string
}

export type StatusEntry = {
  nodeId: string
  status: string
  note?: string
}

export type Entity = {
  id: string
  type: EntityType
  name: string
  description?: string
  affiliations?: string[]
  history?: RichContent
  relationships?: EntityRelationship[]
  portrait?: Attachment
  statusHistory: StatusEntry[]
  custom: Record<string, string>
}

export type EntityRegistry = {
  entities: Record<string, Entity>
}
