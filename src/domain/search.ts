// Full-text search across node fields — ZERO framework imports
import type { StoryNode, FieldKey, RichContent, NodeFields } from './types'
import type { EntityType } from './entity-types'
import { parseEntityTags } from './entity-tag-parser'

export type SearchResult = {
  nodeId: string
  nodeLabel: string
  fieldKey: FieldKey
  matchText: string
  matchIndex: number
}

export type EntitySearchResult = {
  nodeId: string
  mode: 'present' | 'mentioned'
  fieldKey: FieldKey
}

type SearchOptions = {
  caseSensitive?: boolean
  fieldKeys?: FieldKey[]
}

const RICH_CONTENT_FIELDS: FieldKey[] = [
  'script', 'gmNotes', 'vibe', 'events', 'combat', 'characters', 'secrets',
]

function extractFieldText(fields: NodeFields, fieldKey: FieldKey): string[] {
  const value = fields[fieldKey]

  if (fieldKey === 'dialogues') {
    return (value as NodeFields['dialogues']).map(
      (d) => `${d.entityRef} ${d.line} ${d.direction ?? ''}`,
    )
  }
  if (fieldKey === 'soundtrack') {
    return (value as NodeFields['soundtrack']).map(
      (s) => `${s.trackName} ${s.url ?? ''} ${s.note ?? ''}`,
    )
  }
  if (fieldKey === 'diceRolls') {
    return (value as NodeFields['diceRolls']).map(
      (d) => `${d.description} ${d.formula ?? ''} ${d.result ?? ''}`,
    )
  }
  if (fieldKey === 'conditions') {
    return (value as NodeFields['conditions']).map(
      (c) => `${c.description} ${c.notes ?? ''}`,
    )
  }
  if (fieldKey === 'custom') {
    return (value as NodeFields['custom']).map(
      (c) => `${c.label} ${c.content.markdown}`,
    )
  }

  // RichContent field
  return [(value as RichContent).markdown]
}

const ALL_FIELD_KEYS: FieldKey[] = [
  ...RICH_CONTENT_FIELDS,
  'dialogues', 'soundtrack', 'diceRolls', 'conditions', 'custom',
]

export function searchNodes(
  nodes: Record<string, StoryNode>,
  query: string,
  options?: SearchOptions,
): SearchResult[] {
  if (!query) return []

  const caseSensitive = options?.caseSensitive ?? false
  const fieldKeys = options?.fieldKeys ?? ALL_FIELD_KEYS
  const searchQuery = caseSensitive ? query : query.toLowerCase()
  const results: SearchResult[] = []

  for (const node of Object.values(nodes)) {
    for (const fieldKey of fieldKeys) {
      const texts = extractFieldText(node.fields, fieldKey)
      for (const text of texts) {
        const searchText = caseSensitive ? text : text.toLowerCase()
        let startIdx = 0
        let matchIndex: number

        while ((matchIndex = searchText.indexOf(searchQuery, startIdx)) !== -1) {
          const contextStart = Math.max(0, matchIndex - 20)
          const contextEnd = Math.min(text.length, matchIndex + query.length + 20)
          results.push({
            nodeId: node.id,
            nodeLabel: node.label,
            fieldKey,
            matchText: text.slice(contextStart, contextEnd),
            matchIndex,
          })
          startIdx = matchIndex + 1
        }
      }
    }
  }

  return results
}

export function searchNodesByEntity(
  nodes: Record<string, StoryNode>,
  entityName: string,
  entityType?: EntityType,
): EntitySearchResult[] {
  const results: EntitySearchResult[] = []
  const lowerName = entityName.toLowerCase()

  for (const node of Object.values(nodes)) {
    for (const fieldKey of ALL_FIELD_KEYS) {
      const texts = extractFieldText(node.fields, fieldKey)
      for (const text of texts) {
        const tags = parseEntityTags(text)
        for (const tag of tags) {
          if (
            tag.name.toLowerCase() === lowerName &&
            (entityType === undefined || tag.entityType === entityType)
          ) {
            results.push({
              nodeId: node.id,
              mode: tag.mode,
              fieldKey,
            })
          }
        }
      }
    }
  }

  return results
}
