// Pure history operations — ZERO framework imports, ZERO side effects
import type { StoryNode, StoryEdge } from './types'

export type HistorySnapshot = {
  nodes: Record<string, StoryNode>
  edges: Record<string, StoryEdge>
}

export const MAX_HISTORY_SIZE = 50

export function createSnapshot(
  nodes: Record<string, StoryNode>,
  edges: Record<string, StoryEdge>,
): HistorySnapshot {
  return { nodes, edges }
}
