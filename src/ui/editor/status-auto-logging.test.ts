import { describe, it, expect, beforeEach } from 'vitest'
import { useEntityStore } from '@/application/entity-store'
import { extractStatusTagsFromText } from '@/domain/entity-tag-parser'

describe('status auto-logging', () => {
  beforeEach(() => {
    useEntityStore.getState().reset()
  })

  it('extractStatusTagsFromText finds new status markers', () => {
    const oldText = '@Alfa enters the room'
    const newText = '@Alfa+wounded enters the room'
    const oldTags = extractStatusTagsFromText(oldText)
    const newTags = extractStatusTagsFromText(newText)
    expect(oldTags).toHaveLength(0)
    expect(newTags).toHaveLength(1)
    expect(newTags[0].status).toBe('wounded')
  })

  it('simulates full auto-logging flow', () => {
    const entityId = useEntityStore.getState().addEntity('pc', 'Alfa')
    const oldText = '@Alfa enters'
    const newText = '@Alfa+wounded enters'

    // Diff: find new status tags
    const oldTags = extractStatusTagsFromText(oldText)
    const newTags = extractStatusTagsFromText(newText)
    const oldSet = new Set(oldTags.map((t) => `${t.name}:${t.status}`))

    for (const tag of newTags) {
      const key = `${tag.name}:${tag.status}`
      if (!oldSet.has(key)) {
        const entity = useEntityStore.getState().getByName(tag.name, tag.entityType)
        if (entity) {
          useEntityStore.getState().addStatus(entity.id, 'test-node', tag.status)
        }
      }
    }

    const entity = useEntityStore.getState().entities[entityId]
    expect(entity.statusHistory).toHaveLength(1)
    expect(entity.statusHistory[0].status).toBe('wounded')
    expect(entity.statusHistory[0].nodeId).toBe('test-node')
  })

  it('does not duplicate existing status markers', () => {
    useEntityStore.getState().addEntity('pc', 'Alfa')
    const text = '@Alfa+wounded enters'

    // Both old and new have the same tag — no new status
    const oldTags = extractStatusTagsFromText(text)
    const newTags = extractStatusTagsFromText(text)
    const oldSet = new Set(oldTags.map((t) => `${t.name}:${t.status}`))
    const newMarkers = newTags.filter((t) => !oldSet.has(`${t.name}:${t.status}`))

    expect(newMarkers).toHaveLength(0)
  })

  it('detects multiple new status tags', () => {
    useEntityStore.getState().addEntity('pc', 'Alfa')
    useEntityStore.getState().addEntity('npc', 'Voss')
    const oldText = '@Alfa and !@Voss'
    const newText = '@Alfa+wounded and !@Voss+dead'

    const oldTags = extractStatusTagsFromText(oldText)
    const newTags = extractStatusTagsFromText(newText)
    const oldSet = new Set(oldTags.map((t) => `${t.name}:${t.status}`))
    const newMarkers = newTags.filter((t) => !oldSet.has(`${t.name}:${t.status}`))

    expect(newMarkers).toHaveLength(2)
    expect(newMarkers[0].name).toBe('Alfa')
    expect(newMarkers[1].name).toBe('Voss')
  })
})
