// Core domain types — ZERO framework imports
import type { EntityRegistry } from './entity-types'

// --- Primitives ---

export type Position2D = { x: number; y: number }

export type ViewportState = {
  x: number
  y: number
  zoom: number
}

export type ScrollDirection = 'horizontal' | 'vertical'

// --- Scene Types & Shapes ---

export type SceneType = 'event' | 'narration' | 'combat' | 'social' | 'investigation' | 'divider' | 'group'

export type NodeShape = 'circle' | 'square' | 'triangle' | 'diamond' | 'hexagon' | 'group-rect' | 'banner'

export type SceneTypeConfig = {
  shape: NodeShape
  label: string
  color: string
}

export const SCENE_TYPE_CONFIG: Record<SceneType, SceneTypeConfig> = {
  event: { shape: 'circle', label: 'Event', color: 'node-event' },
  narration: { shape: 'square', label: 'Narration', color: 'node-narration' },
  combat: { shape: 'triangle', label: 'Combat', color: 'node-combat' },
  social: { shape: 'diamond', label: 'Social/RP', color: 'node-social' },
  investigation: { shape: 'hexagon', label: 'Investigation', color: 'node-investigation' },
  divider: { shape: 'banner', label: 'Divider', color: 'node-divider' },
  group: { shape: 'group-rect', label: 'Group', color: 'node-group' },
}

export const SCENE_TYPES: SceneType[] = ['event', 'narration', 'combat', 'social', 'investigation', 'divider']

// --- Field System ---

export type FieldDefinition = {
  key: FieldKey
  label: string
  icon: string
  color: string
}

export type FieldKey = keyof NodeFields

export const FIELD_DEFINITIONS: FieldDefinition[] = [
  { key: 'script', label: 'Script', icon: 'Mic', color: '#ef4444' },
  { key: 'dialogues', label: 'Dialogue', icon: 'MessageSquare', color: '#3b82f6' },
  { key: 'gmNotes', label: 'GM Notes', icon: 'StickyNote', color: '#f59e0b' },
  { key: 'vibe', label: 'Vibe', icon: 'Cloud', color: '#8b5cf6' },
  { key: 'soundtrack', label: 'Soundtrack', icon: 'Music', color: '#ec4899' },
  { key: 'events', label: 'Events', icon: 'Zap', color: '#f97316' },
  { key: 'combat', label: 'Combat', icon: 'Swords', color: '#ef4444' },
  { key: 'characters', label: 'Characters', icon: 'Users', color: '#06b6d4' },
  { key: 'diceRolls', label: 'Dice Rolls', icon: 'Dice5', color: '#84cc16' },
  { key: 'secrets', label: 'Secrets', icon: 'Lock', color: '#6b7280' },
  { key: 'conditions', label: 'Conditions', icon: 'GitBranch', color: '#d97706' },
  { key: 'custom', label: 'Custom', icon: 'Sparkles', color: '#a855f7' },
]

// --- Rich Content ---

export type RichContent = {
  markdown: string
  attachments?: Attachment[]
}

export type Attachment = {
  id: string
  filename: string
  mimeType: string
  dataUrl: string
}

// --- Node Field Sub-types ---

export type DialogueEntry = {
  entityRef: string
  line: string
  direction?: string
}

export type SoundtrackCue = {
  trackName: string
  url?: string
  note?: string
}

export type DiceRollEntry = {
  description: string
  formula?: string
  result?: string
}

export type CustomField = {
  label: string
  content: RichContent
  templateId?: string
}

export type ConditionEntry = {
  description: string
  targetEdgeId?: string
  status: 'met' | 'unmet' | 'unknown'
  notes?: string
}

export type CustomFieldTemplate = {
  id: string
  label: string
  icon: string
  description?: string
}

// --- Node Fields ---

export type NodeFields = {
  script: RichContent
  dialogues: DialogueEntry[]
  gmNotes: RichContent
  vibe: RichContent
  soundtrack: SoundtrackCue[]
  events: RichContent
  combat: RichContent
  characters: RichContent
  diceRolls: DiceRollEntry[]
  secrets: RichContent
  conditions: ConditionEntry[]
  custom: CustomField[]
}

// --- Node Metadata ---

export type NodeMetadata = {
  createdAt: string
  updatedAt: string
  tags: string[]
}

// --- Playthrough ---

export type PlaythroughStatus = 'unvisited' | 'played_as_planned' | 'modified' | 'skipped'

export type PlaythroughEntry = {
  id: string
  sessionDate: string
  sessionLabel?: string
  nodesVisited: {
    nodeId: string
    status: PlaythroughStatus
    notes?: string
    timestamp: string
  }[]
}

// --- Story Node ---

export type StoryNode = {
  id: string
  position: Position2D
  label: string
  sceneType: SceneType
  arcLabel?: string
  fields: NodeFields
  playthroughStatus?: PlaythroughStatus
  playthroughNotes?: string
  metadata: NodeMetadata
  // Grouping
  isGroup?: boolean
  groupId?: string
  collapsed?: boolean
  childOffsets?: Record<string, { dx: number; dy: number }>
  // Divider magnitude (only for sceneType 'divider')
  dividerMagnitude?: 1 | 2 | 3
}

// --- Story Edge ---

export type StoryEdge = {
  id: string
  source: string
  target: string
  label?: string
  style?: 'default' | 'conditional' | 'secret'
}

// --- Graph ---

export type NarrativeGraph = {
  nodes: Record<string, StoryNode>
  edges: Record<string, StoryEdge>
  viewport: ViewportState
  scrollDirection: ScrollDirection
}

// --- Graph Structure Template ---

export type GraphTemplate = {
  id: string
  name: string
  description: string
  category: 'builtin' | 'custom'
  nodes: StoryNode[]
  edges: StoryEdge[]
  createdAt: string
}

// --- Campaign Settings ---

export type CampaignSettings = {
  theme: 'light' | 'dark'
  scrollDirection: ScrollDirection
  autoSaveEnabled: boolean
  autoSaveIntervalMs: number
}

// --- Campaign ---

export type Campaign = {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  graph: NarrativeGraph
  entityRegistry: EntityRegistry
  customFieldTemplates: CustomFieldTemplate[]
  graphTemplates: GraphTemplate[]
  settings: CampaignSettings
  playthroughLog: PlaythroughEntry[]
  schemaVersion: number
}

// Re-export entity types for convenience
export type { EntityRegistry, Entity, EntityType } from './entity-types'
