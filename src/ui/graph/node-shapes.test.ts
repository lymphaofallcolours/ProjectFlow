import { describe, it, expect } from 'vitest'
import { getHandleInsets, getShapePath, NODE_DIMENSIONS } from './node-shapes'

describe('getHandleInsets', () => {
  it('returns all 4 insets for right-pointing triangle', () => {
    const insets = getHandleInsets('triangle')
    // Right-pointing triangle: M 4,4 L 140,62 L 4,120 Z
    // Horizontal: left/right edges near bounding box (4px inset)
    expect(insets.left).toBe(4)
    expect(insets.right).toBe(4)
    // Vertical: at x=72, top slope at y≈33, bottom slope at y≈91
    expect(insets.top).toBeGreaterThan(28)
    expect(insets.top).toBeLessThan(38)
    expect(insets.bottom).toBeGreaterThan(28)
    expect(insets.bottom).toBeLessThan(38)
    // Symmetric vertically
    expect(insets.top).toBe(insets.bottom)
  })

  it('returns left/right insets for banner shape', () => {
    const insets = getHandleInsets('banner')
    expect(insets.left).toBe(12)
    expect(insets.right).toBe(12)
  })

  it('returns empty object for non-triangle/non-banner shapes', () => {
    expect(getHandleInsets('circle')).toEqual({})
    expect(getHandleInsets('square')).toEqual({})
    expect(getHandleInsets('diamond')).toEqual({})
    expect(getHandleInsets('hexagon')).toEqual({})
    expect(getHandleInsets('group-rect')).toEqual({})
  })
})

describe('getShapePath', () => {
  it('generates valid SVG paths for all shapes', () => {
    const shapes = Object.keys(NODE_DIMENSIONS) as Array<keyof typeof NODE_DIMENSIONS>
    for (const shape of shapes) {
      const path = getShapePath(shape)
      expect(path).toBeDefined()
      expect(path.startsWith('M ')).toBe(true)
      expect(path.endsWith('Z')).toBe(true)
    }
  })
})
