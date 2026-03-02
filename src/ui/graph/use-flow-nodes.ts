import { useMemo } from 'react'
import type { Node, Edge } from '@xyflow/react'
import { useGraphStore } from '@/application/graph-store'
import type { StoryNodeData } from './story-node'
import type { StoryEdgeData } from './story-edge'

export function useFlowNodes() {
  const nodes = useGraphStore((s) => s.nodes)
  const edges = useGraphStore((s) => s.edges)
  const selectedNodeIds = useGraphStore((s) => s.selectedNodeIds)

  const flowNodes: Node<StoryNodeData>[] = useMemo(
    () =>
      Object.values(nodes).map((node) => ({
        id: node.id,
        type: 'story',
        position: node.position,
        data: { storyNode: node },
        selected: selectedNodeIds.has(node.id),
      })),
    [nodes, selectedNodeIds],
  )

  const flowEdges: Edge<StoryEdgeData>[] = useMemo(
    () =>
      Object.values(edges).map((edge) => ({
        id: edge.id,
        type: 'story',
        source: edge.source,
        target: edge.target,
        label: edge.label,
        data: { storyEdge: edge },
      })),
    [edges],
  )

  return { flowNodes, flowEdges }
}
