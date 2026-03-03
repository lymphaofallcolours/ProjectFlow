import { describe, it, expect } from 'vitest'
import {
  createEntity,
  updateEntity,
  deleteEntity,
  addEntityToRegistry,
  getEntityByName,
  getEntitiesByType,
  addStatusEntry,
  exportEntityRegistryAsMarkdown,
  setEntityPortrait,
  addEntityRelationship,
  removeEntityRelationship,
  addEntityCustomField,
  removeEntityCustomField,
  updateEntityCustomField,
  computeIncomingRelationships,
} from './entity-operations'
import { createTestEntity, createTestEntityRegistry, createTestAttachment } from '../../tests/fixtures/factories'

describe('createEntity', () => {
  it('creates an entity with required fields', () => {
    const entity = createEntity('pc', 'Alfa')
    expect(entity.type).toBe('pc')
    expect(entity.name).toBe('Alfa')
    expect(entity.id).toBeTruthy()
    expect(entity.statusHistory).toEqual([])
    expect(entity.custom).toEqual({})
  })

  it('creates an entity with optional description', () => {
    const entity = createEntity('npc', 'Voss', 'A stern sergeant')
    expect(entity.description).toBe('A stern sergeant')
  })

  it('generates unique ids', () => {
    const a = createEntity('pc', 'Alfa')
    const b = createEntity('pc', 'Bravo')
    expect(a.id).not.toBe(b.id)
  })

  it('creates each entity type', () => {
    expect(createEntity('pc', 'A').type).toBe('pc')
    expect(createEntity('npc', 'A').type).toBe('npc')
    expect(createEntity('enemy', 'A').type).toBe('enemy')
    expect(createEntity('object', 'A').type).toBe('object')
    expect(createEntity('location', 'A').type).toBe('location')
    expect(createEntity('secret', 'A').type).toBe('secret')
  })
})

describe('updateEntity', () => {
  it('updates the name', () => {
    const entity = createTestEntity({ name: 'Old Name' })
    const updated = updateEntity(entity, { name: 'New Name' })
    expect(updated.name).toBe('New Name')
    expect(entity.name).toBe('Old Name')
  })

  it('updates the description', () => {
    const entity = createTestEntity()
    const updated = updateEntity(entity, { description: 'Updated description' })
    expect(updated.description).toBe('Updated description')
  })

  it('updates affiliations', () => {
    const entity = createTestEntity()
    const updated = updateEntity(entity, { affiliations: ['Deathwatch', 'Ultramarines'] })
    expect(updated.affiliations).toEqual(['Deathwatch', 'Ultramarines'])
  })

  it('preserves unchanged fields', () => {
    const entity = createTestEntity({ name: 'Alfa', type: 'pc' })
    const updated = updateEntity(entity, { description: 'New desc' })
    expect(updated.name).toBe('Alfa')
    expect(updated.type).toBe('pc')
  })
})

describe('deleteEntity', () => {
  it('removes the entity from the registry', () => {
    const entity = createTestEntity({ id: 'e1' })
    const registry = createTestEntityRegistry([entity])
    const updated = deleteEntity(registry, 'e1')
    expect(updated.entities['e1']).toBeUndefined()
  })

  it('preserves other entities', () => {
    const e1 = createTestEntity({ id: 'e1', name: 'Alfa' })
    const e2 = createTestEntity({ id: 'e2', name: 'Bravo' })
    const registry = createTestEntityRegistry([e1, e2])
    const updated = deleteEntity(registry, 'e1')
    expect(updated.entities['e2']).toBeDefined()
    expect(updated.entities['e2'].name).toBe('Bravo')
  })

  it('returns unchanged registry if id not found', () => {
    const registry = createTestEntityRegistry([])
    const updated = deleteEntity(registry, 'nonexistent')
    expect(updated.entities).toEqual({})
  })
})

describe('addEntityToRegistry', () => {
  it('adds an entity to an empty registry', () => {
    const registry = createTestEntityRegistry([])
    const entity = createTestEntity({ id: 'e1', name: 'Alfa' })
    const updated = addEntityToRegistry(registry, entity)
    expect(updated.entities['e1']).toBeDefined()
    expect(updated.entities['e1'].name).toBe('Alfa')
  })

  it('adds an entity alongside existing entities', () => {
    const existing = createTestEntity({ id: 'e1', name: 'Alfa' })
    const registry = createTestEntityRegistry([existing])
    const newEntity = createTestEntity({ id: 'e2', name: 'Bravo' })
    const updated = addEntityToRegistry(registry, newEntity)
    expect(Object.keys(updated.entities)).toHaveLength(2)
  })
})

