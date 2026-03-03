// Subgraph serialization for cross-campaign import/export — ZERO framework imports
import type { StoryNode, StoryEdge } from './types'
import { extractSubgraph } from './graph-operations'

export type SubgraphFile = {
  format: 'projectflow-subgraph'
  version: 1
  nodes: StoryNode[]
  edges: StoryEdge[]
}

export function serializeSubgraph(
  nodes: Record<string, StoryNode>,
  edges: Record<string, StoryEdge>,
  nodeIds: string[],
): string {
  const { nodes: subNodes, edges: subEdges } = extractSubgraph(nodes, edges, nodeIds)
  const file: SubgraphFile = {
    format: 'projectflow-subgraph',
    version: 1,
    nodes: subNodes,
    edges: subEdges,
  }
  return JSON.stringify(file, null, 2)
}

export function deserializeSubgraph(json: string): { nodes: StoryNode[]; edges: StoryEdge[] } {
  const data: unknown = JSON.parse(json)
  if (!validateSubgraphFile(data)) {
    throw new Error('Invalid subgraph file format')
  }
  return { nodes: data.nodes, edges: data.edges }
}

export function validateSubgraphFile(data: unknown): data is SubgraphFile {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  if (obj.format !== 'projectflow-subgraph') return false
  if (obj.version !== 1) return false
  if (!Array.isArray(obj.nodes)) return false
  if (!Array.isArray(obj.edges)) return false
  return true
}
