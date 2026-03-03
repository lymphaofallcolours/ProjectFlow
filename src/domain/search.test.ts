import { describe, it, expect } from 'vitest'
import { searchNodes, searchNodesByEntity } from './search'
import { createTestNode, createPopulatedNodeFields } from '../../tests/fixtures/factories'

function makeNodes(...nodes: ReturnType<typeof createTestNode>[]) {
  return Object.fromEntries(nodes.map((n) => [n.id, n]))
}

describe('searchNodes', () => {
  it('finds text in a script field', () => {
    const node = createTestNode({
      id: 'n1',
      label: 'Scene 1',
      fields: createPopulatedNodeFields({ script: { markdown: 'The party enters the lower district' } }),
    })
    const results = searchNodes(makeNodes(node), 'lower district')
    expect(results).toHaveLength(1)
    expect(results[0].nodeId).toBe('n1')
    expect(results[0].fieldKey).toBe('script')
    expect(results[0].nodeLabel).toBe('Scene 1')
  })

  it('finds text in GM notes', () => {
    const node = createTestNode({
      id: 'n1',
      fields: createPopulatedNodeFields({ gmNotes: { markdown: 'Secret: cult meeting upstairs' } }),
    })
    const results = searchNodes(makeNodes(node), 'cult meeting')
    expect(results).toHaveLength(1)
    expect(results[0].fieldKey).toBe('gmNotes')
  })

  it('is case-insensitive by default', () => {
    const node = createTestNode({
      id: 'n1',
      fields: createPopulatedNodeFields({ script: { markdown: 'The Target attacks' } }),
    })
    const results = searchNodes(makeNodes(node), 'target')
    expect(results).toHaveLength(1)
  })

  it('respects caseSensitive option', () => {
    const node = createTestNode({
      id: 'n1',
      fields: createPopulatedNodeFields({ script: { markdown: 'The Target attacks' } }),
    })
    const noMatch = searchNodes(makeNodes(node), 'target', { caseSensitive: true })
    expect(noMatch).toHaveLength(0)

    const match = searchNodes(makeNodes(node), 'Target', { caseSensitive: true })
    expect(match).toHaveLength(1)
  })

  it('searches dialogue fields', () => {
    const node = createTestNode({
      id: 'n1',
      fields: createPopulatedNodeFields({
        dialogues: [{ entityRef: '!@Voss', line: 'Report, Brother.', direction: 'stern' }],
      }),
    })
    const results = searchNodes(makeNodes(node), 'Report')
    expect(results).toHaveLength(1)
    expect(results[0].fieldKey).toBe('dialogues')
  })

  it('searches soundtrack fields', () => {
    const node = createTestNode({
      id: 'n1',
      fields: createPopulatedNodeFields({
        soundtrack: [{ trackName: 'Dark Descent', note: 'Start on entry' }],
      }),
    })
    const results = searchNodes(makeNodes(node), 'Dark Descent')
    expect(results).toHaveLength(1)
    expect(results[0].fieldKey).toBe('soundtrack')
  })

  it('searches dice roll fields', () => {
    const node = createTestNode({
      id: 'n1',
      fields: createPopulatedNodeFields({
        diceRolls: [{ description: 'Perception test', formula: '1d100 vs 45' }],
      }),
    })
    const results = searchNodes(makeNodes(node), 'Perception')
    expect(results).toHaveLength(1)
    expect(results[0].fieldKey).toBe('diceRolls')
  })

  it('searches custom fields', () => {
    const node = createTestNode({
      id: 'n1',
      fields: createPopulatedNodeFields({
        custom: [{ label: 'MOOD', content: { markdown: 'Tense atmosphere' } }],
      }),
    })
    const results = searchNodes(makeNodes(node), 'Tense')
    expect(results).toHaveLength(1)
    expect(results[0].fieldKey).toBe('custom')
  })

  it('finds multiple matches across nodes', () => {
    const n1 = createTestNode({
      id: 'n1',
      fields: createPopulatedNodeFields({ script: { markdown: 'Alpha enters' } }),
    })
    const n2 = createTestNode({
      id: 'n2',
      fields: createPopulatedNodeFields({ gmNotes: { markdown: 'Alpha is watching' } }),
    })
    const results = searchNodes(makeNodes(n1, n2), 'Alpha')
    expect(results).toHaveLength(2)
  })

  it('returns empty array for no matches', () => {
    const node = createTestNode({ id: 'n1' })
    const results = searchNodes(makeNodes(node), 'nonexistent')
    expect(results).toEqual([])
  })

  it('returns empty array for empty query', () => {
    const node = createTestNode({ id: 'n1' })
    const results = searchNodes(makeNodes(node), '')
    expect(results).toEqual([])
  })

  it('finds multiple matches in the same field', () => {
    const node = createTestNode({
      id: 'n1',
      fields: createPopulatedNodeFields({
        script: { markdown: 'The door opens. Another door slams.' },
      }),
    })
    const results = searchNodes(makeNodes(node), 'door')
    expect(results).toHaveLength(2)
  })

  it('provides context snippet around match', () => {
    const node = createTestNode({
      id: 'n1',
      fields: createPopulatedNodeFields({
        script: { markdown: 'The ancient artifact glows with power' },
      }),
    })
    const results = searchNodes(makeNodes(node), 'artifact')
    expect(results[0].matchText).toContain('artifact')
  })

  it('filters by field keys when provided', () => {
    const node = createTestNode({
      id: 'n1',
      fields: createPopulatedNodeFields({
        script: { markdown: 'Found it here' },
        gmNotes: { markdown: 'Found it here too' },
      }),
    })
    const results = searchNodes(makeNodes(node), 'Found', { fieldKeys: ['script'] })
    expect(results).toHaveLength(1)
    expect(results[0].fieldKey).toBe('script')
  })
})

