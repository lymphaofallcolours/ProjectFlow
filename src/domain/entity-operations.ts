// Entity CRUD operations — ZERO framework imports
import type { Entity, EntityType, EntityRegistry } from './entity-types'

export function createEntity(
  type: EntityType,
  name: string,
  description?: string,
): Entity {
  return {
    id: crypto.randomUUID(),
    type,
    name,
    description,
    statusHistory: [],
    custom: {},
  }
}

export function updateEntity(
  entity: Entity,
  updates: Partial<Pick<Entity, 'name' | 'description' | 'affiliations' | 'relationships'>>,
): Entity {
  return { ...entity, ...updates }
}

export function deleteEntity(
  registry: EntityRegistry,
  entityId: string,
): EntityRegistry {
  const remaining = Object.fromEntries(
    Object.entries(registry.entities).filter(([id]) => id !== entityId),
  )
  return { ...registry, entities: remaining }
}

export function addEntityToRegistry(
  registry: EntityRegistry,
  entity: Entity,
): EntityRegistry {
  return {
    ...registry,
    entities: { ...registry.entities, [entity.id]: entity },
  }
}

export function getEntityByName(
  registry: EntityRegistry,
  name: string,
  type?: EntityType,
): Entity | undefined {
  const lowerName = name.toLowerCase()
  return Object.values(registry.entities).find(
    (e) =>
      e.name.toLowerCase() === lowerName &&
      (type === undefined || e.type === type),
  )
}

export function getEntitiesByType(
  registry: EntityRegistry,
  type: EntityType,
): Entity[] {
  return Object.values(registry.entities).filter((e) => e.type === type)
}

export function addStatusEntry(
  entity: Entity,
  nodeId: string,
  status: string,
  note?: string,
): Entity {
  return {
    ...entity,
    statusHistory: [
      ...entity.statusHistory,
      { nodeId, status, note },
    ],
  }
}
