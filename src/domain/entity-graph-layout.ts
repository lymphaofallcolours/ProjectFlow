// Entity graph layout computation — ZERO framework imports
import type { Entity, EntityType, EntityRelationship } from './entity-types'

export type EntityGraphNode = {
  entityId: string
  name: string
  type: EntityType
  position: { x: number; y: number }
}

export type EntityGraphEdge = {
  id: string
  sourceId: string
  targetId: string
  label: string
}

const CLUSTER_CENTERS: Record<EntityType, { x: number; y: number }> = {
  pc: { x: 0, y: -300 },
  npc: { x: 300, y: -150 },
  enemy: { x: 300, y: 150 },
  object: { x: 0, y: 300 },
  location: { x: -300, y: 150 },
  secret: { x: -300, y: -150 },
}

const CLUSTER_RADIUS = 120

export function computeEntityGraphLayout(
  entities: Entity[],
  typeFilter?: Set<EntityType>,
): { nodes: EntityGraphNode[]; edges: EntityGraphEdge[] } {
  const filtered = typeFilter
    ? entities.filter((e) => typeFilter.has(e.type))
    : entities

  const filteredIds = new Set(filtered.map((e) => e.id))

  // Group by type
  const byType = new Map<EntityType, Entity[]>()
  for (const entity of filtered) {
    const group = byType.get(entity.type) ?? []
    group.push(entity)
    byType.set(entity.type, group)
  }

  // Position entities in circles around cluster centers
  const nodes: EntityGraphNode[] = []
  for (const [type, group] of byType.entries()) {
    const center = CLUSTER_CENTERS[type]
    const count = group.length
    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i) / Math.max(count, 1) - Math.PI / 2
      const radius = count === 1 ? 0 : CLUSTER_RADIUS
      nodes.push({
        entityId: group[i].id,
        name: group[i].name,
        type,
        position: {
          x: center.x + radius * Math.cos(angle),
          y: center.y + radius * Math.sin(angle),
        },
      })
    }
  }

  // Collect edges (only between filtered entities)
  const edges: EntityGraphEdge[] = []
  for (const entity of filtered) {
    const rels: EntityRelationship[] = entity.relationships ?? []
    for (const rel of rels) {
      if (filteredIds.has(rel.targetEntityId)) {
        edges.push({
          id: `${entity.id}-${rel.targetEntityId}`,
          sourceId: entity.id,
          targetId: rel.targetEntityId,
          label: rel.type,
        })
      }
    }
  }

  return { nodes, edges }
}
