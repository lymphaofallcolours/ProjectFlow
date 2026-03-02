import type { Entity, EntityType } from '@/domain/entity-types'

export type SuggestionItem = {
  id: string
  name: string
  type: EntityType
  isCreate?: boolean
}

export function buildSuggestionItems(
  query: string,
  entities: Entity[],
  entityType: EntityType,
): SuggestionItem[] {
  const lowerQuery = query.toLowerCase()
  const filtered: SuggestionItem[] = entities
    .filter(
      (e) =>
        e.type === entityType &&
        e.name.toLowerCase().includes(lowerQuery),
    )
    .map((e) => ({ id: e.id, name: e.name, type: e.type }))

  // Add "create new" option if no exact match
  if (
    query.length > 0 &&
    !filtered.some((e) => e.name.toLowerCase() === lowerQuery)
  ) {
    filtered.push({
      id: `create-${query}`,
      name: query,
      type: entityType,
      isCreate: true,
    })
  }

  return filtered
}
