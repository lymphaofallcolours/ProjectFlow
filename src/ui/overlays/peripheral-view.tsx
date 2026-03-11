import { useMemo, useRef } from 'react'
import { useGraphStore } from '@/application/graph-store'
import { useUIStore } from '@/application/ui-store'
import { FIELD_DEFINITIONS } from '@/domain/types'
import { isFieldPopulated } from '@/domain/graph-operations'
import { computePeripheralLayout } from '@/domain/peripheral-layout'
import type { EdgePosition } from '@/domain/peripheral-layout'
import { PeripheralEdge } from './peripheral-edge'

export function PeripheralView() {
  const peripheralViewEnabled = useUIStore((s) => s.peripheralViewEnabled)
  const activeOverlay = useUIStore((s) => s.activeOverlay)
  const entitySidebarOpen = useUIStore((s) => s.entitySidebarOpen)
  const searchPanelOpen = useUIStore((s) => s.searchPanelOpen)

  const selectedNodeIds = useGraphStore((s) => s.selectedNodeIds)
  const nodes = useGraphStore((s) => s.nodes)

  // Single selected node
  const nodeId = selectedNodeIds.size === 1 ? Array.from(selectedNodeIds)[0] : null
  const node = nodeId ? nodes[nodeId] : null

  // Track node changes for clearing edit state
  const prevNodeIdRef = useRef<string | null>(null)
  if (nodeId !== prevNodeIdRef.current) {
    prevNodeIdRef.current = nodeId
    // Clear editing when node changes — safe in render since it's Zustand external state
    useUIStore.getState().setPeripheralEditingField(null)
  }

  // Determine suppressed edges
  const suppressedEdges = useMemo<EdgePosition[]>(() => {
    const suppressed: EdgePosition[] = []
    if (entitySidebarOpen || searchPanelOpen) suppressed.push('left')
    return suppressed
  }, [entitySidebarOpen, searchPanelOpen])

  // Compute layout
  const layout = useMemo(() => {
    if (!node) return []
    const populated = FIELD_DEFINITIONS.filter((fd) =>
      isFieldPopulated(node.fields, fd.key),
    )
    return computePeripheralLayout(populated, suppressedEdges)
  }, [node, suppressedEdges])

  // Don't render when disabled, no node selected, or overlay is active
  const shouldShow = peripheralViewEnabled && node && !activeOverlay && layout.length > 0
  if (!shouldShow) return null

  // Group assignments by edge
  const byEdge = layout.reduce<Record<EdgePosition, typeof layout>>(
    (acc, a) => {
      acc[a.edge].push(a)
      return acc
    },
    { left: [], right: [], top: [], bottom: [] },
  )

  const activeEdges = (Object.keys(byEdge) as EdgePosition[]).filter(
    (e) => byEdge[e].length > 0,
  )

  return (
    <div
      key={nodeId}
      className="fixed inset-0 pointer-events-none z-30 animate-fade-in"
    >
      {activeEdges.map((edge) => (
        <PeripheralEdge
          key={edge}
          edge={edge}
          assignments={byEdge[edge]}
          node={node}
          activeEdges={activeEdges}
        />
      ))}
    </div>
  )
}
