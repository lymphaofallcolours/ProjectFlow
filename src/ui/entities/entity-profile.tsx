import { useState, useCallback } from 'react'
import { Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { ENTITY_TYPE_CONFIGS } from '@/domain/entity-types'
import { useEntityStore } from '@/application/entity-store'
import { useUIStore } from '@/application/ui-store'
import { EntityPortrait } from './entity-portrait'
import { EntityHistoryEditor } from './entity-history-editor'
import { EntityRelationshipsEditor } from './entity-relationships-editor'
import { EntityCustomFields } from './entity-custom-fields'

type EntityProfileProps = {
  entityId: string
}

export function EntityProfile({ entityId }: EntityProfileProps) {
  const entity = useEntityStore((s) => s.entities[entityId])
  const updateEntity = useEntityStore((s) => s.updateEntity)
  const removeEntity = useEntityStore((s) => s.removeEntity)
  const selectEntity = useUIStore((s) => s.selectEntity)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [sections, setSections] = useState({
    history: true,
    relationships: true,
    custom: false,
  })

  const config = ENTITY_TYPE_CONFIGS.find((c) => c.type === entity?.type)

  const toggleSection = useCallback((key: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const handleDelete = useCallback(() => {
    if (confirmDelete) {
      removeEntity(entityId)
      selectEntity(null)
    } else {
      setConfirmDelete(true)
    }
  }, [confirmDelete, entityId, removeEntity, selectEntity])

  if (!entity) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-text-muted">
        Entity not found
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Portrait */}
      <EntityPortrait entityId={entityId} entity={entity} />

      {/* Type badge */}
      <div className="px-4 pb-2 flex justify-center">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{
            backgroundColor: `${config?.color}22`,
            color: config?.color,
            border: `1px solid ${config?.color}44`,
          }}
        >
          {config?.label}
        </span>
      </div>

      {/* Name */}
      <div className="px-4 pb-3">
        <input
          value={entity.name}
          onChange={(e) => updateEntity(entityId, { name: e.target.value })}
          className="w-full bg-transparent text-base font-semibold text-text-primary outline-none
            border-b border-transparent focus:border-border transition-colors text-center"
          style={{ fontFamily: 'var(--font-display)' }}
        />
      </div>

      {/* Description */}
      <div className="px-4 pb-3">
        <label className="block text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">
          Description
        </label>
        <textarea
          value={entity.description ?? ''}
          onChange={(e) => updateEntity(entityId, { description: e.target.value })}
          placeholder="Who are they? What do they want?"
          className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted
            outline-none resize-none min-h-[80px] leading-relaxed"
          style={{ fontFamily: 'var(--font-body)' }}
        />
      </div>

      {/* Affiliations */}
      <div className="px-4 pb-3">
        <label className="block text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">
          Affiliations
        </label>
        <input
          value={entity.affiliations?.join(', ') ?? ''}
          onChange={(e) =>
            updateEntity(entityId, {
              affiliations: e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="Factions, groups (comma-separated)"
          className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted
            outline-none border-b border-border focus:border-node-event transition-colors pb-1"
        />
      </div>

      {/* Collapsible: Status History */}
      <SectionHeader
        label="Status History"
        open={sections.history}
        onToggle={() => toggleSection('history')}
        count={entity.statusHistory.length}
      />
      {sections.history && (
        <EntityHistoryEditor entityId={entityId} entity={entity} />
      )}

      {/* Collapsible: Relationships */}
      <SectionHeader
        label="Relationships"
        open={sections.relationships}
        onToggle={() => toggleSection('relationships')}
        count={entity.relationships?.length ?? 0}
      />
      {sections.relationships && (
        <EntityRelationshipsEditor entityId={entityId} entity={entity} />
      )}

      {/* Collapsible: Custom Fields */}
      <SectionHeader
        label="Custom Fields"
        open={sections.custom}
        onToggle={() => toggleSection('custom')}
        count={Object.keys(entity.custom).length}
      />
      {sections.custom && (
        <EntityCustomFields entityId={entityId} entity={entity} />
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Delete */}
      <div className="px-4 py-3 border-t border-border">
        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-status-skipped
            transition-colors cursor-pointer"
        >
          <Trash2 size={12} />
          {confirmDelete ? 'Click again to confirm' : 'Delete entity'}
        </button>
      </div>
    </div>
  )
}

function SectionHeader({
  label,
  open,
  onToggle,
  count,
}: {
  label: string
  open: boolean
  onToggle: () => void
  count: number
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-medium text-text-muted
        uppercase tracking-wider hover:text-text-secondary transition-colors cursor-pointer
        border-t border-border w-full text-left"
    >
      {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
      {label}
      {count > 0 && (
        <span className="ml-auto text-[9px] tabular-nums">{count}</span>
      )}
    </button>
  )
}
