import { memo, useCallback, useContext, useMemo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps, Node } from '@xyflow/react'
import { Shield, User, Skull, Package, MapPin, EyeOff } from 'lucide-react'
import type { StoryNode } from '@/domain/types'
import { SCENE_TYPE_CONFIG } from '@/domain/types'
import type { EntityType } from '@/domain/entity-types'
import { ENTITY_TYPE_CONFIGS } from '@/domain/entity-types'
import { getShapePath, NODE_DIMENSIONS } from './node-shapes'
import { useGraphStore } from '@/application/graph-store'
import { useUIStore } from '@/application/ui-store'
import { useSessionStore } from '@/application/session-store'
import { useLongPress } from '@/ui/hooks/use-long-press'
import { buildDiffMap, PLAYTHROUGH_STATUS_CONFIG } from '@/domain/playthrough-operations'
import { HighlightContext } from './highlight-context'
import { getGroupChildIds } from '@/domain/group-operations'
import { extractEntityTypesFromNodeFields } from '@/domain/entity-tag-parser'

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
  const toggleGroupCollapsed = useGraphStore((s) => s.toggleGroupCollapsed)
  const allNodes = useGraphStore((s) => s.nodes)
  const { storyNode } = data

  // Group child count (only computed for group nodes)
  const childCount = useMemo(() => {
    if (!storyNode.isGroup) return 0
    return getGroupChildIds(allNodes, storyNode.id).length
  }, [storyNode.isGroup, storyNode.id, allNodes])

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

  const handleCollapseToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      toggleGroupCollapsed(storyNode.id)
    },
    [toggleGroupCollapsed, storyNode.id],
  )

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
      {/* Stacked shadow layers — visible when group is collapsed */}
      {storyNode.isGroup && storyNode.collapsed && (
        <GroupStackedShadow dim={dim} shapePath={shapePath} />
      )}

      {/* SVG shape with glass effect — uses shared defs */}
      <svg
        width={dim.width}
        height={dim.height}
        viewBox={`0 0 ${dim.width} ${dim.height}`}
        className="absolute inset-0"
      >
        {/* Group dashed border ring */}
        {storyNode.isGroup && (
          <path
            d={shapePath}
            fill="none"
            stroke={accentColor}
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.5"
          />
        )}

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
          {storyNode.isGroup ? `${childCount} node${childCount !== 1 ? 's' : ''}` : config.label}
        </span>
      </div>

      {/* Group collapse/expand chevron — top right */}
      {storyNode.isGroup && (
        <button
          onClick={handleCollapseToggle}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-surface-glass
            border border-surface-glass-border flex items-center justify-center
            text-text-muted hover:text-text-primary hover:bg-surface-glass-border
            transition-colors duration-100 pointer-events-auto cursor-pointer z-10"
          title={storyNode.collapsed ? 'Expand group' : 'Collapse group'}
          data-testid="group-collapse-toggle"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            {storyNode.collapsed
              ? <path d="M3 2 L7 5 L3 8Z" />
              : <path d="M2 3 L5 7 L8 3Z" />}
          </svg>
        </button>
      )}

      {/* Entity type summary icons — bottom center */}
      {!storyNode.isGroup && (
        <EntityTypeSummary storyNode={storyNode} />
      )}

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

const ENTITY_ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  Shield, User, Skull, Package, MapPin, EyeOff,
}

/** Small icon row showing which entity types appear in a node's fields */
const EntityTypeSummary = memo(function EntityTypeSummary({ storyNode }: { storyNode: StoryNode }) {
  const types = useMemo(
    () => extractEntityTypesFromNodeFields(storyNode),
    [storyNode],
  )

  if (types.size === 0) return null

  const typeArray = Array.from(types).slice(0, 6)

  return (
    <div
      className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex items-center gap-px
        pointer-events-none"
    >
      {typeArray.map((type: EntityType) => {
        const cfg = ENTITY_TYPE_CONFIGS.find((c) => c.type === type)
        if (!cfg) return null
        const Icon = ENTITY_ICON_MAP[cfg.icon]
        if (!Icon) return null
        return (
          <Icon
            key={type}
            size={8}
            style={{ color: cfg.color, opacity: 0.7 }}
          />
        )
      })}
    </div>
  )
})

/** Stacked shadow layers behind collapsed group nodes */
function GroupStackedShadow({ dim, shapePath }: { dim: { width: number; height: number }; shapePath: string }) {
  return (
    <>
      <svg
        width={dim.width}
        height={dim.height}
        viewBox={`0 0 ${dim.width} ${dim.height}`}
        className="absolute"
        style={{ top: 6, left: 4, opacity: 0.15 }}
      >
        <path d={shapePath} fill="var(--color-surface-glass-border)" stroke="none" />
      </svg>
      <svg
        width={dim.width}
        height={dim.height}
        viewBox={`0 0 ${dim.width} ${dim.height}`}
        className="absolute"
        style={{ top: 3, left: 2, opacity: 0.25 }}
      >
        <path d={shapePath} fill="var(--color-surface-glass-border)" stroke="none" />
      </svg>
    </>
  )
}
