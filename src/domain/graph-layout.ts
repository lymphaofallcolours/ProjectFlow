// Auto-arrange layout using dagre — pure algorithm, ZERO framework imports
import dagre from '@dagrejs/dagre'
import type { StoryNode, StoryEdge, Position2D } from './types'
import { SCENE_TYPE_CONFIG } from './types'
import { NODE_DIMENSIONS } from './node-dimensions'
import { getAllDescendants } from './group-operations'

export type LayoutOptions = {
  rankdir: 'LR' | 'TB'
  selectedNodeIds?: Set<string>
}

function getNodeDimensions(node: StoryNode): { width: number; height: number } {
  const shape = node.isGroup ? 'group-rect' : SCENE_TYPE_CONFIG[node.sceneType].shape
  return NODE_DIMENSIONS[shape]
}

function getCollapsedGroupIds(nodes: Record<string, StoryNode>): Set<string> {
  const collapsed = new Set<string>()
  for (const node of Object.values(nodes)) {
    if (node.isGroup && node.collapsed) collapsed.add(node.id)
  }
  return collapsed
}

function getHiddenNodeIds(
  nodes: Record<string, StoryNode>,
  collapsedIds: Set<string>,
): Set<string> {
  const hidden = new Set<string>()
  for (const gid of collapsedIds) {
    for (const did of getAllDescendants(nodes, gid)) {
      hidden.add(did)
    }
  }
  return hidden
}

function buildChildToGroupMap(
  nodes: Record<string, StoryNode>,
  hidden: Set<string>,
): Map<string, string> {
  const map = new Map<string, string>()
  for (const id of hidden) {
    let current = nodes[id]
    while (current?.groupId) {
      if (!hidden.has(current.groupId)) {
        map.set(id, current.groupId)
        break
      }
      current = nodes[current.groupId]
    }
  }
  return map
}

function buildLayoutGraph(
  nodes: Record<string, StoryNode>,
  edges: Record<string, StoryEdge>,
  options: LayoutOptions,
): dagre.graphlib.Graph {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: options.rankdir, nodesep: 60, ranksep: 100 })
  g.setDefaultEdgeLabel(() => ({}))

  const collapsed = getCollapsedGroupIds(nodes)
  const hidden = getHiddenNodeIds(nodes, collapsed)
  const childToGroup = buildChildToGroupMap(nodes, hidden)

  for (const node of Object.values(nodes)) {
    if (hidden.has(node.id)) continue
    const dim = getNodeDimensions(node)
    g.setNode(node.id, { width: dim.width, height: dim.height })
  }

  const edgeSet = new Set<string>()
  for (const edge of Object.values(edges)) {
    const src = childToGroup.get(edge.source) ?? edge.source
    const tgt = childToGroup.get(edge.target) ?? edge.target
    if (hidden.has(src) || hidden.has(tgt)) continue
    if (src === tgt) continue
    const key = `${src}->${tgt}`
    if (edgeSet.has(key)) continue
    edgeSet.add(key)
    g.setEdge(src, tgt)
  }

  return g
}

function extractLayoutPositions(
  g: dagre.graphlib.Graph,
  selectedNodeIds?: Set<string>,
): Record<string, Position2D> {
  const positions: Record<string, Position2D> = {}
  for (const id of g.nodes()) {
    if (selectedNodeIds && !selectedNodeIds.has(id)) continue
    const info = g.node(id)
    if (!info) continue
    positions[id] = {
      x: info.x - info.width / 2,
      y: info.y - info.height / 2,
    }
  }
  return positions
}

export function computeAutoLayout(
  nodes: Record<string, StoryNode>,
  edges: Record<string, StoryEdge>,
  options: LayoutOptions,
): Record<string, Position2D> {
  const g = buildLayoutGraph(nodes, edges, options)
  dagre.layout(g)
  return extractLayoutPositions(g, options.selectedNodeIds)
}
