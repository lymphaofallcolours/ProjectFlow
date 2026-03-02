import { memo, useCallback, useMemo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps, Node } from '@xyflow/react'
import type { StoryNode } from '@/domain/types'
import { SCENE_TYPE_CONFIG } from '@/domain/types'
import { getShapePath, NODE_DIMENSIONS } from './node-shapes'
import { useGraphStore } from '@/application/graph-store'
import { useUIStore } from '@/application/ui-store'
import { useLongPress } from '@/ui/hooks/use-long-press'
import { searchNodesByEntity } from '@/domain/search'

export type StoryNodeData = {
  storyNode: StoryNode
}

export type StoryFlowNode = Node<StoryNodeData, 'story'>

export const StoryNodeComponent = memo(function StoryNodeComponent({
  data,
  selected,
}: NodeProps<StoryFlowNode>) {
  const scrollDirection = useGraphStore((s) => s.scrollDirection)
  const nodes = useGraphStore((s) => s.nodes)
  const showRadialSubnodes = useUIStore((s) => s.showRadialSubnodes)
  const entityHighlightFilter = useUIStore((s) => s.entityHighlightFilter)
  const { storyNode } = data

  // Entity highlight: check if this node matches the filter
  const isHighlighted = useMemo(() => {
    if (!entityHighlightFilter) return null // null = no filter active
    const results = searchNodesByEntity(
      { [storyNode.id]: nodes[storyNode.id] ?? storyNode },
      entityHighlightFilter.entityName,
    )
    return results.length > 0
  }, [entityHighlightFilter, storyNode, nodes])

  const handleLongPress = useCallback(() => {
    showRadialSubnodes(storyNode.id)
  }, [showRadialSubnodes, storyNode.id])

  const longPressHandlers = useLongPress(handleLongPress)

  const config = SCENE_TYPE_CONFIG[storyNode.sceneType]
  const dim = NODE_DIMENSIONS[config.shape]
  const shapePath = getShapePath(config.shape)
  const accentColor = `var(--color-${config.color})`

  const targetPos = scrollDirection === 'horizontal' ? Position.Left : Position.Top
  const sourcePos = scrollDirection === 'horizontal' ? Position.Right : Position.Bottom

  // Dim if entity filter is active and this node doesn't match
  const dimmed = isHighlighted === false

  return (
    <div
      className="relative group transition-opacity duration-200"
      style={{
        width: dim.width,
        height: dim.height,
        opacity: dimmed ? 0.25 : 1,
      }}
      {...longPressHandlers}
    >
      {/* SVG shape with glass effect */}
      <svg
        width={dim.width}
        height={dim.height}
        viewBox={`0 0 ${dim.width} ${dim.height}`}
        className="absolute inset-0"
      >
        <defs>
          <GlassGradient id={`glass-${storyNode.id}`} accentColor={accentColor} />
          <filter id={`glow-${storyNode.id}`}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer glow on selection */}
        {selected && (
          <path
            d={shapePath}
            fill="none"
            stroke={accentColor}
            strokeWidth="3"
            opacity="0.4"
            filter={`url(#glow-${storyNode.id})`}
          />
        )}

        {/* Glass fill */}
        <path
          d={shapePath}
          fill={`url(#glass-${storyNode.id})`}
          stroke={selected ? accentColor : 'var(--color-surface-glass-border)'}
          strokeWidth={selected ? 2 : 1}
          className="transition-all duration-150"
        />

        {/* Top highlight — glass reflection */}
        <path
          d={shapePath}
          fill="url(#highlight-sheen)"
          opacity="0.12"
        />

        <defs>
          <linearGradient id="highlight-sheen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="50%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Label + arc label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-3">
        {storyNode.arcLabel && (
          <span
            className="text-[9px] font-medium tracking-widest uppercase mb-0.5 opacity-60"
            style={{ color: accentColor }}
          >
            {storyNode.arcLabel}
          </span>
        )}
        <span
          className="text-xs font-semibold text-text-primary text-center leading-tight line-clamp-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {storyNode.label}
        </span>
        <span
          className="text-[9px] mt-0.5 opacity-50 text-text-secondary"
        >
          {config.label}
        </span>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={targetPos}
        className="!w-2.5 !h-2.5 !rounded-full !border-2 !bg-surface-glass"
        style={{ borderColor: accentColor }}
      />
      <Handle
        type="source"
        position={sourcePos}
        className="!w-2.5 !h-2.5 !rounded-full !border-2 !bg-surface-glass"
        style={{ borderColor: accentColor }}
      />
    </div>
  )
})

/** Generates a subtle glass gradient tinted by the scene type accent color */
function GlassGradient({ id, accentColor }: { id: string; accentColor: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stopColor="var(--color-surface-glass)" />
      <stop offset="100%" stopColor={accentColor} stopOpacity="0.08" />
    </linearGradient>
  )
}
