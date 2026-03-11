import { describe, it, expect } from 'vitest'
import { FIELD_DEFINITIONS } from './types'
import { computePeripheralLayout } from './peripheral-layout'
import type { FieldDefinition } from './types'

function fieldDefs(...keys: string[]): FieldDefinition[] {
  return keys.map((k) => FIELD_DEFINITIONS.find((f) => f.key === k)!)
}

describe('computePeripheralLayout', () => {
  it('returns empty for no fields', () => {
    expect(computePeripheralLayout([])).toEqual([])
  })

  it('assigns script to left edge', () => {
    const result = computePeripheralLayout(fieldDefs('script'))
    expect(result).toHaveLength(1)
    expect(result[0].edge).toBe('left')
    expect(result[0].fieldKey).toBe('script')
    expect(result[0].order).toBe(0)
  })

  it('assigns dialogues to left edge', () => {
    const result = computePeripheralLayout(fieldDefs('dialogues'))
    expect(result).toHaveLength(1)
    expect(result[0].edge).toBe('left')
  })

  it('assigns combat and events to right edge', () => {
    const result = computePeripheralLayout(fieldDefs('combat', 'events'))
    expect(result).toHaveLength(2)
    expect(result.every((a) => a.edge === 'right')).toBe(true)
    expect(result[0].order).toBe(0)
    expect(result[1].order).toBe(1)
  })

  it('assigns soundtrack, diceRolls, vibe, conditions to top edge', () => {
    const result = computePeripheralLayout(fieldDefs('soundtrack', 'diceRolls', 'vibe', 'conditions'))
    expect(result).toHaveLength(4)
    expect(result.every((a) => a.edge === 'top')).toBe(true)
  })

  it('assigns characters, secrets, gmNotes, custom to bottom edge', () => {
    const result = computePeripheralLayout(
      fieldDefs('characters', 'secrets', 'gmNotes', 'custom'),
    )
    expect(result).toHaveLength(4)
    expect(result.every((a) => a.edge === 'bottom')).toBe(true)
  })

  it('respects fixed affinity for all fields', () => {
    const allFields = FIELD_DEFINITIONS
    const result = computePeripheralLayout(allFields)

    const byKey = Object.fromEntries(result.map((a) => [a.fieldKey, a.edge]))
    expect(byKey.script).toBe('left')
    expect(byKey.dialogues).toBe('left')
    expect(byKey.combat).toBe('right')
    expect(byKey.events).toBe('right')
    expect(byKey.soundtrack).toBe('top')
    expect(byKey.diceRolls).toBe('top')
    expect(byKey.vibe).toBe('top')
    expect(byKey.conditions).toBe('top')
    expect(byKey.characters).toBe('bottom')
    expect(byKey.secrets).toBe('bottom')
    expect(byKey.gmNotes).toBe('bottom')
    expect(byKey.custom).toBe('bottom')
  })

  it('sparse population — only populated fields get assignments', () => {
    const result = computePeripheralLayout(fieldDefs('script', 'combat'))
    expect(result).toHaveLength(2)
    const edges = new Set(result.map((a) => a.edge))
    expect(edges).toEqual(new Set(['left', 'right']))
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
