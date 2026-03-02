import { useState, useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import { ENTITY_TYPE_CONFIGS } from '@/domain/entity-types'
import { useEntityStore } from '@/application/entity-store'
import { useUIStore } from '@/application/ui-store'

type EntityProfileProps = {
  entityId: string
}

export function EntityProfile({ entityId }: EntityProfileProps) {
  const entity = useEntityStore((s) => s.entities[entityId])
  const updateEntity = useEntityStore((s) => s.updateEntity)
  const removeEntity = useEntityStore((s) => s.removeEntity)
  const selectEntity = useUIStore((s) => s.selectEntity)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const config = ENTITY_TYPE_CONFIGS.find((c) => c.type === entity?.type)

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
      {/* Type badge */}
      <div className="px-4 pt-4 pb-2">
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
            border-b border-transparent focus:border-border transition-colors"
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

      {/* Status history */}
      {entity.statusHistory.length > 0 && (
        <div className="px-4 pb-3">
          <label className="block text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1.5">
            Status History
          </label>
          <div className="space-y-1">
            {entity.statusHistory.map((entry, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                  style={{
                    backgroundColor: `${config?.color}18`,
                    color: config?.color,
                  }}
                >
                  +{entry.status}
                </span>
                {entry.note && (
                  <span className="text-text-muted truncate">{entry.note}</span>
                )}
              </div>
            ))}
          </div>
        </div>
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
