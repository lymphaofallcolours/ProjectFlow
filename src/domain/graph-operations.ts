// Pure graph operations — ZERO framework imports, ZERO side effects
import type {
  StoryNode,
  StoryEdge,
  SceneType,
  Position2D,
  NodeFields,
  RichContent,
  FieldKey,
} from './types'

export function createEmptyRichContent(): RichContent {
  return { markdown: '' }
}

export function createEmptyNodeFields(): NodeFields {
  return {
    script: createEmptyRichContent(),
    dialogues: [],
    gmNotes: createEmptyRichContent(),
    vibe: createEmptyRichContent(),
    soundtrack: [],
    events: createEmptyRichContent(),
    combat: createEmptyRichContent(),
    characters: createEmptyRichContent(),
    diceRolls: [],
    secrets: createEmptyRichContent(),
    custom: [],
  }
}

export function createNode(
  sceneType: SceneType,
  position: Position2D,
  label?: string,
): StoryNode {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    position,
    label: label ?? 'New Scene',
    sceneType,
    fields: createEmptyNodeFields(),
    metadata: {
      createdAt: now,
      updatedAt: now,
      tags: [],
    },
  }
}

export function createEdge(
  sourceId: string,
  targetId: string,
  label?: string,
): StoryEdge {
  return {
    id: crypto.randomUUID(),
    source: sourceId,
    target: targetId,
    label,
    style: 'default',
  }
}

export function removeNode(
  nodes: Record<string, StoryNode>,
  edges: Record<string, StoryEdge>,
  nodeId: string,
): { nodes: Record<string, StoryNode>; edges: Record<string, StoryEdge> } {
  const { [nodeId]: _, ...remainingNodes } = nodes

  const remainingEdges: Record<string, StoryEdge> = {}
  for (const [id, edge] of Object.entries(edges)) {
    if (edge.source !== nodeId && edge.target !== nodeId) {
      remainingEdges[id] = edge
    }
  }

  return { nodes: remainingNodes, edges: remainingEdges }
}

export function removeEdge(
  edges: Record<string, StoryEdge>,
  edgeId: string,
): Record<string, StoryEdge> {
  const { [edgeId]: _, ...remaining } = edges
  return remaining
}

export function updateNodeLabel(node: StoryNode, label: string): StoryNode {
  return {
    ...node,
    label,
    metadata: { ...node.metadata, updatedAt: new Date().toISOString() },
  }
}

export function updateNodeSceneType(
  node: StoryNode,
  sceneType: SceneType,
): StoryNode {
  return {
    ...node,
    sceneType,
    metadata: { ...node.metadata, updatedAt: new Date().toISOString() },
  }
}

export function updateNodePosition(
  node: StoryNode,
  position: Position2D,
): StoryNode {
  return { ...node, position }
}

export function updateNodeField(
  node: StoryNode,
  fieldKey: FieldKey,
  value: NodeFields[FieldKey],
): StoryNode {
  return {
    ...node,
    fields: { ...node.fields, [fieldKey]: value },
    metadata: { ...node.metadata, updatedAt: new Date().toISOString() },
  }
}

export function isFieldPopulated(fields: NodeFields, key: FieldKey): boolean {
  const value = fields[key]

  if (Array.isArray(value)) {
    return value.length > 0
  }

  // RichContent fields
  const richContent = value as RichContent
  return richContent.markdown.trim().length > 0
}

export function duplicateNode(
  node: StoryNode,
  newPosition: Position2D,
): StoryNode {
  const now = new Date().toISOString()
  return {
    ...node,
    id: crypto.randomUUID(),
    position: newPosition,
    label: `${node.label} (copy)`,
    fields: structuredClone(node.fields),
    metadata: {
      createdAt: now,
      updatedAt: now,
      tags: [...node.metadata.tags],
    },
  }
}
