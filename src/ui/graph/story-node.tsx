import { memo, useCallback, useContext, useMemo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps, Node } from '@xyflow/react'
import type { StoryNode } from '@/domain/types'
import { SCENE_TYPE_CONFIG } from '@/domain/types'
import { getShapePath, NODE_DIMENSIONS } from './node-shapes'
import { useGraphStore } from '@/application/graph-store'
import { useUIStore } from '@/application/ui-store'
import { useSessionStore } from '@/application/session-store'
import { useLongPress } from '@/ui/hooks/use-long-press'
import { buildDiffMap, PLAYTHROUGH_STATUS_CONFIG } from '@/domain/playthrough-operations'
import { HighlightContext } from './highlight-context'

export type StoryNodeData = {
  storyNode: StoryNode
}

export type StoryFlowNode = Node<StoryNodeData, 'story'>

export const StoryNodeComponent = memo(function StoryNodeComponent({
  data,
  selected,
}: NodeProps<StoryFlowNode>) {
  const scrollDirection = useGraphStore((s) => s.scrollDirection)
  const showRadialSubnodes = useUIStore((s) => s.showRadialSubnodes)
  const entityHighlightFilter = useUIStore((s) => s.entityHighlightFilter)
  const diffOverlayActive = useSessionStore((s) => s.diffOverlayActive)
  const activeSessionId = useSessionStore((s) => s.activeSessionId)
  const playthroughLog = useSessionStore((s) => s.playthroughLog)
  const { storyNode } = data

  // Entity highlight: read from canvas-level context (O(1) per node)
  const highlightSet = useContext(HighlightContext)
  const isHighlighted = useMemo(() => {
    if (!entityHighlightFilter) return null // null = no filter active
    if (!highlightSet) return null
    return highlightSet.has(storyNode.id)
  }, [entityHighlightFilter, highlightSet, storyNode.id])

  // Diff overlay: compute status for this node from selected session
  const diffStatus = useMemo(() => {
    if (!diffOverlayActive || !activeSessionId) return null
    const session = playthroughLog.find((e) => e.id === activeSessionId)
    if (!session) return null
    const map = buildDiffMap(session)
    return map[storyNode.id] ?? 'unvisited'
  }, [diffOverlayActive, activeSessionId, playthroughLog, storyNode.id])

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
  const entityDimmed = isHighlighted === false
  // Dim if diff overlay is active and this node is unvisited
  const diffDimmed = diffStatus === 'unvisited'
  const dimmed = entityDimmed || diffDimmed

  // Diff overlay ring color
  const diffRingColor = diffStatus && diffStatus !== 'unvisited'
    ? `var(--color-${PLAYTHROUGH_STATUS_CONFIG[diffStatus].color})`
    : null

  // Status dot: always show if node has a playthrough status
  const statusDotColor = storyNode.playthroughStatus && storyNode.playthroughStatus !== 'unvisited'
    ? `var(--color-${PLAYTHROUGH_STATUS_CONFIG[storyNode.playthroughStatus].color})`
    : null

  // Shared gradient/filter IDs (defined once at canvas level)
  const glassGradientId = `glass-${storyNode.sceneType}`

  return (
    <div
      className="relative group transition-opacity duration-200"
      style={{
        width: dim.width,
        height: dim.height,
        opacity: dimmed ? 0.3 : 1,
      }}
      {...longPressHandlers}
    >
      {/* SVG shape with glass effect — uses shared defs */}
      <svg
        width={dim.width}
        height={dim.height}
        viewBox={`0 0 ${dim.width} ${dim.height}`}
        className="absolute inset-0"
      >
        {/* Diff overlay ring — shown behind glass fill when diff is active */}
        {diffRingColor && (
          <path
            d={shapePath}
            fill="none"
            stroke={diffRingColor}
            strokeWidth="3.5"
            opacity="0.7"
            filter="url(#node-glow)"
          />
        )}

        {/* Outer glow on selection */}
        {selected && !diffRingColor && (
          <path
            d={shapePath}
            fill="none"
            stroke={accentColor}
            strokeWidth="3"
            opacity="0.4"
            filter="url(#node-glow)"
          />
        )}

        {/* Glass fill */}
        <path
          d={shapePath}
          fill={`url(#${glassGradientId})`}
          stroke={diffRingColor ?? (selected ? accentColor : 'var(--color-surface-glass-border)')}
          strokeWidth={diffRingColor ? 2 : selected ? 2 : 1}
          className="transition-all duration-150"
        />

        {/* Top highlight — glass reflection */}
        <path
          d={shapePath}
          fill="url(#highlight-sheen)"
          opacity="0.12"
        />
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

      {/* Status dot — bottom right, always visible when status is set */}
      {statusDotColor && (
        <div
          className="absolute -bottom-0.5 -right-0.5 w-[7px] h-[7px] rounded-full border border-surface-glass"
          style={{ backgroundColor: statusDotColor }}
          title={storyNode.playthroughStatus
            ? PLAYTHROUGH_STATUS_CONFIG[storyNode.playthroughStatus].label
            : undefined}
        />
      )}

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
