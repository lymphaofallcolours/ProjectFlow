import type { NodeShape } from './types'

export const NODE_DIMENSIONS: Record<NodeShape, { width: number; height: number }> = {
  circle: { width: 120, height: 120 },
  square: { width: 144, height: 100 },
  triangle: { width: 144, height: 124 },
  diamond: { width: 132, height: 132 },
  hexagon: { width: 152, height: 120 },
  'group-rect': { width: 160, height: 80 },
  banner: { width: 200, height: 50 },
}
