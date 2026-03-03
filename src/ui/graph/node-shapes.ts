import type { NodeShape } from '@/domain/types'

// SVG path definitions for node shapes.
// All paths fit within a 0,0 → width,height bounding box.
// Shapes are clean and geometric — designed for a polished glass aesthetic.

/**
 * Returns handle inset offsets for shapes whose perimeter doesn't align with
 * the bounding box. React Flow places handles at the bounding box edge by
 * default, which puts triangle handles outside the visible shape.
 *
 * Returns pixel inset from each edge to the actual shape perimeter at midpoint.
 */
export function getHandleInsets(shape: NodeShape): {
  left?: number; right?: number; top?: number; bottom?: number
} {
  if (shape !== 'triangle') return {}

  // Right-pointing triangle: (4,4) → (w-4,h/2) → (4,h-4)
  // Horizontal mode: handles at left edge (x=4) and right tip (x=w-4) — small inset
  // Vertical mode: handles at top/bottom center (x=w/2) — compute where slopes cross
  const { width, height } = NODE_DIMENSIONS.triangle
  const tipX = width - 4    // 140
  const tipY = height / 2   // 62
  const topY = 4
  const botY = height - 4   // 120
  const baseX = 4

  // At x = w/2 (center), interpolate along top and bottom slopes
  const midX = width / 2
  const t = (midX - baseX) / (tipX - baseX)  // progress from base to tip
  const topEdgeY = topY + (tipY - topY) * t
  const botEdgeY = botY + (tipY - botY) * t

  return {
    left: 4,
    right: 4,
    top: Math.round(topEdgeY),
    bottom: Math.round(height - botEdgeY),
  }
}

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
      // Right-pointing triangle: wide left edge for text, tip on right
      return `M 4,4 L ${w - 4},${h / 2} L 4,${h - 4} Z`
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
