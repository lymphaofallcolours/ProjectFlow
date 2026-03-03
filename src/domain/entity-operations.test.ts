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
} from './entity-operations'
import { createTestEntity, createTestEntityRegistry } from '../../tests/fixtures/factories'

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
