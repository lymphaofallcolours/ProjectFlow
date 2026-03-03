import { describe, it, expect, beforeEach } from 'vitest'
import { useEntityStore } from './entity-store'
import { createTestEntity, createTestEntityRegistry, createTestAttachment } from '../../tests/fixtures/factories'

describe('useEntityStore', () => {
  beforeEach(() => {
    useEntityStore.getState().reset()
  })

  describe('addEntity', () => {
    it('adds an entity and returns its id', () => {
      const id = useEntityStore.getState().addEntity('pc', 'Alfa')
      expect(id).toBeTruthy()
      const entity = useEntityStore.getState().entities[id]
      expect(entity.name).toBe('Alfa')
      expect(entity.type).toBe('pc')
    })

    it('adds an entity with description', () => {
      const id = useEntityStore.getState().addEntity('npc', 'Voss', 'A stern sergeant')
      const entity = useEntityStore.getState().entities[id]
      expect(entity.description).toBe('A stern sergeant')
    })

    it('adds multiple entities', () => {
      useEntityStore.getState().addEntity('pc', 'Alfa')
      useEntityStore.getState().addEntity('pc', 'Bravo')
      expect(useEntityStore.getState().getAllEntities()).toHaveLength(2)
    })
  })

  describe('getEntity', () => {
    it('retrieves an entity by id', () => {
      const id = useEntityStore.getState().addEntity('pc', 'Alfa')
      const entity = useEntityStore.getState().getEntity(id)
      expect(entity?.name).toBe('Alfa')
    })

    it('returns undefined for unknown id', () => {
      expect(useEntityStore.getState().getEntity('nonexistent')).toBeUndefined()
    })
  })

  describe('getByName', () => {
    it('finds entity by name (case-insensitive)', () => {
      useEntityStore.getState().addEntity('pc', 'Alfa')
      const found = useEntityStore.getState().getByName('alfa')
      expect(found?.name).toBe('Alfa')
    })

    it('filters by type', () => {
      useEntityStore.getState().addEntity('pc', 'Alfa')
      useEntityStore.getState().addEntity('npc', 'Alfa')
      const pc = useEntityStore.getState().getByName('Alfa', 'pc')
      expect(pc?.type).toBe('pc')
    })

    it('returns undefined when not found', () => {
      expect(useEntityStore.getState().getByName('Nobody')).toBeUndefined()
    })
  })

  describe('getByType', () => {
    it('returns entities of specified type', () => {
      useEntityStore.getState().addEntity('pc', 'Alfa')
      useEntityStore.getState().addEntity('pc', 'Bravo')
      useEntityStore.getState().addEntity('npc', 'Voss')
      const pcs = useEntityStore.getState().getByType('pc')
      expect(pcs).toHaveLength(2)
    })

    it('returns empty array for type with no entities', () => {
      expect(useEntityStore.getState().getByType('enemy')).toEqual([])
    })
  })

  describe('getAllEntities', () => {
    it('returns all entities', () => {
      useEntityStore.getState().addEntity('pc', 'Alfa')
      useEntityStore.getState().addEntity('npc', 'Voss')
      expect(useEntityStore.getState().getAllEntities()).toHaveLength(2)
    })

    it('returns empty array when no entities', () => {
      expect(useEntityStore.getState().getAllEntities()).toEqual([])
    })
  })

  describe('updateEntity', () => {
    it('updates entity name', () => {
      const id = useEntityStore.getState().addEntity('pc', 'Old Name')
      useEntityStore.getState().updateEntity(id, { name: 'New Name' })
      expect(useEntityStore.getState().entities[id].name).toBe('New Name')
    })

    it('updates entity description', () => {
      const id = useEntityStore.getState().addEntity('pc', 'Alfa')
      useEntityStore.getState().updateEntity(id, { description: 'Updated desc' })
      expect(useEntityStore.getState().entities[id].description).toBe('Updated desc')
    })

    it('does nothing for unknown id', () => {
      useEntityStore.getState().updateEntity('nonexistent', { name: 'Test' })
      expect(useEntityStore.getState().getAllEntities()).toHaveLength(0)
    })
  })

  describe('removeEntity', () => {
    it('removes an entity', () => {
      const id = useEntityStore.getState().addEntity('pc', 'Alfa')
      useEntityStore.getState().removeEntity(id)
      expect(useEntityStore.getState().entities[id]).toBeUndefined()
    })

    it('preserves other entities', () => {
      const id1 = useEntityStore.getState().addEntity('pc', 'Alfa')
      const id2 = useEntityStore.getState().addEntity('pc', 'Bravo')
      useEntityStore.getState().removeEntity(id1)
      expect(useEntityStore.getState().entities[id2]).toBeDefined()
    })
  })

  describe('addStatus', () => {
    it('adds a status entry to an entity', () => {
      const id = useEntityStore.getState().addEntity('pc', 'Alfa')
      useEntityStore.getState().addStatus(id, 'node-1', 'wounded')
      const entity = useEntityStore.getState().entities[id]
      expect(entity.statusHistory).toHaveLength(1)
      expect(entity.statusHistory[0].status).toBe('wounded')
      expect(entity.statusHistory[0].nodeId).toBe('node-1')
    })

    it('adds status with note', () => {
      const id = useEntityStore.getState().addEntity('pc', 'Alfa')
      useEntityStore.getState().addStatus(id, 'node-1', 'wounded', 'Hit by Target')
      expect(useEntityStore.getState().entities[id].statusHistory[0].note).toBe('Hit by Target')
    })

    it('does nothing for unknown entity', () => {
      useEntityStore.getState().addStatus('nonexistent', 'node-1', 'wounded')
      expect(useEntityStore.getState().getAllEntities()).toHaveLength(0)
    })
  })

  describe('loadRegistry', () => {
    it('loads entities from a registry', () => {
      const e1 = createTestEntity({ id: 'e1', name: 'Alfa' })
      const e2 = createTestEntity({ id: 'e2', name: 'Bravo' })
      const registry = createTestEntityRegistry([e1, e2])
      useEntityStore.getState().loadRegistry(registry)
      expect(useEntityStore.getState().getAllEntities()).toHaveLength(2)
      expect(useEntityStore.getState().entities['e1'].name).toBe('Alfa')
    })

    it('replaces existing entities on load', () => {
      useEntityStore.getState().addEntity('pc', 'Old')
      const newEntity = createTestEntity({ id: 'new', name: 'New' })
      useEntityStore.getState().loadRegistry(createTestEntityRegistry([newEntity]))
      expect(useEntityStore.getState().getAllEntities()).toHaveLength(1)
      expect(useEntityStore.getState().getAllEntities()[0].name).toBe('New')
    })
  })

  describe('reset', () => {
    it('clears all entities', () => {
      useEntityStore.getState().addEntity('pc', 'Alfa')
      useEntityStore.getState().addEntity('npc', 'Voss')
      useEntityStore.getState().reset()
      expect(useEntityStore.getState().getAllEntities()).toHaveLength(0)
    })
  })

  describe('setPortrait', () => {
    it('sets a portrait on an entity', () => {
      const id = useEntityStore.getState().addEntity('pc', 'Alfa')
      const portrait = createTestAttachment({ filename: 'portrait.png' })
      useEntityStore.getState().setPortrait(id, portrait)
      expect(useEntityStore.getState().entities[id].portrait?.filename).toBe('portrait.png')
    })

    it('removes portrait when set to null', () => {
      const id = useEntityStore.getState().addEntity('pc', 'Alfa')
      const portrait = createTestAttachment()
      useEntityStore.getState().setPortrait(id, portrait)
      useEntityStore.getState().setPortrait(id, null)
      expect(useEntityStore.getState().entities[id].portrait).toBeUndefined()
    })

    it('does nothing for unknown entity', () => {
      useEntityStore.getState().setPortrait('nonexistent', createTestAttachment())
      expect(useEntityStore.getState().getAllEntities()).toHaveLength(0)
    })
  })

  describe('addRelationship', () => {
    it('adds a relationship to an entity', () => {
      const id = useEntityStore.getState().addEntity('pc', 'Alfa')
      useEntityStore.getState().addRelationship(id, {
        targetEntityId: 'target-1',
        type: 'ally',
      })
      const entity = useEntityStore.getState().entities[id]
      expect(entity.relationships).toHaveLength(1)
      expect(entity.relationships![0].type).toBe('ally')
    })

    it('does nothing for unknown entity', () => {
      useEntityStore.getState().addRelationship('nonexistent', {
        targetEntityId: 'target-1',
        type: 'ally',
      })
      expect(useEntityStore.getState().getAllEntities()).toHaveLength(0)
    })
  })

  describe('removeRelationship', () => {
    it('removes a relationship from an entity', () => {
      const id = useEntityStore.getState().addEntity('pc', 'Alfa')
      useEntityStore.getState().addRelationship(id, {
        targetEntityId: 'target-1',
        type: 'ally',
      })
      useEntityStore.getState().removeRelationship(id, 'target-1')
      expect(useEntityStore.getState().entities[id].relationships).toHaveLength(0)
    })

    it('does nothing for unknown entity', () => {
      useEntityStore.getState().removeRelationship('nonexistent', 'target-1')
      expect(useEntityStore.getState().getAllEntities()).toHaveLength(0)
    })
  })

  describe('updateEntity with expanded whitelist', () => {
    it('updates portrait via updateEntity', () => {
      const id = useEntityStore.getState().addEntity('pc', 'Alfa')
      const portrait = createTestAttachment({ filename: 'avatar.png' })
      useEntityStore.getState().updateEntity(id, { portrait })
      expect(useEntityStore.getState().entities[id].portrait?.filename).toBe('avatar.png')
    })

    it('updates custom fields via updateEntity', () => {
      const id = useEntityStore.getState().addEntity('pc', 'Alfa')
      useEntityStore.getState().updateEntity(id, { custom: { Weapon: 'Weapon' } })
      expect(useEntityStore.getState().entities[id].custom['Weapon']).toBe('Weapon')
    })

    it('updates relationships via updateEntity', () => {
      const id = useEntityStore.getState().addEntity('pc', 'Alfa')
      useEntityStore.getState().updateEntity(id, {
        relationships: [{ targetEntityId: 'target-1', type: 'ally' }],
      })
      expect(useEntityStore.getState().entities[id].relationships).toHaveLength(1)
    })
  })
})
