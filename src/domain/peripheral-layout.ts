// Pure layout algorithm for peripheral view — ZERO framework imports
import type { FieldKey, FieldDefinition } from './types'

export type EdgePosition = 'left' | 'right' | 'top' | 'bottom'

export type PeripheralAssignment = {
  fieldKey: FieldKey
  fieldDef: FieldDefinition
  edge: EdgePosition
  order: number
}

/** Fixed edge assignment for each field — user-specified layout */
const FIELD_EDGE_AFFINITY: Record<FieldKey, EdgePosition> = {
  script: 'left',
  dialogues: 'left',
  combat: 'right',
  events: 'right',
  soundtrack: 'top',
  diceRolls: 'top',
  vibe: 'top',
  characters: 'bottom',
  secrets: 'bottom',
  gmNotes: 'bottom',
  custom: 'bottom',
}

/**
 * Compute the peripheral layout: assign each populated field to its fixed screen edge.
 *
 * All four edges are always active. Each field goes to its assigned edge.
 * Empty edges simply produce no assignments.
 *
 * @param populatedFields - Only fields that have content (already filtered)
 * @returns Array of assignments with edge position and order within that edge
 */
export function computePeripheralLayout(
  populatedFields: FieldDefinition[],
): PeripheralAssignment[] {
  if (populatedFields.length === 0) return []

  const assignments: PeripheralAssignment[] = populatedFields.map((fieldDef) => ({
    fieldKey: fieldDef.key,
    fieldDef,
    edge: FIELD_EDGE_AFFINITY[fieldDef.key],
    order: 0,
  }))

  // Assign order within each edge based on input order (stable)
  const edgeCounts: Record<EdgePosition, number> = { left: 0, right: 0, top: 0, bottom: 0 }
  for (const a of assignments) {
    a.order = edgeCounts[a.edge]
    edgeCounts[a.edge]++
  }

  return assignments
}
