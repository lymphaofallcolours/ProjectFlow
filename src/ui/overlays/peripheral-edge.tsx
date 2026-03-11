import React from 'react'
import type { StoryNode } from '@/domain/types'
import type { EdgePosition, PeripheralAssignment } from '@/domain/peripheral-layout'
import { PeripheralFieldCard } from './peripheral-field-card'

type PeripheralEdgeProps = {
  edge: EdgePosition
  assignments: PeripheralAssignment[]
  node: StoryNode
  activeEdges: EdgePosition[]
}

const EDGE_STYLES: Record<EdgePosition, string> = {
  left: 'left-0 top-[theme(spacing.12)] bottom-[theme(spacing.8)] w-[300px] flex-col',
  right: 'right-0 top-[theme(spacing.12)] bottom-[theme(spacing.8)] w-[300px] flex-col',
  top: 'top-[theme(spacing.12)] max-h-[180px] flex-row',
  bottom: 'bottom-[theme(spacing.8)] max-h-[180px] flex-row',
}

export const PeripheralEdge = React.memo(function PeripheralEdge({
  edge,
  assignments,
  node,
  activeEdges,
}: PeripheralEdgeProps) {
  if (assignments.length === 0) return null

  const sorted = [...assignments].sort((a, b) => a.order - b.order)

  const hasLeft = activeEdges.includes('left')
  const hasRight = activeEdges.includes('right')

  // Top/bottom edges need to inset for side panels
  const horizontalInset =
    edge === 'top' || edge === 'bottom'
      ? `${hasLeft ? '312px' : '12px'}`
      : undefined
  const horizontalInsetRight =
    edge === 'top' || edge === 'bottom'
      ? `${hasRight ? '312px' : '12px'}`
      : undefined

  const isHorizontal = edge === 'top' || edge === 'bottom'

  return (
    <div
      className={`fixed flex gap-2.5 p-2.5 pointer-events-none peripheral-scrollbar ${EDGE_STYLES[edge]} ${
        isHorizontal ? 'overflow-x-auto' : 'overflow-y-auto'
      }`}
      style={{
        ...(horizontalInset ? { left: horizontalInset } : {}),
        ...(horizontalInsetRight ? { right: horizontalInsetRight } : {}),
      }}
    >
      {sorted.map((assignment) => (
        <div
          key={assignment.fieldKey}
          className={isHorizontal ? 'min-w-[260px] max-w-[320px] flex-shrink-0' : ''}
        >
          <PeripheralFieldCard
            node={node}
            fieldDef={assignment.fieldDef}
            index={assignment.order}
          />
        </div>
      ))}
    </div>
  )
})
