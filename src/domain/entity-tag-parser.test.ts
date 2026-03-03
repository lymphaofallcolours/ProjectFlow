import { describe, it, expect } from 'vitest'
import {
  parseEntityTags,
  resolveEntityType,
  buildEntityTag,
  isValidEntityName,
  extractEntityTypesFromNodeFields,
  extractStatusTagsFromText,
} from './entity-tag-parser'
import { createTestNode, createPopulatedNodeFields } from '../../tests/fixtures/factories'

describe('resolveEntityType', () => {
  it('maps empty prefix to pc', () => {
    expect(resolveEntityType('')).toBe('pc')
  })

  it('maps ! prefix to npc', () => {
    expect(resolveEntityType('!')).toBe('npc')
  })

  it('maps % prefix to enemy', () => {
    expect(resolveEntityType('%')).toBe('enemy')
  })

  it('maps $ prefix to object', () => {
    expect(resolveEntityType('$')).toBe('object')
  })

  it('maps ~ prefix to location', () => {
    expect(resolveEntityType('~')).toBe('location')
  })

  it('maps & prefix to secret', () => {
    expect(resolveEntityType('&')).toBe('secret')
  })

  it('defaults to pc for unknown prefix', () => {
    expect(resolveEntityType('^')).toBe('pc')
  })
})

