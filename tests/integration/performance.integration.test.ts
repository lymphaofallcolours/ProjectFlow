import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useGraphStore } from '@/application/graph-store'
import { useUIStore } from '@/application/ui-store'
import { useEntityHighlight } from '@/ui/hooks/use-entity-highlight'

beforeEach(() => {
  useGraphStore.getState().reset()
  useUIStore.setState({ entityHighlightFilter: null })
})

describe('Performance (integration)', () => {
  describe('entity highlight computation', () => {
    it('correctly identifies matching nodes from highlight set', () => {
      const id1 = useGraphStore.getState().addNode('event', { x: 0, y: 0 }, 'A')
      const id2 = useGraphStore.getState().addNode('combat', { x: 100, y: 0 }, 'B')
      const id3 = useGraphStore.getState().addNode('social', { x: 200, y: 0 }, 'C')

      useGraphStore.getState().updateField(id1, 'script', { markdown: '@Alfa attacks' })
      useGraphStore.getState().updateField(id3, 'gmNotes', { markdown: '#Alfa is mentioned' })

      useUIStore.setState({ entityHighlightFilter: { entityName: 'Alfa' } })

      const { result } = renderHook(() => useEntityHighlight())
      expect(result.current).toBeInstanceOf(Set)
      expect(result.current!.has(id1)).toBe(true)
      expect(result.current!.has(id2)).toBe(false)
      expect(result.current!.has(id3)).toBe(true)
    })

    it('returns null when no filter active', () => {
      useGraphStore.getState().addNode('event', { x: 0, y: 0 }, 'Node')
      useUIStore.setState({ entityHighlightFilter: null })

      const { result } = renderHook(() => useEntityHighlight())
      expect(result.current).toBeNull()
    })

    it('handles large node count efficiently', () => {
      // Create 50 nodes, some with entity tags
      for (let i = 0; i < 50; i++) {
        const id = useGraphStore.getState().addNode('event', { x: i * 50, y: 0 }, `Node ${i}`)
        if (i % 5 === 0) {
          useGraphStore.getState().updateField(id, 'script', { markdown: `Scene with @Hero present` })
        }
      }

      useUIStore.setState({ entityHighlightFilter: { entityName: 'Hero' } })

      const start = performance.now()
      const { result } = renderHook(() => useEntityHighlight())
      const elapsed = performance.now() - start

      // Should complete in under 100ms even with 50 nodes
      expect(elapsed).toBeLessThan(100)
      expect(result.current!.size).toBe(10) // every 5th node (0,5,10,...,45)
    })

    it('returns empty set when filter has no matches in large graph', () => {
      for (let i = 0; i < 30; i++) {
        useGraphStore.getState().addNode('narration', { x: i * 50, y: 0 }, `Node ${i}`)
      }

      useUIStore.setState({ entityHighlightFilter: { entityName: 'NonExistent' } })
      const { result } = renderHook(() => useEntityHighlight())
      expect(result.current!.size).toBe(0)
    })

    it('handles entity in multiple fields of same node', () => {
      const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 }, 'Multi')
      useGraphStore.getState().updateField(id, 'script', { markdown: '@Alfa attacks' })
      useGraphStore.getState().updateField(id, 'gmNotes', { markdown: '@Alfa retreats' })
      useGraphStore.getState().updateField(id, 'characters', { markdown: '@Alfa, !@Voss' })

      useUIStore.setState({ entityHighlightFilter: { entityName: 'Alfa' } })
      const { result } = renderHook(() => useEntityHighlight())
      // Should deduplicate — one node, not three
      expect(result.current!.size).toBe(1)
      expect(result.current!.has(id)).toBe(true)
    })
  })
})