describe('getEntityByName', () => {
  it('finds an entity by exact name (case-insensitive)', () => {
    const entity = createTestEntity({ name: 'Alfa' })
    const registry = createTestEntityRegistry([entity])
    const found = getEntityByName(registry, 'alfa')
    expect(found?.id).toBe(entity.id)
  })

  it('returns undefined when not found', () => {
    const registry = createTestEntityRegistry([])
    expect(getEntityByName(registry, 'Nobody')).toBeUndefined()
  })

  it('filters by type when provided', () => {
    const pc = createTestEntity({ name: 'Alfa', type: 'pc' })
    const npc = createTestEntity({ name: 'Alfa', type: 'npc' })
    const registry = createTestEntityRegistry([pc, npc])

    expect(getEntityByName(registry, 'Alfa', 'pc')?.type).toBe('pc')
    expect(getEntityByName(registry, 'Alfa', 'npc')?.type).toBe('npc')
    expect(getEntityByName(registry, 'Alfa', 'enemy')).toBeUndefined()
  })
})

describe('getEntitiesByType', () => {
  it('returns entities of the specified type', () => {
    const pc1 = createTestEntity({ type: 'pc', name: 'Alfa' })
    const pc2 = createTestEntity({ type: 'pc', name: 'Bravo' })
    const npc = createTestEntity({ type: 'npc', name: 'Voss' })
    const registry = createTestEntityRegistry([pc1, pc2, npc])

    const pcs = getEntitiesByType(registry, 'pc')
    expect(pcs).toHaveLength(2)
    expect(pcs.map((e) => e.name).sort()).toEqual(['Alfa', 'Bravo'])
  })

  it('returns empty array when no entities of type exist', () => {
    const pc = createTestEntity({ type: 'pc', name: 'Alfa' })
    const registry = createTestEntityRegistry([pc])
    expect(getEntitiesByType(registry, 'enemy')).toEqual([])
  })
})

describe('addStatusEntry', () => {
  it('adds a status entry to the entity', () => {
    const entity = createTestEntity()
    const updated = addStatusEntry(entity, 'node-1', 'wounded')
    expect(updated.statusHistory).toHaveLength(1)
    expect(updated.statusHistory[0]).toEqual({
      nodeId: 'node-1',
      status: 'wounded',
      note: undefined,
    })
  })

  it('adds a status entry with note', () => {
    const entity = createTestEntity()
    const updated = addStatusEntry(entity, 'node-1', 'dead', 'Killed by Carnifex')
    expect(updated.statusHistory[0].note).toBe('Killed by Carnifex')
  })

  it('preserves existing status entries', () => {
    let entity = createTestEntity()
    entity = addStatusEntry(entity, 'node-1', 'wounded')
    entity = addStatusEntry(entity, 'node-2', 'dead')
    expect(entity.statusHistory).toHaveLength(2)
    expect(entity.statusHistory[0].status).toBe('wounded')
    expect(entity.statusHistory[1].status).toBe('dead')
  })

  it('does not mutate the original entity', () => {
    const original = createTestEntity()
    addStatusEntry(original, 'node-1', 'wounded')
    expect(original.statusHistory).toHaveLength(0)
  })
})

