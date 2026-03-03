import { describe, it, expect, beforeEach } from 'vitest'
import { useGraphStore } from '@/application/graph-store'
import { useUIStore } from '@/application/ui-store'
import { useEntityHighlight } from './use-entity-highlight'
import { renderHook } from '@testing-library/react'

beforeEach(() => {
  useGraphStore.getState().reset()
  useUIStore.setState({ entityHighlightFilter: null })
})

describe('useEntityHighlight', () => {
  it('returns null when no filter is active', () => {
    const { result } = renderHook(() => useEntityHighlight())
    expect(result.current).toBeNull()
  })

  it('returns empty set when filter is active but no nodes match', () => {
    useGraphStore.getState().addNode('event', { x: 0, y: 0 }, 'Empty Node')
    useUIStore.setState({ entityHighlightFilter: { entityName: 'NonExistent' } })
    const { result } = renderHook(() => useEntityHighlight())
    expect(result.current).toBeInstanceOf(Set)
    expect(result.current!.size).toBe(0)
  })

  it('returns matching node IDs when filter matches', () => {
    const id1 = useGraphStore.getState().addNode('event', { x: 0, y: 0 }, 'Scene A')
    const id2 = useGraphStore.getState().addNode('combat', { x: 100, y: 0 }, 'Scene B')
    useGraphStore.getState().updateField(id1, 'script', { markdown: 'Text with @Alfa here' })
    useGraphStore.getState().updateField(id2, 'script', { markdown: 'No entities here' })

    useUIStore.setState({ entityHighlightFilter: { entityName: 'Alfa' } })
    const { result } = renderHook(() => useEntityHighlight())
    expect(result.current).toBeInstanceOf(Set)
    expect(result.current!.has(id1)).toBe(true)
    expect(result.current!.has(id2)).toBe(false)
  })

  it('finds entities across multiple nodes', () => {
    const id1 = useGraphStore.getState().addNode('event', { x: 0, y: 0 }, 'A')
    const id2 = useGraphStore.getState().addNode('social', { x: 100, y: 0 }, 'B')
    useGraphStore.getState().updateField(id1, 'characters', { markdown: '@Voss leads the team' })
    useGraphStore.getState().updateField(id2, 'gmNotes', { markdown: 'Mention !@Voss here' })

    useUIStore.setState({ entityHighlightFilter: { entityName: 'Voss' } })
    const { result } = renderHook(() => useEntityHighlight())
    expect(result.current!.size).toBe(2)
    expect(result.current!.has(id1)).toBe(true)
    expect(result.current!.has(id2)).toBe(true)
  })

  it('deduplicates node IDs from multiple field matches', () => {
    const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 }, 'Multi')
    useGraphStore.getState().updateField(id, 'script', { markdown: '@Alfa enters' })
    useGraphStore.getState().updateField(id, 'gmNotes', { markdown: '@Alfa exits' })

    useUIStore.setState({ entityHighlightFilter: { entityName: 'Alfa' } })
    const { result } = renderHook(() => useEntityHighlight())
    expect(result.current!.size).toBe(1)
    expect(result.current!.has(id)).toBe(true)
  })
})
