import { useState, useCallback } from 'react'
import { X, Check } from 'lucide-react'
import { useGraphStore } from '@/application/graph-store'
import { useUIStore } from '@/application/ui-store'
import { FIELD_DEFINITIONS, SCENE_TYPE_CONFIG } from '@/domain/types'
import { OverlayBackdrop } from './overlay-backdrop'
import { CockpitFieldPanel } from './cockpit-field-panel'

type CockpitOverlayProps = {
  nodeId: string
}

/**
 * Tier 3 overlay — the full cockpit. Shows all 11 field panels in a
 * responsive grid. Triggered by double-clicking a node.
 */
export function CockpitOverlay({ nodeId }: CockpitOverlayProps) {
  const node = useGraphStore((s) => s.nodes[nodeId])
  const renameNode = useGraphStore((s) => s.renameNode)
  const closeOverlay = useUIStore((s) => s.closeOverlay)

  if (!node) return null

  const config = SCENE_TYPE_CONFIG[node.sceneType]
  const accentColor = `var(--color-${config.color})`

  return (
    <OverlayBackdrop onDismiss={closeOverlay}>
      <div className="h-full flex flex-col p-4 md:p-6 overflow-hidden">
        {/* Cockpit header */}
        <CockpitHeader
          label={node.label}
          sceneTypeLabel={config.label}
          accentColor={accentColor}
          onRename={(label) => renameNode(nodeId, label)}
          onClose={closeOverlay}
        />

        {/* Field grid — responsive 3/2/1 columns */}
        <div
          className="flex-1 overflow-y-auto mt-4 grid gap-3
            grid-cols-1 sm:grid-cols-2 xl:grid-cols-3
            auto-rows-min content-start"
        >
          {FIELD_DEFINITIONS.map((fieldDef) => (
            <CockpitFieldPanel
              key={fieldDef.key}
              node={node}
              fieldDef={fieldDef}
            />
          ))}
        </div>
      </div>
    </OverlayBackdrop>
  )
}

/** Cockpit header with inline-editable node label and scene type badge */
function CockpitHeader({
  label,
  sceneTypeLabel,
  accentColor,
  onRename,
  onClose,
}: {
  label: string
  sceneTypeLabel: string
  accentColor: string
  onRename: (label: string) => void
  onClose: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(label)

  const startEdit = useCallback(() => {
    setDraft(label)
    setEditing(true)
  }, [label])

  const confirmEdit = useCallback(() => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== label) {
      onRename(trimmed)
    }
    setEditing(false)
  }, [draft, label, onRename])

  const cancelEdit = useCallback(() => {
    setEditing(false)
  }, [])

  return (
    <div
      className="flex items-center gap-3 glass-panel rounded-xl px-4 py-3"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Scene type badge */}
      <span
        className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md"
        style={{
          color: accentColor,
          backgroundColor: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
        }}
      >
        {sceneTypeLabel}
      </span>

      {/* Editable label */}
      {editing ? (
        <div className="flex items-center gap-2 flex-1">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmEdit()
              if (e.key === 'Escape') cancelEdit()
            }}
            className="flex-1 bg-transparent text-lg font-semibold text-text-primary
              outline-none border-b border-border focus:border-text-secondary
              transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          />
          <button
            onClick={confirmEdit}
            className="p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Check size={16} className="text-text-secondary" />
          </button>
        </div>
      ) : (
        <button
          onClick={startEdit}
          className="flex-1 text-left text-lg font-semibold text-text-primary
            hover:text-text-secondary transition-colors cursor-pointer"
          style={{ fontFamily: 'var(--font-display)' }}
          title="Click to rename"
        >
          {label}
        </button>
      )}

      {/* Close button */}
      <button
        onClick={onClose}
        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer ml-auto"
      >
        <X size={18} className="text-text-muted" />
      </button>
    </div>
  )
}
