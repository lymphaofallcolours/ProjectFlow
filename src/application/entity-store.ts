import { create } from 'zustand'
import type { Entity, EntityType, EntityRegistry } from '@/domain/entity-types'
import {
  createEntity,
  updateEntity as updateEntityOp,
  addStatusEntry as addStatusEntryOp,
} from '@/domain/entity-operations'

type EntityState = {
  entities: Record<string, Entity>

  getEntity: (id: string) => Entity | undefined
  getByName: (name: string, type?: EntityType) => Entity | undefined
  getByType: (type: EntityType) => Entity[]
  getAllEntities: () => Entity[]

  addEntity: (type: EntityType, name: string, description?: string) => string
  updateEntity: (id: string, updates: Partial<Pick<Entity, 'name' | 'description' | 'affiliations' | 'relationships'>>) => void
  removeEntity: (id: string) => void
  addStatus: (entityId: string, nodeId: string, status: string, note?: string) => void

  loadRegistry: (registry: EntityRegistry) => void
  reset: () => void
}

const initialState = {
  entities: {} as Record<string, Entity>,
}

export const useEntityStore = create<EntityState>((set, get) => ({
  ...initialState,

  getEntity: (id) => get().entities[id],

  getByName: (name, type?) => {
    const lowerName = name.toLowerCase()
    return Object.values(get().entities).find(
      (e) =>
        e.name.toLowerCase() === lowerName &&
        (type === undefined || e.type === type),
    )
  },

  getByType: (type) =>
    Object.values(get().entities).filter((e) => e.type === type),

  getAllEntities: () => Object.values(get().entities),

  addEntity: (type, name, description?) => {
    const entity = createEntity(type, name, description)
    set((state) => ({ entities: { ...state.entities, [entity.id]: entity } }))
    return entity.id
  },

  updateEntity: (id, updates) => {
    set((state) => {
      const entity = state.entities[id]
      if (!entity) return state
      return { entities: { ...state.entities, [id]: updateEntityOp(entity, updates) } }
    })
  },

  removeEntity: (id) => {
    set((state) => {
      const remaining = Object.fromEntries(
        Object.entries(state.entities).filter(([eid]) => eid !== id),
      )
      return { entities: remaining }
    })
  },

  addStatus: (entityId, nodeId, status, note?) => {
    set((state) => {
      const entity = state.entities[entityId]
      if (!entity) return state
      return {
        entities: {
          ...state.entities,
          [entityId]: addStatusEntryOp(entity, nodeId, status, note),
        },
      }
    })
  },

  loadRegistry: (registry) => set({ entities: { ...registry.entities } }),
  reset: () => set(initialState),
}))