describe('exportEntityRegistryAsMarkdown', () => {
  it('returns placeholder for empty registry', () => {
    const registry = createTestEntityRegistry([])
    const md = exportEntityRegistryAsMarkdown(registry)
    expect(md).toContain('# Campaign Entity Codex')
    expect(md).toContain('No entities registered')
  })

  it('groups entities by type', () => {
    const pc = createTestEntity({ type: 'pc', name: 'Alfa' })
    const npc = createTestEntity({ type: 'npc', name: 'Voss' })
    const enemy = createTestEntity({ type: 'enemy', name: 'Carnifex' })
    const registry = createTestEntityRegistry([pc, npc, enemy])
    const md = exportEntityRegistryAsMarkdown(registry)

    expect(md).toContain('## PCs')
    expect(md).toContain('### Alfa')
    expect(md).toContain('## NPCs')
    expect(md).toContain('### Voss')
    expect(md).toContain('## Enemys')
    expect(md).toContain('### Carnifex')
  })

  it('includes entity description', () => {
    const pc = createTestEntity({ type: 'pc', name: 'Alfa', description: 'Battle-brother of the Kill-Team' })
    const registry = createTestEntityRegistry([pc])
    const md = exportEntityRegistryAsMarkdown(registry)

    expect(md).toContain('Battle-brother of the Kill-Team')
  })

  it('includes affiliations', () => {
    const npc = createTestEntity({ type: 'npc', name: 'Voss' })
    npc.affiliations = ['Deathwatch', 'Inquisition']
    const registry = createTestEntityRegistry([npc])
    const md = exportEntityRegistryAsMarkdown(registry)

    expect(md).toContain('**Affiliations:** Deathwatch, Inquisition')
  })

  it('includes status history', () => {
    let entity = createTestEntity({ type: 'pc', name: 'Alfa' })
    entity = addStatusEntry(entity, 'node-1', 'wounded', 'Hit by bolter')
    entity = addStatusEntry(entity, 'node-2', 'healed')
    const registry = createTestEntityRegistry([entity])
    const md = exportEntityRegistryAsMarkdown(registry)

    expect(md).toContain('**Status History:**')
    expect(md).toContain('- wounded — Hit by bolter')
    expect(md).toContain('- healed')
  })

  it('sorts entities alphabetically within type', () => {
    const b = createTestEntity({ type: 'pc', name: 'Bravo' })
    const a = createTestEntity({ type: 'pc', name: 'Alfa' })
    const registry = createTestEntityRegistry([b, a])
    const md = exportEntityRegistryAsMarkdown(registry)

    const alfaIdx = md.indexOf('### Alfa')
    const bravoIdx = md.indexOf('### Bravo')
    expect(alfaIdx).toBeLessThan(bravoIdx)
  })

  it('skips types with no entities', () => {
    const pc = createTestEntity({ type: 'pc', name: 'Alfa' })
    const registry = createTestEntityRegistry([pc])
    const md = exportEntityRegistryAsMarkdown(registry)

    expect(md).toContain('## PCs')
    expect(md).not.toContain('## NPCs')
    expect(md).not.toContain('## Enemys')
  })

  it('renders header for codex', () => {
    const pc = createTestEntity({ type: 'pc', name: 'Alfa' })
    const registry = createTestEntityRegistry([pc])
    const md = exportEntityRegistryAsMarkdown(registry)

    expect(md.startsWith('# Campaign Entity Codex')).toBe(true)
  })
})

describe('setEntityPortrait', () => {
  it('sets a portrait on an entity', () => {
    const entity = createTestEntity()
    const portrait = createTestAttachment({ filename: 'portrait.png' })
    const updated = setEntityPortrait(entity, portrait)
    expect(updated.portrait).toBeDefined()
    expect(updated.portrait?.filename).toBe('portrait.png')
  })

  it('removes portrait when set to null', () => {
    const portrait = createTestAttachment()
    const entity = createTestEntity({ portrait })
    const updated = setEntityPortrait(entity, null)
    expect(updated.portrait).toBeUndefined()
  })

  it('does not mutate the original entity', () => {
    const entity = createTestEntity()
    const portrait = createTestAttachment()
    setEntityPortrait(entity, portrait)
    expect(entity.portrait).toBeUndefined()
  })
})

describe('addEntityRelationship', () => {
  it('adds a relationship to an entity', () => {
    const entity = createTestEntity()
    const updated = addEntityRelationship(entity, {
      targetEntityId: 'target-1',
      type: 'ally',
    })
    expect(updated.relationships).toHaveLength(1)
    expect(updated.relationships![0].targetEntityId).toBe('target-1')
    expect(updated.relationships![0].type).toBe('ally')
  })

  it('adds relationship with optional note', () => {
    const entity = createTestEntity()
    const updated = addEntityRelationship(entity, {
      targetEntityId: 'target-1',
      type: 'rival',
      note: 'Old grudge',
    })
    expect(updated.relationships![0].note).toBe('Old grudge')
  })

  it('prevents self-referencing relationship', () => {
    const entity = createTestEntity({ id: 'self-id' })
    const updated = addEntityRelationship(entity, {
      targetEntityId: 'self-id',
      type: 'ally',
    })
    expect(updated.relationships).toBeUndefined()
  })

  it('prevents duplicate relationship to same target', () => {
    let entity = createTestEntity()
    entity = addEntityRelationship(entity, {
      targetEntityId: 'target-1',
      type: 'ally',
    })
    entity = addEntityRelationship(entity, {
      targetEntityId: 'target-1',
      type: 'rival',
    })
    expect(entity.relationships).toHaveLength(1)
  })

  it('allows multiple relationships to different targets', () => {
    let entity = createTestEntity()
    entity = addEntityRelationship(entity, { targetEntityId: 'target-1', type: 'ally' })
    entity = addEntityRelationship(entity, { targetEntityId: 'target-2', type: 'rival' })
    expect(entity.relationships).toHaveLength(2)
  })

  it('does not mutate original entity', () => {
    const entity = createTestEntity()
    addEntityRelationship(entity, { targetEntityId: 'target-1', type: 'ally' })
    expect(entity.relationships).toBeUndefined()
  })
})

