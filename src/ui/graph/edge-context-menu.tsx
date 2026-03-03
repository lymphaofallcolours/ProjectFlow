import { useCallback, useEffect, useRef, useState } from 'react'
import { Trash2, Tag, ArrowLeftRight } from 'lucide-react'
import type { StoryEdge } from '@/domain/types'
import { useGraphStore } from '@/application/graph-store'
import { MenuItem } from './context-menu'
import { EdgeLabelInput } from './edge-label-input'
import { NodeSelectorInput } from '@/ui/components/node-selector-input'
import { useEscapeKey } from '@/ui/hooks/use-escape-key'
import { useMenuPosition } from '@/ui/hooks/use-menu-position'

type EdgeContextMenuProps = {
  edgeId: string
  position: { x: number; y: number }
  onClose: () => void
}

const EDGE_STYLE_OPTIONS: { value: StoryEdge['style']; label: string; symbol: string }[] = [
  { value: 'default', label: 'Default', symbol: '─' },
  { value: 'conditional', label: 'Conditional', symbol: '╌' },
  { value: 'secret', label: 'Secret', symbol: '┄' },
]

export function EdgeContextMenu({ edgeId, position, onClose }: EdgeContextMenuProps) {
  const edge = useGraphStore((s) => s.edges[edgeId])
  const setEdgeStyle = useGraphStore((s) => s.setEdgeStyle)
  const setEdgeLabel = useGraphStore((s) => s.setEdgeLabel)
  const disconnectEdge = useGraphStore((s) => s.disconnectEdge)
  const rewireEdge = useGraphStore((s) => s.rewireEdge)
  const ref = useRef<HTMLDivElement>(null)

  useEscapeKey(onClose)
  useMenuPosition(ref, position)

  const [editingLabel, setEditingLabel] = useState(false)
  const [showRewire, setShowRewire] = useState(false)

  const handleStyleChange = useCallback(
    (style: StoryEdge['style']) => {
      setEdgeStyle(edgeId, style)
      onClose()
    },
    [setEdgeStyle, edgeId, onClose],
  )

  const handleDelete = useCallback(() => {
    disconnectEdge(edgeId)
    onClose()
  }, [disconnectEdge, edgeId, onClose])

  const handleLabelConfirm = useCallback(
    (label: string) => {
      setEdgeLabel(edgeId, label)
      onClose()
    },
    [setEdgeLabel, edgeId, onClose],
  )

  const handleLabelClear = useCallback(() => {
    setEdgeLabel(edgeId, undefined)
    onClose()
  }, [setEdgeLabel, edgeId, onClose])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  if (!edge) return null

  const currentStyle = edge.style ?? 'default'

  return (
    <div
      ref={ref}
      className="fixed glass-panel rounded-xl p-1 min-w-[180px] shadow-xl z-[100]"
      style={{ top: position.y, left: position.x }}
    >
      {/* Edge style section */}
      <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-text-muted font-medium">
        Edge Style
      </div>
      {EDGE_STYLE_OPTIONS.map((option) => (
        <MenuItem
          key={option.value}
          icon={
            <span className="text-sm w-4 text-center text-text-muted">
              {option.symbol}
            </span>
          }
          label={option.label}
          active={currentStyle === option.value}
          onClick={() => handleStyleChange(option.value)}
        />
      ))}

      <div className="h-px bg-border my-1 mx-2" />

      {/* Label section */}
      <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-text-muted font-medium">
        Label
      </div>
      {editingLabel ? (
        <EdgeLabelInput
          initialValue={edge.label ?? ''}
          onConfirm={handleLabelConfirm}
          onCancel={() => setEditingLabel(false)}
          onClear={handleLabelClear}
        />
      ) : (
        <MenuItem
          icon={<Tag size={14} className="text-text-muted" />}
          label={edge.label ?? 'Set label...'}
          onClick={() => setEditingLabel(true)}
        />
      )}

      <div className="h-px bg-border my-1 mx-2" />

      {/* Rewire section */}
      {showRewire ? (
        <div className="px-2 py-1.5 space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-medium">
            Rewire
          </div>
          <NodeSelectorInput
            value={edge.source}
            onChange={(newSource) => {
              rewireEdge(edgeId, newSource, undefined)
            }}
            excludeIds={[edge.target]}
            label="Source"
          />
          <NodeSelectorInput
            value={edge.target}
            onChange={(newTarget) => {
              rewireEdge(edgeId, undefined, newTarget)
            }}
            excludeIds={[edge.source]}
            label="Target"
          />
        </div>
      ) : (
        <MenuItem
          icon={<ArrowLeftRight size={14} className="text-text-muted" />}
          label="Rewire"
          onClick={() => setShowRewire(true)}
        />
      )}

      <div className="h-px bg-border my-1 mx-2" />

      <MenuItem
        icon={<Trash2 size={14} className="text-status-skipped" />}
        label="Delete Edge"
        onClick={handleDelete}
        destructive
      />
    </div>
  )
}