describe('parseEntityTags', () => {
  describe('present tags (@)', () => {
    it('parses a basic PC present tag', () => {
      const tags = parseEntityTags('The @Alfa leads the charge')
      expect(tags).toHaveLength(1)
      expect(tags[0].name).toBe('Alfa')
      expect(tags[0].mode).toBe('present')
      expect(tags[0].entityType).toBe('pc')
      expect(tags[0].prefix).toBe('')
    })

    it('parses an NPC present tag', () => {
      const tags = parseEntityTags('!@Voss speaks')
      expect(tags).toHaveLength(1)
      expect(tags[0].name).toBe('Voss')
      expect(tags[0].mode).toBe('present')
      expect(tags[0].entityType).toBe('npc')
      expect(tags[0].prefix).toBe('!')
    })

    it('parses an enemy present tag', () => {
      const tags = parseEntityTags('%@Carnifex attacks')
      expect(tags).toHaveLength(1)
      expect(tags[0].name).toBe('Carnifex')
      expect(tags[0].entityType).toBe('enemy')
    })

    it('parses an object present tag', () => {
      const tags = parseEntityTags('Found $@Rosarius')
      expect(tags).toHaveLength(1)
      expect(tags[0].name).toBe('Rosarius')
      expect(tags[0].entityType).toBe('object')
    })

    it('parses a location present tag', () => {
      const tags = parseEntityTags('Arrived at ~@Hive Primus')
      expect(tags).toHaveLength(1)
      expect(tags[0].name).toBe('Hive Primus')
      expect(tags[0].entityType).toBe('location')
    })

    it('parses a secret present tag', () => {
      const tags = parseEntityTags('Discovered &@Genestealer')
      expect(tags).toHaveLength(1)
      expect(tags[0].name).toBe('Genestealer')
      expect(tags[0].entityType).toBe('secret')
    })
  })

  describe('mentioned tags (#)', () => {
    it('parses a basic PC mentioned tag', () => {
      const tags = parseEntityTags('They heard about #Bravo')
      expect(tags).toHaveLength(1)
      expect(tags[0].name).toBe('Bravo')
      expect(tags[0].mode).toBe('mentioned')
      expect(tags[0].entityType).toBe('pc')
    })

    it('parses an NPC mentioned tag', () => {
      const tags = parseEntityTags('!#Voss was mentioned')
      expect(tags).toHaveLength(1)
      expect(tags[0].name).toBe('Voss')
      expect(tags[0].mode).toBe('mentioned')
      expect(tags[0].entityType).toBe('npc')
    })

    it('parses an enemy mentioned tag', () => {
      const tags = parseEntityTags('Rumors of %#Hive Tyrant')
      expect(tags).toHaveLength(1)
      expect(tags[0].name).toBe('Hive Tyrant')
      expect(tags[0].entityType).toBe('enemy')
    })

    it('parses an object mentioned tag', () => {
      const tags = parseEntityTags('Lost $#Beacon')
      expect(tags).toHaveLength(1)
      expect(tags[0].name).toBe('Beacon')
      expect(tags[0].entityType).toBe('object')
    })

    it('parses a location mentioned tag', () => {
      const tags = parseEntityTags('tales of ~#Jericho Reach')
      expect(tags).toHaveLength(1)
      expect(tags[0].name).toBe('Jericho Reach')
      expect(tags[0].entityType).toBe('location')
    })

    it('parses a secret mentioned tag', () => {
      const tags = parseEntityTags('whispers of &#Artifact')
      expect(tags).toHaveLength(1)
      expect(tags[0].name).toBe('Artifact')
      expect(tags[0].entityType).toBe('secret')
    })
  })

  describe('status markers', () => {
    it('parses a PC with status', () => {
      const tags = parseEntityTags('@Alfa+wounded')
      expect(tags).toHaveLength(1)
      expect(tags[0].name).toBe('Alfa')
      expect(tags[0].status).toBe('wounded')
    })

    it('parses an NPC with status', () => {
      const tags = parseEntityTags('!@Voss+dead')
      expect(tags).toHaveLength(1)
      expect(tags[0].name).toBe('Voss')
      expect(tags[0].status).toBe('dead')
    })

    it('parses an enemy with status', () => {
      const tags = parseEntityTags('%@Carnifex+fleeing')
      expect(tags).toHaveLength(1)
      expect(tags[0].status).toBe('fleeing')
    })

    it('parses an object with status', () => {
      const tags = parseEntityTags('$@Rosarius+destroyed')
      expect(tags).toHaveLength(1)
      expect(tags[0].status).toBe('destroyed')
    })

    it('parses hyphenated status markers', () => {
      const tags = parseEntityTags('@Alfa+near-death')
      expect(tags).toHaveLength(1)
      expect(tags[0].status).toBe('near-death')
    })

    it('parses underscore status markers', () => {
      const tags = parseEntityTags('@Alfa+badly_hurt')
      expect(tags).toHaveLength(1)
      expect(tags[0].status).toBe('badly_hurt')
    })
  })

  describe('multi-word names', () => {
    it('parses names with spaces', () => {
      const tags = parseEntityTags('~@Hive Primus')
      expect(tags).toHaveLength(1)
      expect(tags[0].name).toBe('Hive Primus')
    })

    it('parses names with apostrophes', () => {
      const tags = parseEntityTags("!@O'Brien speaks")
      expect(tags).toHaveLength(1)
      expect(tags[0].name).toBe("O'Brien")
    })

    it('parses names with hyphens', () => {
      const tags = parseEntityTags('!@Karl-Franz arrives')
      expect(tags).toHaveLength(1)
      expect(tags[0].name).toBe('Karl-Franz')
    })
  })

  describe('multiple tags', () => {
    it('parses multiple tags in a single string', () => {
      const tags = parseEntityTags('@Alfa and !@Voss discuss %#Carnifex')
      expect(tags).toHaveLength(3)
      expect(tags[0].name).toBe('Alfa')
      expect(tags[1].name).toBe('Voss')
      expect(tags[2].name).toBe('Carnifex')
    })

    it('parses adjacent tags', () => {
      const tags = parseEntityTags('@Alfa @Bravo')
      expect(tags).toHaveLength(2)
      expect(tags[0].name).toBe('Alfa')
      expect(tags[1].name).toBe('Bravo')
    })

    it('parses tags separated by commas', () => {
      const tags = parseEntityTags('@Alfa, !@Voss, %@Carnifex')
      expect(tags).toHaveLength(3)
    })
  })

  describe('start and end indices', () => {
    it('tracks start index of tags', () => {
      const tags = parseEntityTags('Hello @Alfa')
      expect(tags[0].startIndex).toBe(6)
    })

    it('tracks end index of tags', () => {
      const tags = parseEntityTags('@Alfa')
      expect(tags[0].endIndex).toBe(5)
    })

    it('tracks indices of status-bearing tags', () => {
      const tags = parseEntityTags('@Alfa+wounded')
      expect(tags[0].startIndex).toBe(0)
      expect(tags[0].endIndex).toBe(13)
    })
  })

  describe('edge cases', () => {
    it('returns empty array for text with no tags', () => {
      const tags = parseEntityTags('No entities here')
      expect(tags).toEqual([])
    })

    it('returns empty array for empty string', () => {
      const tags = parseEntityTags('')
      expect(tags).toEqual([])
    })

    it('preserves raw text in result', () => {
      const tags = parseEntityTags('!@Voss+dead')
      expect(tags[0].raw).toBe('!@Voss+dead')
    })

    it('handles tags at end of string', () => {
      const tags = parseEntityTags('Present: @Alfa')
      expect(tags).toHaveLength(1)
      expect(tags[0].name).toBe('Alfa')
    })

    it('handles tags at start of string', () => {
      const tags = parseEntityTags('@Alfa leads')
      expect(tags).toHaveLength(1)
      expect(tags[0].name).toBe('Alfa')
    })

    it('handles tags followed by punctuation', () => {
      const tags = parseEntityTags('@Alfa, you go first.')
      expect(tags).toHaveLength(1)
      expect(tags[0].name).toBe('Alfa')
    })
  })
})

