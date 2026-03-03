import { memo } from 'react'
import {
  BaseEdge,
  getSmoothStepPath,
  EdgeLabelRenderer,
} from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'
import type { StoryEdge } from '@/domain/types'

export type StoryEdgeData = { storyEdge: StoryEdge }

const EDGE_STYLE_CONFIG = {
  default: { dashArray: undefined, color: 'var(--color-edge)', opacity: 1 },
  conditional: { dashArray: '8 4', color: 'var(--color-node-social)', opacity: 0.85 },
  secret: { dashArray: '3 3', color: 'var(--color-text-secondary)', opacity: 0.6 },
} as const

export const StoryEdgeComponent = memo(function StoryEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  selected,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 16,
  })

  const storyEdge = (data as StoryEdgeData | undefined)?.storyEdge
  const edgeStyle = storyEdge?.style ?? 'default'
  const config = EDGE_STYLE_CONFIG[edgeStyle]

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? 'var(--color-node-event)' : config.color,
          strokeWidth: selected ? 2 : 1.5,
          strokeDasharray: config.dashArray,
          opacity: config.opacity,
          transition: 'stroke 0.15s, stroke-width 0.15s',
        }}
        markerEnd="url(#arrow)"
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            className="glass-panel px-2 py-0.5 rounded-md text-[10px] text-text-secondary pointer-events-auto"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
})
