// Pure layout algorithm for peripheral view — ZERO framework imports
import type { FieldKey, FieldDefinition } from './types'

export type EdgePosition = 'left' | 'right' | 'top' | 'bottom'

export type PeripheralAssignment = {
  fieldKey: FieldKey
  fieldDef: FieldDefinition
  edge: EdgePosition
  order: number
}

/** Which edge each field naturally belongs to */
const FIELD_EDGE_AFFINITY: Record<FieldKey, EdgePosition> = {
  script: 'left',
  gmNotes: 'left',
  vibe: 'left',
  characters: 'right',
  combat: 'right',
  secrets: 'right',
  dialogues: 'top',
  events: 'top',
  soundtrack: 'bottom',
  diceRolls: 'bottom',
  custom: 'bottom',
}

/** Fallback priority when preferred edge isn't active */
const EDGE_FALLBACK_ORDER: EdgePosition[] = ['left', 'right', 'top', 'bottom']

/**
 * Determine which edges are active based on how many fields are populated.
 */
export function getActiveEdges(fieldCount: number): EdgePosition[] {
  if (fieldCount <= 0) return []
  if (fieldCount <= 2) return ['left']
  if (fieldCount <= 4) return ['left', 'right']
  if (fieldCount <= 7) return ['left', 'right', 'top']
  return ['left', 'right', 'top', 'bottom']
}

/**
 * Compute the peripheral layout: assign each populated field to a screen edge.
 *
 * @param populatedFields - Only fields that have content (already filtered)
 * @param suppressedEdges - Edges to exclude (e.g. 'left' when entity sidebar is open)
 * @returns Array of assignments with edge position and order within that edge
 */
export function computePeripheralLayout(
  populatedFields: FieldDefinition[],
  suppressedEdges: EdgePosition[] = [],
): PeripheralAssignment[] {
  if (populatedFields.length === 0) return []

  const activeEdges = getActiveEdges(populatedFields.length)
    .filter((e) => !suppressedEdges.includes(e))

  if (activeEdges.length === 0) return []

  const activeSet = new Set(activeEdges)

  const assignments: PeripheralAssignment[] = populatedFields.map((fieldDef) => {
    const preferred = FIELD_EDGE_AFFINITY[fieldDef.key]
    const edge = activeSet.has(preferred)
      ? preferred
      : EDGE_FALLBACK_ORDER.find((e) => activeSet.has(e))!

    return { fieldKey: fieldDef.key, fieldDef, edge, order: 0 }
  })

  // Assign order within each edge based on FIELD_DEFINITIONS order (stable)
  const edgeCounts: Record<EdgePosition, number> = { left: 0, right: 0, top: 0, bottom: 0 }
  for (const a of assignments) {
    a.order = edgeCounts[a.edge]
    edgeCounts[a.edge]++
  }

  return assignments
}
