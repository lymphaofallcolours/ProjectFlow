import { describe, it, expect, beforeEach } from 'vitest'
import { useEntityStore } from '@/application/entity-store'
import { useGraphStore } from '@/application/graph-store'
import { searchNodes, searchNodesByEntity } from '@/domain/search'
import { parseEntityTags, buildEntityTag } from '@/domain/entity-tag-parser'

describe('Entity search (integration)', () => {
  beforeEach(() => {
    useEntityStore.getState().reset()
    useGraphStore.getState().reset()
  })

  it('finds entities across multiple nodes with different field types', () => {
    const n1 = useGraphStore.getState().addNode('narration', { x: 0, y: 0 }, 'Briefing')
    const n2 = useGraphStore.getState().addNode('combat', { x: 200, y: 0 }, 'Ambush')

    useGraphStore.getState().updateField(n1, 'script', { markdown: '@Alfa briefs the team about !@Voss' })
    useGraphStore.getState().updateField(n2, 'characters', { markdown: '@Alfa, @Bravo, %@Carnifex' })
    useGraphStore.getState().updateField(n2, 'gmNotes', { markdown: 'If players mention #Alfa to !@Voss, reveal secret' })

    const nodes = useGraphStore.getState().nodes
    const alfaResults = searchNodesByEntity(nodes, 'Alfa')
    expect(alfaResults).toHaveLength(3) // n1 script, n2 characters, n2 gmNotes

    const vossResults = searchNodesByEntity(nodes, 'Voss')
    expect(vossResults).toHaveLength(2) // n1 script, n2 gmNotes

    const carnifexResults = searchNodesByEntity(nodes, 'Carnifex')
    expect(carnifexResults).toHaveLength(1) // n2 characters
  })

  it('distinguishes present and mentioned modes in search results', () => {
    const n1 = useGraphStore.getState().addNode('social', { x: 0, y: 0 }, 'Scene')
    useGraphStore.getState().updateField(n1, 'script', { markdown: '@Alfa is here. They talk about #Bravo.' })

    const nodes = useGraphStore.getState().nodes
    const alfaResults = searchNodesByEntity(nodes, 'Alfa')
    expect(alfaResults).toHaveLength(1)
    expect(alfaResults[0].mode).toBe('present')

    const bravoResults = searchNodesByEntity(nodes, 'Bravo')
    expect(bravoResults).toHaveLength(1)
    expect(bravoResults[0].mode).toBe('mentioned')
  })

  it('text search finds entity tags by name', () => {
    const n1 = useGraphStore.getState().addNode('narration', { x: 0, y: 0 }, 'Scene')
    useGraphStore.getState().updateField(n1, 'script', { markdown: '!@Voss orders the squad forward' })

    const nodes = useGraphStore.getState().nodes
    const results = searchNodes(nodes, 'Voss')
    expect(results).toHaveLength(1)
    expect(results[0].matchText).toContain('Voss')
  })

  it('entity tag parser and builder work together with entity store', () => {
    const entityStore = useEntityStore.getState()
    entityStore.addEntity('npc', 'Voss')
    entityStore.addEntity('enemy', 'Carnifex')

    // Build tags
    const vossTag = buildEntityTag('npc', 'Voss', 'present', 'dead')
    const carnifexTag = buildEntityTag('enemy', 'Carnifex', 'mentioned')

    const text = `${vossTag} falls. The team recalls ${carnifexTag}.`

    // Parse and verify
    const tags = parseEntityTags(text)
    expect(tags).toHaveLength(2)

    expect(tags[0].name).toBe('Voss')
    expect(tags[0].entityType).toBe('npc')
    expect(tags[0].mode).toBe('present')
    expect(tags[0].status).toBe('dead')

    expect(tags[1].name).toBe('Carnifex')
    expect(tags[1].entityType).toBe('enemy')
    expect(tags[1].mode).toBe('mentioned')

    // Verify entities exist in store
    const restoredStore = useEntityStore.getState()
    const voss = restoredStore.getByName('Voss', 'npc')
    expect(voss).toBeDefined()
    const carnifex = restoredStore.getByName('Carnifex', 'enemy')
    expect(carnifex).toBeDefined()
  })

  it('search works with multi-word entity names', () => {
    const n1 = useGraphStore.getState().addNode('investigation', { x: 0, y: 0 }, 'Explore')
    useGraphStore.getState().updateField(n1, 'script', { markdown: 'The team arrives at ~@Hive Primus' })

    const nodes = useGraphStore.getState().nodes
    const results = searchNodesByEntity(nodes, 'Hive Primus')
    expect(results).toHaveLength(1)
    expect(results[0].mode).toBe('present')
  })

  it('search with status markers finds entities', () => {
    const n1 = useGraphStore.getState().addNode('combat', { x: 0, y: 0 }, 'Battle')
    useGraphStore.getState().updateField(n1, 'script', { markdown: '@Alfa+wounded holds the line' })

    const nodes = useGraphStore.getState().nodes
    const results = searchNodesByEntity(nodes, 'Alfa')
    expect(results).toHaveLength(1)
  })
})
