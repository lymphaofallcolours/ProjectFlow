import type {
  StoryNode,
  StoryEdge,
  Campaign,
  NodeFields,
  RichContent,
  Position2D,
  SceneType,
} from '@/domain/types'
import { createEmptyNodeFields, createEmptyRichContent } from '@/domain/graph-operations'
import { createCampaign } from '@/domain/campaign-operations'

export function createTestNode(overrides?: Partial<StoryNode>): StoryNode {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    position: { x: 0, y: 0 },
    label: 'Test Node',
    sceneType: 'narration' as SceneType,
    fields: createEmptyNodeFields(),
    metadata: {
      createdAt: now,
      updatedAt: now,
      tags: [],
    },
    ...overrides,
  }
}

export function createTestEdge(overrides?: Partial<StoryEdge>): StoryEdge {
  return {
    id: crypto.randomUUID(),
    source: 'source-id',
    target: 'target-id',
    style: 'default',
    ...overrides,
  }
}

export function createTestCampaign(overrides?: Partial<Campaign>): Campaign {
  return {
    ...createCampaign('Test Campaign'),
    ...overrides,
  }
}

export function createTestPosition(x = 0, y = 0): Position2D {
  return { x, y }
}

export function createTestRichContent(markdown = ''): RichContent {
  return { ...createEmptyRichContent(), markdown }
}

export function createPopulatedNodeFields(overrides?: Partial<NodeFields>): NodeFields {
  return {
    ...createEmptyNodeFields(),
    script: { markdown: 'Test script content' },
    gmNotes: { markdown: 'Test GM notes' },
    ...overrides,
  }
}
