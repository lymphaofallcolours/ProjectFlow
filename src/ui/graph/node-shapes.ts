import type { NodeShape } from '@/domain/types'

// SVG path definitions for node shapes.
// All paths fit within a 0,0 → width,height bounding box.
// Shapes are clean and geometric — designed for a polished glass aesthetic.

export const NODE_DIMENSIONS: Record<NodeShape, { width: number; height: number }> = {
  circle: { width: 120, height: 120 },
  square: { width: 144, height: 100 },
  triangle: { width: 144, height: 124 },
  diamond: { width: 132, height: 132 },
  hexagon: { width: 152, height: 120 },
}

export function getShapePath(shape: NodeShape): string {
  const { width: w, height: h } = NODE_DIMENSIONS[shape]

  switch (shape) {
    case 'circle': {
      const rx = w / 2
      const ry = h / 2
      return `M ${rx},0 A ${rx},${ry} 0 1,1 ${rx},${h} A ${rx},${ry} 0 1,1 ${rx},0 Z`
    }
    case 'square': {
      const r = 8
      return `M ${r},0 L ${w - r},0 Q ${w},0 ${w},${r} L ${w},${h - r} Q ${w},${h} ${w - r},${h} L ${r},${h} Q 0,${h} 0,${h - r} L 0,${r} Q 0,0 ${r},0 Z`
    }
    case 'triangle': {
      return `M ${w / 2},4 L ${w - 4},${h - 2} L 4,${h - 2} Z`
    }
    case 'diamond': {
      return `M ${w / 2},2 L ${w - 2},${h / 2} L ${w / 2},${h - 2} L 2,${h / 2} Z`
    }
    case 'hexagon': {
      const inset = w * 0.21
      return `M ${inset},2 L ${w - inset},2 L ${w - 2},${h / 2} L ${w - inset},${h - 2} L ${inset},${h - 2} L 2,${h / 2} Z`
    }
  }
}
