// Entity CRUD operations — ZERO framework imports
import type { Entity, EntityType, EntityRegistry } from './entity-types'
import { ENTITY_TYPE_CONFIGS } from './entity-types'

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

const TYPE_ORDER: EntityType[] = ['pc', 'npc', 'enemy', 'object', 'location', 'secret']

export function exportEntityRegistryAsMarkdown(registry: EntityRegistry): string {
  const entities = Object.values(registry.entities)
  if (entities.length === 0) {
    return '# Campaign Entity Codex\n\n*No entities registered.*\n'
  }

  const lines: string[] = ['# Campaign Entity Codex', '']

  for (const type of TYPE_ORDER) {
    const group = entities.filter((e) => e.type === type)
    if (group.length === 0) continue

    const config = ENTITY_TYPE_CONFIGS.find((c) => c.type === type)
    const label = config?.label ?? type
    lines.push(`## ${label}s`, '')

    const sorted = [...group].sort((a, b) => a.name.localeCompare(b.name))
    for (const entity of sorted) {
      lines.push(`### ${entity.name}`)
      if (entity.description) {
        lines.push('', entity.description)
      }
      if (entity.affiliations && entity.affiliations.length > 0) {
        lines.push('', `**Affiliations:** ${entity.affiliations.join(', ')}`)
      }
      if (entity.statusHistory.length > 0) {
        lines.push('', '**Status History:**')
        for (const entry of entity.statusHistory) {
          const note = entry.note ? ` — ${entry.note}` : ''
          lines.push(`- ${entry.status}${note}`)
        }
      }
      lines.push('')
    }
  }

  return lines.join('\n')
}
