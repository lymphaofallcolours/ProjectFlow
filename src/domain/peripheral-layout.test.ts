import { describe, it, expect } from 'vitest'
import { FIELD_DEFINITIONS } from './types'
import { computePeripheralLayout, getActiveEdges } from './peripheral-layout'
import type { FieldDefinition } from './types'

function fieldDefs(...keys: string[]): FieldDefinition[] {
  return keys.map((k) => FIELD_DEFINITIONS.find((f) => f.key === k)!)
}

describe('getActiveEdges', () => {
  it('returns empty for 0 fields', () => {
    expect(getActiveEdges(0)).toEqual([])
  })

  it('returns left only for 1-2 fields', () => {
    expect(getActiveEdges(1)).toEqual(['left'])
    expect(getActiveEdges(2)).toEqual(['left'])
  })

  it('returns left+right for 3-4 fields', () => {
    expect(getActiveEdges(3)).toEqual(['left', 'right'])
    expect(getActiveEdges(4)).toEqual(['left', 'right'])
  })

  it('returns left+right+top for 5-7 fields', () => {
    expect(getActiveEdges(5)).toEqual(['left', 'right', 'top'])
    expect(getActiveEdges(7)).toEqual(['left', 'right', 'top'])
  })

  it('returns all four edges for 8+ fields', () => {
    expect(getActiveEdges(8)).toEqual(['left', 'right', 'top', 'bottom'])
    expect(getActiveEdges(11)).toEqual(['left', 'right', 'top', 'bottom'])
  })
})

describe('computePeripheralLayout', () => {
  it('returns empty for no fields', () => {
    expect(computePeripheralLayout([])).toEqual([])
  })

  it('assigns a single field to left edge', () => {
    const result = computePeripheralLayout(fieldDefs('script'))
    expect(result).toHaveLength(1)
    expect(result[0].edge).toBe('left')
    expect(result[0].fieldKey).toBe('script')
    expect(result[0].order).toBe(0)
  })

  it('assigns 2 fields both to left edge', () => {
    const result = computePeripheralLayout(fieldDefs('script', 'characters'))
    expect(result).toHaveLength(2)
    // Both go to left since only left is active for 2 fields
    expect(result.every((a) => a.edge === 'left')).toBe(true)
    expect(result[0].order).toBe(0)
    expect(result[1].order).toBe(1)
  })

  it('splits 3 fields across left and right by affinity', () => {
    const result = computePeripheralLayout(fieldDefs('script', 'gmNotes', 'characters'))
    expect(result).toHaveLength(3)
    const left = result.filter((a) => a.edge === 'left')
    const right = result.filter((a) => a.edge === 'right')
    expect(left.map((a) => a.fieldKey)).toEqual(['script', 'gmNotes'])
    expect(right.map((a) => a.fieldKey)).toEqual(['characters'])
  })

  it('falls back fields to active edges when preferred edge is inactive', () => {
    // dialogues prefers 'top', but with 2 fields only left is active
    const result = computePeripheralLayout(fieldDefs('dialogues', 'soundtrack'))
    expect(result).toHaveLength(2)
    expect(result.every((a) => a.edge === 'left')).toBe(true)
  })

  it('distributes 8+ fields across all four edges', () => {
    const allFields = FIELD_DEFINITIONS
    const result = computePeripheralLayout(allFields)
    const edges = new Set(result.map((a) => a.edge))
    expect(edges.size).toBe(4)
  })

  it('respects field-to-edge affinity for all fields', () => {
    const allFields = FIELD_DEFINITIONS
    const result = computePeripheralLayout(allFields)

    const byKey = Object.fromEntries(result.map((a) => [a.fieldKey, a.edge]))
    expect(byKey.script).toBe('left')
    expect(byKey.gmNotes).toBe('left')
    expect(byKey.vibe).toBe('left')
    expect(byKey.characters).toBe('right')
    expect(byKey.combat).toBe('right')
    expect(byKey.secrets).toBe('right')
    expect(byKey.dialogues).toBe('top')
    expect(byKey.events).toBe('top')
    expect(byKey.soundtrack).toBe('bottom')
    expect(byKey.diceRolls).toBe('bottom')
    expect(byKey.custom).toBe('bottom')
  })

  it('suppresses edges and redistributes fields', () => {
    const result = computePeripheralLayout(
      fieldDefs('script', 'gmNotes', 'characters'),
      ['left'],
    )
    // Left is suppressed, only right is active
    expect(result.every((a) => a.edge === 'right')).toBe(true)
  })

  it('returns empty when all edges are suppressed', () => {
    const result = computePeripheralLayout(
      fieldDefs('script'),
      ['left', 'right', 'top', 'bottom'],
    )
    expect(result).toEqual([])
  })

  it('assigns sequential order within each edge', () => {
    const allFields = FIELD_DEFINITIONS
    const result = computePeripheralLayout(allFields)

    const byEdge: Record<string, number[]> = {}
    for (const a of result) {
      if (!byEdge[a.edge]) byEdge[a.edge] = []
      byEdge[a.edge].push(a.order)
    }

    for (const orders of Object.values(byEdge)) {
      expect(orders).toEqual(orders.map((_, i) => i))
    }
  })
})
