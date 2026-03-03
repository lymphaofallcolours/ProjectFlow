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
  const remainingNodes = Object.fromEntries(
    Object.entries(nodes).filter(([id]) => id !== nodeId),
  )

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
  return Object.fromEntries(
    Object.entries(edges).filter(([id]) => id !== edgeId),
  )
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

export function removeNodes(
  nodes: Record<string, StoryNode>,
  edges: Record<string, StoryEdge>,
  nodeIds: string[],
): { nodes: Record<string, StoryNode>; edges: Record<string, StoryEdge> } {
  const removeSet = new Set(nodeIds)

  // If removing a group, ungroup its children
  for (const id of nodeIds) {
    const node = nodes[id]
    if (node?.isGroup) {
      for (const [childId, child] of Object.entries(nodes)) {
        if (child.groupId === id && !removeSet.has(childId)) {
          // Will be cleared below via the filter
        }
      }
    }
  }

  const remainingNodes: Record<string, StoryNode> = {}
  for (const [id, node] of Object.entries(nodes)) {
    if (removeSet.has(id)) continue
    // Clear groupId if the parent group is being removed
    if (node.groupId && removeSet.has(node.groupId)) {
      remainingNodes[id] = { ...node, groupId: undefined }
    } else {
      remainingNodes[id] = node
    }
  }

  const remainingEdges = Object.fromEntries(
    Object.entries(edges).filter(
      ([, edge]) => !removeSet.has(edge.source) && !removeSet.has(edge.target),
    ),
  )
  return { nodes: remainingNodes, edges: remainingEdges }
}

export function duplicateNodes(
  nodes: Record<string, StoryNode>,
  edges: Record<string, StoryEdge>,
  nodeIds: string[],
  offset: Position2D,
): {
  nodes: Record<string, StoryNode>
  edges: Record<string, StoryEdge>
  idMap: Record<string, string>
} {
  const idMap: Record<string, string> = {}
  const sourceSet = new Set(nodeIds)
  const newNodes: Record<string, StoryNode> = {}

  for (const id of nodeIds) {
    const node = nodes[id]
    if (!node) continue
    const copy = duplicateNode(node, {
      x: node.position.x + offset.x,
      y: node.position.y + offset.y,
    })
    idMap[id] = copy.id
    newNodes[copy.id] = copy
  }

  // Remap groupId references within the duplicated set
  for (const newNode of Object.values(newNodes)) {
    if (newNode.groupId && idMap[newNode.groupId]) {
      newNode.groupId = idMap[newNode.groupId]
    } else if (newNode.groupId) {
      // Parent group not in selection — clear groupId
      delete newNode.groupId
    }
  }

  const newEdges: Record<string, StoryEdge> = {}
  for (const edge of Object.values(edges)) {
    if (sourceSet.has(edge.source) && sourceSet.has(edge.target)) {
      const newEdge: StoryEdge = {
        ...edge,
        id: crypto.randomUUID(),
        source: idMap[edge.source],
        target: idMap[edge.target],
      }
      newEdges[newEdge.id] = newEdge
    }
  }

  return { nodes: newNodes, edges: newEdges, idMap }
}

export function updateEdgeStyle(
  edge: StoryEdge,
  style: StoryEdge['style'],
): StoryEdge {
  return { ...edge, style }
}

export function updateEdgeLabel(
  edge: StoryEdge,
  label: string | undefined,
): StoryEdge {
  return { ...edge, label }
}

export function updateNodeTags(node: StoryNode, tags: string[]): StoryNode {
  return {
    ...node,
    metadata: { ...node.metadata, tags, updatedAt: new Date().toISOString() },
  }
}

export function updateNodeArcLabel(
  node: StoryNode,
  arcLabel: string | undefined,
): StoryNode {
  return {
    ...node,
    arcLabel: arcLabel || undefined,
    metadata: { ...node.metadata, updatedAt: new Date().toISOString() },
  }
}

export function extractSubgraph(
  nodes: Record<string, StoryNode>,
  edges: Record<string, StoryEdge>,
  nodeIds: string[],
): { nodes: StoryNode[]; edges: StoryEdge[] } {
  const idSet = new Set(nodeIds)

  // Auto-include children of selected groups
  for (const id of nodeIds) {
    const node = nodes[id]
    if (node?.isGroup) {
      for (const [childId, child] of Object.entries(nodes)) {
        if (child.groupId === id) {
          idSet.add(childId)
        }
      }
    }
  }

  const subNodes = [...idSet]
    .map((id) => nodes[id])
    .filter((n): n is StoryNode => n !== undefined)
  const subEdges = Object.values(edges).filter(
    (edge) => idSet.has(edge.source) && idSet.has(edge.target),
  )
  return { nodes: subNodes, edges: subEdges }
}

export function pasteSubgraph(
  clipNodes: StoryNode[],
  clipEdges: StoryEdge[],
  offset: Position2D,
): {
  nodes: Record<string, StoryNode>
  edges: Record<string, StoryEdge>
} {
  const idMap: Record<string, string> = {}
  const now = new Date().toISOString()
  const newNodes: Record<string, StoryNode> = {}

  for (const node of clipNodes) {
    const newId = crypto.randomUUID()
    idMap[node.id] = newId
    newNodes[newId] = {
      ...node,
      id: newId,
      position: { x: node.position.x + offset.x, y: node.position.y + offset.y },
      fields: structuredClone(node.fields),
      metadata: { createdAt: now, updatedAt: now, tags: [...node.metadata.tags] },
    }
  }

  // Remap groupId references within the pasted set
  for (const newNode of Object.values(newNodes)) {
    if (newNode.groupId && idMap[newNode.groupId]) {
      newNode.groupId = idMap[newNode.groupId]
    } else if (newNode.groupId) {
      delete newNode.groupId
    }
  }

  const newEdges: Record<string, StoryEdge> = {}
  for (const edge of clipEdges) {
    const newSource = idMap[edge.source]
    const newTarget = idMap[edge.target]
    if (newSource && newTarget) {
      const newId = crypto.randomUUID()
      newEdges[newId] = { ...edge, id: newId, source: newSource, target: newTarget }
    }
  }

  return { nodes: newNodes, edges: newEdges }
}

export function rewireEdge(
  edges: Record<string, StoryEdge>,
  edgeId: string,
  newSource?: string,
  newTarget?: string,
): Record<string, StoryEdge> {
  const edge = edges[edgeId]
  if (!edge) return edges
  return {
    ...edges,
    [edgeId]: {
      ...edge,
      source: newSource ?? edge.source,
      target: newTarget ?? edge.target,
    },
  }
}