describe('buildEntityTag', () => {
  it('builds a PC present tag', () => {
    expect(buildEntityTag('pc', 'Alfa', 'present')).toBe('@Alfa')
  })

  it('builds a PC mentioned tag', () => {
    expect(buildEntityTag('pc', 'Alfa', 'mentioned')).toBe('#Alfa')
  })

  it('builds an NPC present tag', () => {
    expect(buildEntityTag('npc', 'Voss', 'present')).toBe('!@Voss')
  })

  it('builds an NPC mentioned tag', () => {
    expect(buildEntityTag('npc', 'Voss', 'mentioned')).toBe('!#Voss')
  })

  it('builds an enemy tag', () => {
    expect(buildEntityTag('enemy', 'Carnifex', 'present')).toBe('%@Carnifex')
  })

  it('builds an object tag', () => {
    expect(buildEntityTag('object', 'Rosarius', 'present')).toBe('$@Rosarius')
  })

  it('builds a location tag', () => {
    expect(buildEntityTag('location', 'Hive Primus', 'mentioned')).toBe('~#Hive Primus')
  })

  it('builds a secret tag', () => {
    expect(buildEntityTag('secret', 'Genestealer', 'present')).toBe('&@Genestealer')
  })

  it('includes status marker', () => {
    expect(buildEntityTag('pc', 'Alfa', 'present', 'wounded')).toBe('@Alfa+wounded')
  })

  it('includes status for NPC', () => {
    expect(buildEntityTag('npc', 'Voss', 'present', 'dead')).toBe('!@Voss+dead')
  })
})

describe('isValidEntityName', () => {
  it('accepts simple names', () => {
    expect(isValidEntityName('Alfa')).toBe(true)
  })

  it('accepts names with spaces', () => {
    expect(isValidEntityName('Hive Primus')).toBe(true)
  })

  it('accepts names with apostrophes', () => {
    expect(isValidEntityName("O'Brien")).toBe(true)
  })

  it('accepts names with hyphens', () => {
    expect(isValidEntityName('Karl-Franz')).toBe(true)
  })

  it('accepts names with numbers', () => {
    expect(isValidEntityName('Alpha2')).toBe(true)
  })

  it('rejects empty string', () => {
    expect(isValidEntityName('')).toBe(false)
  })

  it('rejects names starting with number', () => {
    expect(isValidEntityName('123abc')).toBe(false)
  })

  it('rejects names with special characters', () => {
    expect(isValidEntityName('Alfa@Bravo')).toBe(false)
  })

  it('rejects names starting with space', () => {
    expect(isValidEntityName(' Alfa')).toBe(false)
  })
})

describe('parse → build roundtrip', () => {
  it('roundtrips a PC present tag', () => {
    const tag = '@Alfa'
    const [parsed] = parseEntityTags(tag)
    const rebuilt = buildEntityTag(parsed.entityType, parsed.name, parsed.mode, parsed.status)
    expect(rebuilt).toBe(tag)
  })

  it('roundtrips an NPC present tag with status', () => {
    const tag = '!@Voss+dead'
    const [parsed] = parseEntityTags(tag)
    const rebuilt = buildEntityTag(parsed.entityType, parsed.name, parsed.mode, parsed.status)
    expect(rebuilt).toBe(tag)
  })

  it('roundtrips an enemy mentioned tag', () => {
    const tag = '%#Carnifex'
    const [parsed] = parseEntityTags(tag)
    const rebuilt = buildEntityTag(parsed.entityType, parsed.name, parsed.mode, parsed.status)
    expect(rebuilt).toBe(tag)
  })

  it('roundtrips a location present tag', () => {
    const tag = '~@Hive Primus'
    const [parsed] = parseEntityTags(`See ${tag} for details`)
    const rebuilt = buildEntityTag(parsed.entityType, parsed.name, parsed.mode, parsed.status)
    expect(rebuilt).toBe(tag)
  })

  it('roundtrips a secret mentioned tag', () => {
    const tag = '&#Artifact'
    const [parsed] = parseEntityTags(tag)
    const rebuilt = buildEntityTag(parsed.entityType, parsed.name, parsed.mode, parsed.status)
    expect(rebuilt).toBe(tag)
  })

  it('roundtrips an object present tag with status', () => {
    const tag = '$@Rosarius+destroyed'
    const [parsed] = parseEntityTags(tag)
    const rebuilt = buildEntityTag(parsed.entityType, parsed.name, parsed.mode, parsed.status)
    expect(rebuilt).toBe(tag)
  })
})