describe('removeEntityRelationship', () => {
  it('removes a relationship by target id', () => {
    let entity = createTestEntity()
    entity = addEntityRelationship(entity, { targetEntityId: 'target-1', type: 'ally' })
    entity = addEntityRelationship(entity, { targetEntityId: 'target-2', type: 'rival' })
    const updated = removeEntityRelationship(entity, 'target-1')
    expect(updated.relationships).toHaveLength(1)
    expect(updated.relationships![0].targetEntityId).toBe('target-2')
  })

  it('returns entity unchanged if target not found', () => {
    const entity = createTestEntity({ relationships: [] })
    const updated = removeEntityRelationship(entity, 'nonexistent')
    expect(updated.relationships).toEqual([])
  })
})

describe('addEntityCustomField', () => {
  it('adds a custom field', () => {
    const entity = createTestEntity()
    const updated = addEntityCustomField(entity, 'Weapon', 'Bolter')
    expect(updated.custom['Weapon']).toBe('Bolter')
  })

  it('does not mutate original', () => {
    const entity = createTestEntity()
    addEntityCustomField(entity, 'Weapon', 'Bolter')
    expect(entity.custom['Weapon']).toBeUndefined()
  })
})

describe('removeEntityCustomField', () => {
  it('removes a custom field', () => {
    const entity = createTestEntity()
    const withField = addEntityCustomField(entity, 'Weapon', 'Bolter')
    const updated = removeEntityCustomField(withField, 'Weapon')
    expect(updated.custom['Weapon']).toBeUndefined()
  })

  it('preserves other custom fields', () => {
    let entity = createTestEntity()
    entity = addEntityCustomField(entity, 'Weapon', 'Bolter')
    entity = addEntityCustomField(entity, 'Armor', 'Power Armor')
    const updated = removeEntityCustomField(entity, 'Weapon')
    expect(updated.custom['Armor']).toBe('Power Armor')
    expect(updated.custom['Weapon']).toBeUndefined()
  })
})

describe('updateEntityCustomField', () => {
  it('updates an existing custom field value', () => {
    let entity = createTestEntity()
    entity = addEntityCustomField(entity, 'Weapon', 'Bolter')
    const updated = updateEntityCustomField(entity, 'Weapon', 'Heavy Bolter')
    expect(updated.custom['Weapon']).toBe('Heavy Bolter')
  })

  it('returns entity unchanged if field does not exist', () => {
    const entity = createTestEntity()
    const updated = updateEntityCustomField(entity, 'Nonexistent', 'Value')
    expect(updated).toBe(entity)
  })
})

describe('computeIncomingRelationships', () => {
  it('finds entities that reference the target', () => {
    const a = createTestEntity({ id: 'a', name: 'Alfa', relationships: [{ targetEntityId: 'b', type: 'ally' }] })
    const b = createTestEntity({ id: 'b', name: 'Bravo' })
    const entities = { a, b }
    const incoming = computeIncomingRelationships(entities, 'b')
    expect(incoming).toHaveLength(1)
    expect(incoming[0].sourceEntity.id).toBe('a')
    expect(incoming[0].relationship.type).toBe('ally')
  })

  it('returns empty array when no references exist', () => {
    const a = createTestEntity({ id: 'a', name: 'Alfa' })
    const b = createTestEntity({ id: 'b', name: 'Bravo' })
    const entities = { a, b }
    const incoming = computeIncomingRelationships(entities, 'b')
    expect(incoming).toHaveLength(0)
  })

  it('excludes self-references', () => {
    const a = createTestEntity({ id: 'a', name: 'Alfa', relationships: [{ targetEntityId: 'a', type: 'self' }] })
    const entities = { a }
    const incoming = computeIncomingRelationships(entities, 'a')
    expect(incoming).toHaveLength(0)
  })

  it('returns multiple incoming from different entities', () => {
    const a = createTestEntity({ id: 'a', name: 'Alfa', relationships: [{ targetEntityId: 'c', type: 'ally' }] })
    const b = createTestEntity({ id: 'b', name: 'Bravo', relationships: [{ targetEntityId: 'c', type: 'rival' }] })
    const c = createTestEntity({ id: 'c', name: 'Charlie' })
    const entities = { a, b, c }
    const incoming = computeIncomingRelationships(entities, 'c')
    expect(incoming).toHaveLength(2)
  })
})
