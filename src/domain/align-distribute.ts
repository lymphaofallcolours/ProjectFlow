// Align and distribute layout functions — pure, ZERO framework imports
import type { StoryNode, Position2D } from './types'
import { SCENE_TYPE_CONFIG } from './types'
import { NODE_DIMENSIONS } from './node-dimensions'

export type Alignment = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
export type DistributeDirection = 'horizontal' | 'vertical'

function getNodeDimensions(node: StoryNode): { width: number; height: number } {
  const shape = node.isGroup ? 'group-rect' : SCENE_TYPE_CONFIG[node.sceneType].shape
  return NODE_DIMENSIONS[shape]
}

export function alignNodes(
  nodes: Record<string, StoryNode>,
  nodeIds: string[],
  alignment: Alignment,
): Record<string, Position2D> {
  if (nodeIds.length < 2) return {}

  const entries = nodeIds
    .map((id) => nodes[id])
    .filter(Boolean)
    .map((n) => ({ node: n, dim: getNodeDimensions(n) }))

  if (entries.length < 2) return {}

  const result: Record<string, Position2D> = {}

  switch (alignment) {
    case 'left': {
      const minX = Math.min(...entries.map((e) => e.node.position.x))
      for (const e of entries) {
        if (e.node.position.x !== minX) {
          result[e.node.id] = { x: minX, y: e.node.position.y }
        }
      }
      break
    }
    case 'right': {
      const maxRight = Math.max(...entries.map((e) => e.node.position.x + e.dim.width))
      for (const e of entries) {
        const newX = maxRight - e.dim.width
        if (e.node.position.x !== newX) {
          result[e.node.id] = { x: newX, y: e.node.position.y }
        }
      }
      break
    }
    case 'center': {
      const avgCx = entries.reduce((s, e) => s + e.node.position.x + e.dim.width / 2, 0) / entries.length
      for (const e of entries) {
        const newX = avgCx - e.dim.width / 2
        if (Math.abs(e.node.position.x - newX) > 0.5) {
          result[e.node.id] = { x: newX, y: e.node.position.y }
        }
      }
      break
    }
    case 'top': {
      const minY = Math.min(...entries.map((e) => e.node.position.y))
      for (const e of entries) {
        if (e.node.position.y !== minY) {
          result[e.node.id] = { x: e.node.position.x, y: minY }
        }
      }
      break
    }
    case 'bottom': {
      const maxBottom = Math.max(...entries.map((e) => e.node.position.y + e.dim.height))
      for (const e of entries) {
        const newY = maxBottom - e.dim.height
        if (e.node.position.y !== newY) {
          result[e.node.id] = { x: e.node.position.x, y: newY }
        }
      }
      break
    }
    case 'middle': {
      const avgCy = entries.reduce((s, e) => s + e.node.position.y + e.dim.height / 2, 0) / entries.length
      for (const e of entries) {
        const newY = avgCy - e.dim.height / 2
        if (Math.abs(e.node.position.y - newY) > 0.5) {
          result[e.node.id] = { x: e.node.position.x, y: newY }
        }
      }
      break
    }
  }

  return result
}

export function distributeNodes(
  nodes: Record<string, StoryNode>,
  nodeIds: string[],
  direction: DistributeDirection,
): Record<string, Position2D> {
  if (nodeIds.length < 3) return {}

  const entries = nodeIds
    .map((id) => nodes[id])
    .filter(Boolean)
    .map((n) => ({ node: n, dim: getNodeDimensions(n) }))

  if (entries.length < 3) return {}

  const result: Record<string, Position2D> = {}

  if (direction === 'horizontal') {
    entries.sort((a, b) => a.node.position.x - b.node.position.x)
    const first = entries[0]
    const last = entries[entries.length - 1]
    const totalSpace = (last.node.position.x + last.dim.width) - first.node.position.x
    const totalNodeWidth = entries.reduce((s, e) => s + e.dim.width, 0)
    const gap = (totalSpace - totalNodeWidth) / (entries.length - 1)

    let x = first.node.position.x
    for (const e of entries) {
      if (Math.abs(e.node.position.x - x) > 0.5) {
        result[e.node.id] = { x, y: e.node.position.y }
      }
      x += e.dim.width + gap
    }
  } else {
    entries.sort((a, b) => a.node.position.y - b.node.position.y)
    const first = entries[0]
    const last = entries[entries.length - 1]
    const totalSpace = (last.node.position.y + last.dim.height) - first.node.position.y
    const totalNodeHeight = entries.reduce((s, e) => s + e.dim.height, 0)
    const gap = (totalSpace - totalNodeHeight) / (entries.length - 1)

    let y = first.node.position.y
    for (const e of entries) {
      if (Math.abs(e.node.position.y - y) > 0.5) {
        result[e.node.id] = { x: e.node.position.x, y }
      }
      y += e.dim.height + gap
    }
  }

  return result
}
