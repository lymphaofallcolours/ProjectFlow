import { memo, useCallback, useContext, useMemo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps, Node } from '@xyflow/react'
import { Shield, User, Skull, Package, MapPin, EyeOff, Tag } from 'lucide-react'
import type { StoryNode } from '@/domain/types'
import { SCENE_TYPE_CONFIG } from '@/domain/types'
import type { EntityType } from '@/domain/entity-types'
import { ENTITY_TYPE_CONFIGS } from '@/domain/entity-types'
import { getShapePath, getHandleInsets, NODE_DIMENSIONS } from './node-shapes'
import { useGraphStore } from '@/application/graph-store'
import { useUIStore } from '@/application/ui-store'
import { useSessionStore } from '@/application/session-store'
import { useLongPress } from '@/ui/hooks/use-long-press'
import { buildDiffMap, PLAYTHROUGH_STATUS_CONFIG } from '@/domain/playthrough-operations'
import { HighlightContext } from './highlight-context'
import { getGroupChildIds, getGroupDepth } from '@/domain/group-operations'
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

  const isGroup = storyNode.isGroup
  const isDivider = storyNode.sceneType === 'divider'

  // Group child count (only computed for group nodes)
  const childCount = useMemo(() => {
    if (!isGroup) return 0
    return getGroupChildIds(allNodes, storyNode.id).length
  }, [isGroup, storyNode.id, allNodes])

  // Group nesting depth
  const groupDepth = useMemo(() => {
    if (!isGroup) return 0
    return getGroupDepth(allNodes, storyNode.id)
  }, [isGroup, storyNode.id, allNodes])

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
    useGraphStore.getState().selectNodes([storyNode.id])
    showRadialSubnodes(storyNode.id)
  }, [showRadialSubnodes, storyNode.id])

  const handleCollapseToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      toggleGroupCollapsed(storyNode.id)
    },
    [toggleGroupCollapsed, storyNode.id],
  )

  const longPressRef = useLongPress(handleLongPress)

  // Groups always render as group-rect, regardless of sceneType
  const config = SCENE_TYPE_CONFIG[storyNode.sceneType]
  const shape = isGroup ? 'group-rect' : config.shape
  const dim = NODE_DIMENSIONS[shape]
  const shapePath = getShapePath(shape)
  const accentColor = isGroup
    ? 'var(--color-node-group)'
    : `var(--color-${config.color})`

  const targetPos = scrollDirection === 'horizontal' ? Position.Left : Position.Top
  const sourcePos = scrollDirection === 'horizontal' ? Position.Right : Position.Bottom
  const handleInsets = getHandleInsets(shape)

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

  // Single-tone translucent fill
  const nodeFillColor = `color-mix(in srgb, ${accentColor} var(--accent-mix), var(--color-node-fill-base))`

  // Expanded groups render as ghost (faint outline)
  const isGhost = isGroup && !storyNode.collapsed
  // Divider magnitude
  const magnitude = isDivider ? (storyNode.dividerMagnitude ?? 1) : 0

  return (
    <div
      ref={longPressRef}
      className="relative group transition-opacity duration-200"
      style={{
        width: dim.width,
        height: dim.height,
        opacity: dimmed ? 0.3 : 1,
      }}
    >
      {/* Stacked shadow layers — depth-scaled for collapsed groups */}
      {isGroup && storyNode.collapsed && (
        <GroupStackedShadow dim={dim} shapePath={shapePath} depth={groupDepth} />
      )}

      {/* SVG shape with glass effect */}
      <svg
        width={dim.width}
        height={dim.height}
        viewBox={`0 0 ${dim.width} ${dim.height}`}
        overflow="visible"
        className="absolute inset-0"
      >
        {/* Group: double border (outer ring) */}
        {isGroup && (
          <path
            d={shapePath}
            fill="none"
            stroke={accentColor}
            strokeWidth="2"
            opacity={isGhost ? 0.15 : 0.6}
          />
        )}

        {/* Group: inner border (scaled inward) */}
        {isGroup && (
          <g transform={`translate(4,4) scale(${(dim.width - 8) / dim.width}, ${(dim.height - 8) / dim.height})`}>
            <path
              d={shapePath}
              fill="none"
              stroke={accentColor}
              strokeWidth="1"
              opacity={isGhost ? 0.1 : 0.4}
            />
          </g>
        )}

        {/* Diff overlay ring */}
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

        {/* Solid tinted fill — ghost groups get very low opacity */}
        <path
          d={shapePath}
          fill={nodeFillColor}
          stroke={diffRingColor ?? (selected ? accentColor : 'var(--color-surface-glass-border)')}
          strokeWidth={isDivider ? magnitudeStrokeWidth(magnitude) : diffRingColor ? 2 : selected ? 2 : 1}
          opacity={isGhost ? 0.15 : 1}
          className="transition-all duration-150"
        />

        {/* Top highlight — glass reflection (not on ghost groups) */}
        {!isGhost && (
          <path
            d={shapePath}
            fill="url(#highlight-sheen)"
            opacity="0.12"
          />
        )}
      </svg>

      {/* Label + arc label */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-3"
        style={{
          ...(config.shape === 'triangle' ? { paddingLeft: 8, paddingRight: 50 } : undefined),
          ...(shape === 'banner' ? { paddingLeft: 20, paddingRight: 20 } : undefined),
        }}
      >
        {storyNode.arcLabel && !isDivider && (
          <span
            className="text-[9px] font-medium tracking-widest uppercase mb-0.5 opacity-60"
            style={{ color: accentColor }}
          >
            {storyNode.arcLabel}
          </span>
        )}
        <span
          className={`text-text-primary text-center leading-tight line-clamp-2 ${
            isDivider
              ? magnitudeLabelClass(magnitude)
              : 'text-xs font-semibold'
          }`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {storyNode.label}
        </span>
        {!isDivider && (
          <span className="text-[9px] mt-0.5 font-medium text-text-secondary">
            {isGroup ? `${childCount} node${childCount !== 1 ? 's' : ''}` : config.label}
          </span>
        )}
      </div>

      {/* Group collapse/expand chevron — top right */}
      {isGroup && (
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

      {/* Group depth badge — top left, only for nested groups */}
      {isGroup && groupDepth > 0 && (
        <GroupDepthBadge depth={groupDepth} />
      )}

      {/* Entity type summary icons — bottom center (not on groups or dividers) */}
      {!isGroup && !isDivider && (
        <EntityTypeSummary storyNode={storyNode} />
      )}

      {/* Tag indicator */}
      {storyNode.metadata.tags.length > 0 && (
        <div
          className="absolute -bottom-0.5 -left-0.5 pointer-events-none"
          title={storyNode.metadata.tags.join(', ')}
        >
          <Tag size={7} className="text-text-muted" style={{ opacity: 0.7 }} />
        </div>
      )}

      {/* Status dot */}
      {statusDotColor && (
        <div
          className="absolute -bottom-0.5 -right-0.5 w-[7px] h-[7px] rounded-full border border-surface-glass"
          style={{ backgroundColor: statusDotColor }}
          title={storyNode.playthroughStatus
            ? `${PLAYTHROUGH_STATUS_CONFIG[storyNode.playthroughStatus].label}${storyNode.playthroughNotes ? `\n${storyNode.playthroughNotes}` : ''}`
            : undefined}
        />
      )}

      {/* Handles */}
      <Handle
        type="target"
        position={targetPos}
        className="!w-2.5 !h-2.5 !rounded-full !border-2 !bg-surface-glass"
        style={{
          borderColor: accentColor,
          ...(targetPos === Position.Left && handleInsets.left != null ? { left: handleInsets.left } : {}),
          ...(targetPos === Position.Top && handleInsets.top != null ? { top: handleInsets.top } : {}),
        }}
      />
      <Handle
        type="source"
        position={sourcePos}
        className="!w-2.5 !h-2.5 !rounded-full !border-2 !bg-surface-glass"
        style={{
          borderColor: accentColor,
          ...(sourcePos === Position.Right && handleInsets.right != null ? { right: handleInsets.right } : {}),
          ...(sourcePos === Position.Bottom && handleInsets.bottom != null ? { bottom: handleInsets.bottom } : {}),
        }}
      />
    </div>
  )
})

// --- Divider magnitude helpers ---

function magnitudeStrokeWidth(magnitude: number): number {
  return magnitude === 3 ? 3 : magnitude === 2 ? 2 : 1
}

function magnitudeLabelClass(magnitude: number): string {
  if (magnitude === 3) return 'text-sm font-bold tracking-wide uppercase'
  if (magnitude === 2) return 'text-xs font-semibold tracking-wide'
  return 'text-[10px] font-medium'
}

// --- Sub-components ---

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

/** Circled number badge showing group nesting depth */
function GroupDepthBadge({ depth }: { depth: number }) {
  return (
    <div
      className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-surface-glass
        border border-surface-glass-border flex items-center justify-center
        pointer-events-none z-10"
      title={`Nesting depth: ${depth}`}
    >
      <span className="text-[8px] font-bold text-text-secondary">{depth}</span>
    </div>
  )
}

/** Stacked shadow layers behind collapsed group nodes — count scales with depth */
function GroupStackedShadow({
  dim,
  shapePath,
  depth,
}: {
  dim: { width: number; height: number }
  shapePath: string
  depth: number
}) {
  const layerCount = Math.min(depth + 1, 5)
  const layers = Array.from({ length: layerCount }, (_, i) => i)

  return (
    <>
      {layers.map((i) => (
        <svg
          key={i}
          width={dim.width}
          height={dim.height}
          viewBox={`0 0 ${dim.width} ${dim.height}`}
          className="absolute"
          style={{
            top: 3 * (layerCount - i),
            left: 2 * (layerCount - i),
            opacity: 0.1 + 0.05 * i,
          }}
        >
          <path d={shapePath} fill="var(--color-surface-glass-border)" stroke="none" />
        </svg>
      ))}
    </>
  )
}