describe('extractEntityTypesFromNodeFields', () => {
  it('returns empty set for node with no entity tags', () => {
    const node = createTestNode()
    const types = extractEntityTypesFromNodeFields(node)
    expect(types.size).toBe(0)
  })

  it('extracts entity types from rich content fields', () => {
    const node = createTestNode({
      fields: createPopulatedNodeFields({
        script: { markdown: '@Alfa enters the room' },
        gmNotes: { markdown: '!@Voss is watching' },
      }),
    })
    const types = extractEntityTypesFromNodeFields(node)
    expect(types.has('pc')).toBe(true)
    expect(types.has('npc')).toBe(true)
    expect(types.size).toBe(2)
  })

  it('extracts entity types from dialogue entries', () => {
    const node = createTestNode({
      fields: createPopulatedNodeFields({
        script: { markdown: '' },
        gmNotes: { markdown: '' },
        dialogues: [
          { entityRef: '@Alfa', line: 'Hello there' },
          { entityRef: '%@Carnifex', line: 'ROAR' },
        ],
      }),
    })
    const types = extractEntityTypesFromNodeFields(node)
    expect(types.has('pc')).toBe(true)
    expect(types.has('enemy')).toBe(true)
  })

  it('extracts entity types from custom fields', () => {
    const node = createTestNode({
      fields: createPopulatedNodeFields({
        script: { markdown: '' },
        gmNotes: { markdown: '' },
        custom: [
          { label: 'Loot', content: { markdown: '$@Rosarius is here' } },
        ],
      }),
    })
    const types = extractEntityTypesFromNodeFields(node)
    expect(types.has('object')).toBe(true)
  })

  it('deduplicates types across fields', () => {
    const node = createTestNode({
      fields: createPopulatedNodeFields({
        script: { markdown: '@Alfa does something' },
        gmNotes: { markdown: '@Bravo also does something' },
        characters: { markdown: '@Charlie too' },
      }),
    })
    const types = extractEntityTypesFromNodeFields(node)
    expect(types.has('pc')).toBe(true)
    expect(types.size).toBe(1)
  })

  it('extracts all 6 entity types', () => {
    const node = createTestNode({
      fields: createPopulatedNodeFields({
        script: { markdown: '@Alfa !@Voss %@Carnifex $@Rosarius ~@Hive &@Secret' },
        gmNotes: { markdown: '' },
      }),
    })
    const types = extractEntityTypesFromNodeFields(node)
    expect(types.size).toBe(6)
  })
})

describe('extractStatusTagsFromText', () => {
  it('returns empty array for text without status tags', () => {
    expect(extractStatusTagsFromText('@Alfa enters')).toEqual([])
  })

  it('extracts a single status tag', () => {
    const tags = extractStatusTagsFromText('@Alfa+wounded')
    expect(tags).toHaveLength(1)
    expect(tags[0]).toEqual({ name: 'Alfa', entityType: 'pc', status: 'wounded' })
  })

  it('extracts multiple status tags', () => {
    const tags = extractStatusTagsFromText('@Alfa+wounded !@Voss+dead')
    expect(tags).toHaveLength(2)
    expect(tags[0].name).toBe('Alfa')
    expect(tags[0].status).toBe('wounded')
    expect(tags[1].name).toBe('Voss')
    expect(tags[1].status).toBe('dead')
  })

  it('ignores tags without status markers', () => {
    const tags = extractStatusTagsFromText('@Alfa enters while !@Voss+dead watches')
    expect(tags).toHaveLength(1)
    expect(tags[0].name).toBe('Voss')
  })

  it('preserves entity type from prefix', () => {
    const tags = extractStatusTagsFromText('%@Carnifex+enraged')
    expect(tags[0].entityType).toBe('enemy')
    expect(tags[0].status).toBe('enraged')
  })
})
