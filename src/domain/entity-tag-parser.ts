// Entity tag parser — ZERO framework imports
// Parses the entity tagging DSL: [!%$~&]?[@#]Name(+status)?
import type { EntityType } from './entity-types'
import { ENTITY_TYPE_CONFIGS } from './entity-types'

export type EntityTagMode = 'present' | 'mentioned'

export type ParsedEntityTag = {
  raw: string
  prefix: string
  mode: EntityTagMode
  name: string
  status?: string
  entityType: EntityType
  startIndex: number
  endIndex: number
}

// Regex breakdown:
// ([!%$~&]?) — optional type prefix
// ([@#])     — present (@) or mentioned (#)
// ([A-Za-z][a-zA-Z0-9']*(?:[ -][A-Z][a-zA-Z0-9']*)*) — entity name:
//   first word (any case), then optional space/hyphen + uppercase-start words
//   this lets multi-word names like "Hive Primus" match while stopping at lowercase text
// (?:\+([a-zA-Z0-9_-]+))? — optional status marker
const TAG_PATTERN = /([!%$~&]?)([@#])([A-Za-z][a-zA-Z0-9']*(?:[ -][A-Z][a-zA-Z0-9']*)*)(?:\+([a-zA-Z0-9_-]+))?/g

export const ENTITY_TAG_REGEX = TAG_PATTERN

const PREFIX_TO_TYPE: Record<string, EntityType> = Object.fromEntries(
  ENTITY_TYPE_CONFIGS.map((c) => [c.prefix, c.type]),
)

export function resolveEntityType(prefix: string): EntityType {
  return PREFIX_TO_TYPE[prefix] ?? 'pc'
}

export function parseEntityTags(text: string): ParsedEntityTag[] {
  const results: ParsedEntityTag[] = []
  const regex = new RegExp(TAG_PATTERN.source, TAG_PATTERN.flags)
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const [raw, prefix, symbol, name, status] = match
    results.push({
      raw,
      prefix,
      mode: symbol === '@' ? 'present' : 'mentioned',
      name: name.trim(),
      status,
      entityType: resolveEntityType(prefix),
      startIndex: match.index,
      endIndex: match.index + raw.length,
    })
  }

  return results
}

export function buildEntityTag(
  type: EntityType,
  name: string,
  mode: EntityTagMode,
  status?: string,
): string {
  const config = ENTITY_TYPE_CONFIGS.find((c) => c.type === type)
  if (!config) throw new Error(`Unknown entity type: ${type}`)

  const prefix = config.prefix
  const symbol = mode === 'present' ? '@' : '#'
  const statusSuffix = status ? `+${status}` : ''
  return `${prefix}${symbol}${name}${statusSuffix}`
}

export function isValidEntityName(name: string): boolean {
  if (!name || name.length === 0) return false
  return /^[A-Za-z][A-Za-z0-9 '-]*$/.test(name)
}
