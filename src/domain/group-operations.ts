// Pure group operations — ZERO framework imports, ZERO side effects
import type { StoryNode, StoryEdge, SceneType, Position2D } from './types'
import { createNode } from './graph-operations'

export function createGroupNode(
  sceneType: SceneType,
  position: Position2D,
  label?: string,
): StoryNode {
  const node = createNode(sceneType, position, label ?? 'New Group')
  return { ...node, isGroup: true }
}

export function addNodesToGroup(
  nodes: Record<string, StoryNode>,
  groupId: string,
  nodeIds: string[],
): Record<string, StoryNode> {
  const group = nodes[groupId]
  if (!group?.isGroup) {
    throw new Error(`Node ${groupId} is not a group`)
  }

  const updated = { ...nodes }
  for (const id of nodeIds) {
    const node = updated[id]
    if (!node) continue
    if (node.isGroup) {
      throw new Error(`Cannot nest group ${id} inside another group`)
    }
    if (node.groupId && node.groupId !== groupId) {
      throw new Error(`Node ${id} already belongs to group ${node.groupId}`)
    }
    updated[id] = { ...node, groupId }
  }
  return updated
}

export function removeNodesFromGroup(
  nodes: Record<string, StoryNode>,
  nodeIds: string[],
): Record<string, StoryNode> {
  const updated = { ...nodes }
  for (const id of nodeIds) {
    const node = updated[id]
    if (!node || !node.groupId) continue
    updated[id] = { ...node, groupId: undefined }
  }
  return updated
}

export function toggleGroupCollapsed(node: StoryNode): StoryNode {
  if (!node.isGroup) return node
  return { ...node, collapsed: !node.collapsed }
}

export function getGroupChildren(
  nodes: Record<string, StoryNode>,
  groupId: string,
): StoryNode[] {
  return Object.values(nodes).filter((n) => n.groupId === groupId)
}

export function getGroupChildIds(
  nodes: Record<string, StoryNode>,
  groupId: string,
): string[] {
  return Object.values(nodes)
    .filter((n) => n.groupId === groupId)
    .map((n) => n.id)
}

export function isNodeInGroup(node: StoryNode): boolean {
  return node.groupId !== undefined
}

export function deleteGroupKeepChildren(
  nodes: Record<string, StoryNode>,
  edges: Record<string, StoryEdge>,
  groupId: string,
): { nodes: Record<string, StoryNode>; edges: Record<string, StoryEdge> } {
  const updated = { ...nodes }

  // Ungroup all children
  for (const [id, node] of Object.entries(updated)) {
    if (node.groupId === groupId) {
      updated[id] = { ...node, groupId: undefined }
    }
  }

  // Remove the group node itself
  delete updated[groupId]

  // Remove edges connected to the group node
  const remainingEdges = Object.fromEntries(
    Object.entries(edges).filter(
      ([, edge]) => edge.source !== groupId && edge.target !== groupId,
    ),
  )

  return { nodes: updated, edges: remainingEdges }
}

export function deleteGroupWithChildren(
  nodes: Record<string, StoryNode>,
  edges: Record<string, StoryEdge>,
  groupId: string,
): { nodes: Record<string, StoryNode>; edges: Record<string, StoryEdge> } {
  const childIds = getGroupChildIds(nodes, groupId)
  const removeSet = new Set([groupId, ...childIds])

  const remainingNodes = Object.fromEntries(
    Object.entries(nodes).filter(([id]) => !removeSet.has(id)),
  )
  const remainingEdges = Object.fromEntries(
    Object.entries(edges).filter(
      ([, edge]) => !removeSet.has(edge.source) && !removeSet.has(edge.target),
    ),
  )

  return { nodes: remainingNodes, edges: remainingEdges }
}

export function getGroupBoundaryEdges(
  nodes: Record<string, StoryNode>,
  edges: Record<string, StoryEdge>,
  groupId: string,
): StoryEdge[] {
  const childIds = new Set(getGroupChildIds(nodes, groupId))
  childIds.add(groupId)

  return Object.values(edges).filter((edge) => {
    const sourceInGroup = childIds.has(edge.source)
    const targetInGroup = childIds.has(edge.target)
    return sourceInGroup !== targetInGroup
  })
}

export function getInternalEdges(
  nodes: Record<string, StoryNode>,
  edges: Record<string, StoryEdge>,
  groupId: string,
): StoryEdge[] {
  const childIds = new Set(getGroupChildIds(nodes, groupId))

  return Object.values(edges).filter(
    (edge) => childIds.has(edge.source) && childIds.has(edge.target),
  )
}