describe('searchNodesByEntity', () => {
  it('finds a present entity in script field', () => {
    const node = createTestNode({
      id: 'n1',
      fields: createPopulatedNodeFields({ script: { markdown: '@Alfa leads the charge' } }),
    })
    const results = searchNodesByEntity(makeNodes(node), 'Alfa')
    expect(results).toHaveLength(1)
    expect(results[0].nodeId).toBe('n1')
    expect(results[0].mode).toBe('present')
    expect(results[0].fieldKey).toBe('script')
  })

  it('finds a mentioned entity', () => {
    const node = createTestNode({
      id: 'n1',
      fields: createPopulatedNodeFields({ gmNotes: { markdown: 'Heard about #Bravo' } }),
    })
    const results = searchNodesByEntity(makeNodes(node), 'Bravo')
    expect(results).toHaveLength(1)
    expect(results[0].mode).toBe('mentioned')
  })

  it('finds NPC entities with prefix', () => {
    const node = createTestNode({
      id: 'n1',
      fields: createPopulatedNodeFields({ script: { markdown: '!@Voss reports in' } }),
    })
    const results = searchNodesByEntity(makeNodes(node), 'Voss')
    expect(results).toHaveLength(1)
  })

  it('filters by entity type', () => {
    const node = createTestNode({
      id: 'n1',
      fields: createPopulatedNodeFields({
        script: { markdown: '@Alfa and !@Alfa meet' },
      }),
    })
    const pcOnly = searchNodesByEntity(makeNodes(node), 'Alfa', 'pc')
    const npcOnly = searchNodesByEntity(makeNodes(node), 'Alfa', 'npc')
    expect(pcOnly).toHaveLength(1)
    expect(pcOnly[0].mode).toBe('present')
    expect(npcOnly).toHaveLength(1)
    expect(npcOnly[0].mode).toBe('present')
  })

  it('finds entities across multiple nodes', () => {
    const n1 = createTestNode({
      id: 'n1',
      fields: createPopulatedNodeFields({ script: { markdown: '@Alfa enters' } }),
    })
    const n2 = createTestNode({
      id: 'n2',
      fields: createPopulatedNodeFields({ characters: { markdown: '@Alfa is here' } }),
    })
    const results = searchNodesByEntity(makeNodes(n1, n2), 'Alfa')
    expect(results).toHaveLength(2)
  })

  it('returns empty array when no entities match', () => {
    const node = createTestNode({
      id: 'n1',
      fields: createPopulatedNodeFields({ script: { markdown: 'No tags here' } }),
    })
    const results = searchNodesByEntity(makeNodes(node), 'Nobody')
    expect(results).toEqual([])
  })

  it('is case-insensitive', () => {
    const node = createTestNode({
      id: 'n1',
      fields: createPopulatedNodeFields({ script: { markdown: '@Alfa enters' } }),
    })
    const results = searchNodesByEntity(makeNodes(node), 'alfa')
    expect(results).toHaveLength(1)
  })
})
