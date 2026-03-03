import { useMemo } from 'react'
import { useUIStore } from '@/application/ui-store'
import { useGraphStore } from '@/application/graph-store'
import { searchNodesByEntity } from '@/domain/search'

/**
 * Computes the set of node IDs matching the entity highlight filter once,
 * at canvas level. Returns null when no filter is active.
 */
export function useEntityHighlight(): Set<string> | null {
  const entityHighlightFilter = useUIStore((s) => s.entityHighlightFilter)
  const nodes = useGraphStore((s) => s.nodes)

  return useMemo(() => {
    if (!entityHighlightFilter) return null
    const results = searchNodesByEntity(
      nodes,
      entityHighlightFilter.entityName,
      entityHighlightFilter.entityType as import('@/domain/entity-types').EntityType | undefined,
    )
    return new Set(results.map((r) => r.nodeId))
  }, [entityHighlightFilter, nodes])
}
