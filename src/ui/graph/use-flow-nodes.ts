import { useMemo } from 'react'
import type { Node, Edge } from '@xyflow/react'
import { useGraphStore } from '@/application/graph-store'
import type { StoryNodeData } from './story-node'
import type { StoryEdgeData } from './story-edge'

export function useFlowNodes() {
  const nodes = useGraphStore((s) => s.nodes)
  const edges = useGraphStore((s) => s.edges)
  const selectedNodeIds = useGraphStore((s) => s.selectedNodeIds)

  // Compute collapsed group info — maps children of collapsed groups to their group ID
  const collapsedInfo = useMemo(() => {
    const collapsedGroupIds = new Set<string>()
    const childToGroup = new Map<string, string>()

    for (const node of Object.values(nodes)) {
      if (node.isGroup && node.collapsed) {
        collapsedGroupIds.add(node.id)
      }
    }

    for (const node of Object.values(nodes)) {
      if (node.groupId && collapsedGroupIds.has(node.groupId)) {
        childToGroup.set(node.id, node.groupId)
      }
    }

    return { collapsedGroupIds, childToGroup }
  }, [nodes])

  // Base node data — stable when only selection changes
  // Filter out children of collapsed groups
  const baseFlowNodes = useMemo(
    () =>
      Object.values(nodes)
        .filter((node) => !collapsedInfo.childToGroup.has(node.id))
        .map((node) => ({
          id: node.id,
          type: 'story' as const,
          position: node.position,
          data: { storyNode: node },
        })),
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
