import { useState, useCallback } from 'react'
import { Plus, X } from 'lucide-react'
import type { Entity } from '@/domain/entity-types'
import { ENTITY_TYPE_CONFIGS } from '@/domain/entity-types'
import { useEntityStore } from '@/application/entity-store'

type EntityHistoryEditorProps = {
  entityId: string
  entity: Entity
}

export function EntityHistoryEditor({ entityId, entity }: EntityHistoryEditorProps) {
  const updateEntity = useEntityStore((s) => s.updateEntity)
  const addStatus = useEntityStore((s) => s.addStatus)
  const [newStatus, setNewStatus] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const config = ENTITY_TYPE_CONFIGS.find((c) => c.type === entity.type)

  const handleAdd = useCallback(() => {
    const trimmed = newStatus.trim()
    if (!trimmed) return
    addStatus(entityId, 'manual', trimmed)
    setNewStatus('')
    setIsAdding(false)
  }, [entityId, newStatus, addStatus])

  const handleRemoveEntry = useCallback(
    (index: number) => {
      const updated = entity.statusHistory.filter((_, i) => i !== index)
      updateEntity(entityId, { statusHistory: updated })
    },
    [entityId, entity.statusHistory, updateEntity],
  )

  return (
    <div className="px-4 pb-3">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
          Status History
        </label>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="p-0.5 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <Plus size={12} />
          </button>
        )}
      </div>

      {isAdding && (
        <div className="flex items-center gap-1.5 mb-2">
          <input
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') {
                setIsAdding(false)
                setNewStatus('')
              }
            }}
            placeholder="e.g. wounded, dead, promoted"
            autoFocus
            className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted
              outline-none border-b border-border focus:border-node-event transition-colors pb-0.5"
          />
          <button
            onClick={handleAdd}
            className="text-[10px] text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            Add
          </button>
        </div>
      )}

      {entity.statusHistory.length === 0 && !isAdding ? (
        <p className="text-[10px] text-text-muted italic">No status entries yet</p>
      ) : (
        <div className="space-y-1">
          {entity.statusHistory.map((entry, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] group">
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0"
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
              <button
                onClick={() => handleRemoveEntry(i)}
                className="ml-auto p-0.5 text-text-muted hover:text-status-skipped
                  opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
