import { useMemo } from 'react'
import type { Node, Edge } from '@xyflow/react'
import { useGraphStore } from '@/application/graph-store'
import { SCENE_TYPE_CONFIG } from '@/domain/types'
import { getAllDescendants } from '@/domain/group-operations'
import { NODE_DIMENSIONS } from './node-shapes'
import type { StoryNodeData } from './story-node'
import type { StoryEdgeData } from './story-edge'

export function useFlowNodes() {
  const nodes = useGraphStore((s) => s.nodes)
  const edges = useGraphStore((s) => s.edges)
  const selectedNodeIds = useGraphStore((s) => s.selectedNodeIds)

  // Compute collapsed group info — maps descendants of collapsed groups to the outermost collapsed ancestor
  const collapsedInfo = useMemo(() => {
    const collapsedGroupIds = new Set<string>()
    const childToGroup = new Map<string, string>()

    for (const node of Object.values(nodes)) {
      if (node.isGroup && node.collapsed) {
        collapsedGroupIds.add(node.id)
      }
    }

    // Find top-level collapsed groups (no collapsed ancestor)
    const topCollapsed: string[] = []
    for (const gid of collapsedGroupIds) {
      let current = nodes[gid]
      let hasCollapsedAncestor = false
      const visited = new Set<string>()
      while (current?.groupId) {
        if (visited.has(current.id)) break
        visited.add(current.id)
        if (collapsedGroupIds.has(current.groupId)) {
          hasCollapsedAncestor = true
          break
        }
        current = nodes[current.groupId]
      }
      if (!hasCollapsedAncestor) {
        topCollapsed.push(gid)
      }
    }

    // For each top-level collapsed group, map ALL descendants to it
    for (const gid of topCollapsed) {
      const descendants = getAllDescendants(nodes, gid)
      for (const did of descendants) {
        childToGroup.set(did, gid)
      }
    }

    return { collapsedGroupIds, childToGroup }
  }, [nodes])

  // Base node data — stable when only selection changes
  // Filter out descendants of collapsed groups
  const baseFlowNodes = useMemo(
    () =>
      Object.values(nodes)
        .filter((node) => !collapsedInfo.childToGroup.has(node.id))
        .map((node) => {
          const shape = node.isGroup ? 'group-rect' : SCENE_TYPE_CONFIG[node.sceneType].shape
          const dim = NODE_DIMENSIONS[shape]
          return {
            id: node.id,
            type: 'story' as const,
            position: node.position,
            data: { storyNode: node },
            width: dim.width,
            height: dim.height,
          }
        }),
    [nodes, collapsedInfo],
  )

  // Add selection flag — re-computes on selection change but base data is stable
  const flowNodes: Node<StoryNodeData>[] = useMemo(
    () =>
      baseFlowNodes.map((node) => ({
        ...node,
        selected: selectedNodeIds.has(node.id),
      })),
    [baseFlowNodes, selectedNodeIds],
  )

  // Edges — remap boundary edges for collapsed groups, hide internal edges
  const flowEdges: Edge<StoryEdgeData>[] = useMemo(() => {
    const { childToGroup } = collapsedInfo
    const seen = new Set<string>()

    return Object.values(edges)
      .map((edge) => {
        const remappedSource = childToGroup.get(edge.source) ?? edge.source
        const remappedTarget = childToGroup.get(edge.target) ?? edge.target

        // Skip internal edges (both endpoints in same collapsed group)
        if (
          remappedSource === remappedTarget &&
          (childToGroup.has(edge.source) || childToGroup.has(edge.target))
        ) {
          return null
        }

        // Deduplicate remapped edges (multiple children→external may merge)
        const dedupeKey = `${remappedSource}->${remappedTarget}`
        if (remappedSource !== edge.source || remappedTarget !== edge.target) {
          if (seen.has(dedupeKey)) return null
          seen.add(dedupeKey)
        }

        return {
          id: edge.id,
          type: 'story' as const,
          source: remappedSource,
          target: remappedTarget,
          label: edge.label,
          data: { storyEdge: { ...edge, source: remappedSource, target: remappedTarget } },
        }
      })
      .filter((e): e is NonNullable<typeof e> => e !== null) as Edge<StoryEdgeData>[]
  }, [edges, collapsedInfo])

  return { flowNodes, flowEdges }
}
