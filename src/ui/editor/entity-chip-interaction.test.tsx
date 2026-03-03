import { describe, it, expect, beforeEach } from 'vitest'
import { useEntityStore } from '@/application/entity-store'
import { useUIStore } from '@/application/ui-store'
import { extractEntityTypesFromNodeFields } from '@/domain/entity-tag-parser'
import { createTestNode, createPopulatedNodeFields } from '../../../tests/fixtures/factories'

describe('entity chip interaction', () => {
  beforeEach(() => {
    useEntityStore.getState().reset()
    // Reset UI store sidebar state
    if (useUIStore.getState().entitySidebarOpen) {
      useUIStore.getState().toggleEntitySidebar()
    }
    useUIStore.getState().selectEntity(null)
  })

  it('openEntitySidebar opens the sidebar without toggling', () => {
    useUIStore.getState().openEntitySidebar()
    expect(useUIStore.getState().entitySidebarOpen).toBe(true)
    // Call again — should stay open
    useUIStore.getState().openEntitySidebar()
    expect(useUIStore.getState().entitySidebarOpen).toBe(true)
  })

  it('selectEntity sets the selected entity id', () => {
    const id = useEntityStore.getState().addEntity('pc', 'Alfa')
    useUIStore.getState().selectEntity(id)
    expect(useUIStore.getState().selectedEntityId).toBe(id)
  })

  it('chip click flow: open sidebar and select entity', () => {
    const id = useEntityStore.getState().addEntity('pc', 'Alfa')
    // Simulate what chip onClick does
    useUIStore.getState().openEntitySidebar()
    useUIStore.getState().selectEntity(id)
    expect(useUIStore.getState().entitySidebarOpen).toBe(true)
    expect(useUIStore.getState().selectedEntityId).toBe(id)
  })
})

describe('EntityTypeSummary via extractEntityTypesFromNodeFields', () => {
  it('returns empty set for node with no entity tags', () => {
    const node = createTestNode()
    expect(extractEntityTypesFromNodeFields(node).size).toBe(0)
  })

  it('returns correct types for node with mixed entity tags', () => {
    const node = createTestNode({
      fields: createPopulatedNodeFields({
        script: { markdown: '@Alfa enters ~@Hive Primus' },
        gmNotes: { markdown: '%@Carnifex lurks' },
      }),
    })
    const types = extractEntityTypesFromNodeFields(node)
    expect(types.has('pc')).toBe(true)
    expect(types.has('location')).toBe(true)
    expect(types.has('enemy')).toBe(true)
    expect(types.size).toBe(3)
  })

  it('caps at unique types across all fields', () => {
    const node = createTestNode({
      fields: createPopulatedNodeFields({
        script: { markdown: '@Alfa @Bravo' },
        characters: { markdown: '@Charlie' },
      }),
    })
    const types = extractEntityTypesFromNodeFields(node)
    // All PC type — should only appear once
    expect(types.size).toBe(1)
    expect(types.has('pc')).toBe(true)
  })
})
