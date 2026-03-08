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

/**
 * Checks if `ancestorId` is an ancestor of `nodeId` by walking up the groupId chain.
 * Prevents circular nesting (A inside B inside A).
 */
export function isAncestorOf(
  nodes: Record<string, StoryNode>,
  ancestorId: string,
  nodeId: string,
): boolean {
  const visited = new Set<string>()
  let current = nodes[nodeId]
  while (current?.groupId) {
    if (visited.has(current.id)) return false // cycle guard
    visited.add(current.id)
    if (current.groupId === ancestorId) return true
    current = nodes[current.groupId]
  }
  return false
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
    if (node.isGroup && isAncestorOf(updated, id, groupId)) {
      throw new Error(`Cannot nest group ${groupId} inside its own descendant ${id}`)
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

/**
 * Returns ALL descendant node IDs recursively (children, grandchildren, etc.).
 * Includes visited-set guard against corrupted circular references.
 */
export function getAllDescendants(
  nodes: Record<string, StoryNode>,
  groupId: string,
): string[] {
  const result: string[] = []
  const visited = new Set<string>()
  const queue = [groupId]

  while (queue.length > 0) {
    const current = queue.shift()!
    if (visited.has(current)) continue
    visited.add(current)

    const children = getGroupChildIds(nodes, current)
    for (const childId of children) {
      result.push(childId)
      // If child is a group, recurse into it
      if (nodes[childId]?.isGroup) {
        queue.push(childId)
      }
    }
  }

  return result
}

/**
 * Returns the nesting depth of a group (0 for top-level, 1 for a group inside a group, etc.).
 */
export function getGroupDepth(
  nodes: Record<string, StoryNode>,
  groupId: string,
): number {
  let depth = 0
  const visited = new Set<string>()
  let current = nodes[groupId]

  while (current?.groupId) {
    if (visited.has(current.id)) break // cycle guard
    visited.add(current.id)
    const parent = nodes[current.groupId]
    if (parent?.isGroup) {
      depth++
    }
    current = parent
  }

  return depth
}

/**
 * Returns the maximum nesting depth of groups contained within this group.
 * A group with no sub-groups returns 0, a group containing a group returns 1, etc.
 */
export function getMaxDescendantDepth(
  nodes: Record<string, StoryNode>,
  groupId: string,
): number {
  let maxDepth = 0
  const queue: Array<{ id: string; depth: number }> = [{ id: groupId, depth: 0 }]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)

    for (const child of Object.values(nodes)) {
      if (child.groupId === id && child.isGroup && !visited.has(child.id)) {
        const childDepth = depth + 1
        if (childDepth > maxDepth) maxDepth = childDepth
        queue.push({ id: child.id, depth: childDepth })
      }
    }
  }

  return maxDepth
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
  const group = updated[groupId]
  const parentGroupId = group?.groupId

  // Re-parent direct children to the deleted group's parent (if any)
  for (const [id, node] of Object.entries(updated)) {
    if (node.groupId === groupId) {
      updated[id] = { ...node, groupId: parentGroupId }
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
  const descendantIds = getAllDescendants(nodes, groupId)
  const removeSet = new Set([groupId, ...descendantIds])

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
  const descendantIds = getAllDescendants(nodes, groupId)
  const memberIds = new Set([groupId, ...descendantIds])

  return Object.values(edges).filter((edge) => {
    const sourceInGroup = memberIds.has(edge.source)
    const targetInGroup = memberIds.has(edge.target)
    return sourceInGroup !== targetInGroup
  })
}

export function getInternalEdges(
  nodes: Record<string, StoryNode>,
  edges: Record<string, StoryEdge>,
  groupId: string,
): StoryEdge[] {
  const descendantIds = getAllDescendants(nodes, groupId)
  const memberIds = new Set([groupId, ...descendantIds])

  return Object.values(edges).filter(
    (edge) => memberIds.has(edge.source) && memberIds.has(edge.target),
  )
}
