import { useState, useCallback } from 'react'
import { Plus, X } from 'lucide-react'
import type { Entity } from '@/domain/entity-types'
import { useEntityStore } from '@/application/entity-store'
import {
  addEntityCustomField,
  removeEntityCustomField,
  updateEntityCustomField,
} from '@/domain/entity-operations'

type EntityCustomFieldsProps = {
  entityId: string
  entity: Entity
}

export function EntityCustomFields({ entityId, entity }: EntityCustomFieldsProps) {
  const updateEntity = useEntityStore((s) => s.updateEntity)
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newValue, setNewValue] = useState('')

  const fields = Object.entries(entity.custom)

  const handleAdd = useCallback(() => {
    const name = newName.trim()
    if (!name) return
    const updated = addEntityCustomField(entity, name, newValue)
    updateEntity(entityId, { custom: updated.custom })
    setNewName('')
    setNewValue('')
    setIsAdding(false)
  }, [entityId, entity, newName, newValue, updateEntity])

  const handleRemove = useCallback(
    (fieldName: string) => {
      const updated = removeEntityCustomField(entity, fieldName)
      updateEntity(entityId, { custom: updated.custom })
    },
    [entityId, entity, updateEntity],
  )

  const handleValueChange = useCallback(
    (fieldName: string, value: string) => {
      const updated = updateEntityCustomField(entity, fieldName, value)
      updateEntity(entityId, { custom: updated.custom })
    },
    [entityId, entity, updateEntity],
  )

  return (
    <div className="px-4 pb-3">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
          Custom Fields
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
        <div className="space-y-1.5 mb-2 p-2 rounded-lg bg-surface-glass border border-border">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Field name"
            autoFocus
            className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted
              outline-none border-b border-border focus:border-node-event transition-colors pb-0.5"
          />
          <input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') {
                setIsAdding(false)
                setNewName('')
                setNewValue('')
              }
            }}
            placeholder="Field value"
            className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted
              outline-none border-b border-border focus:border-node-event transition-colors pb-0.5"
          />
          <div className="flex gap-1.5 justify-end">
            <button
              onClick={() => {
                setIsAdding(false)
                setNewName('')
                setNewValue('')
              }}
              className="text-[10px] text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="text-[10px] text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {fields.length === 0 && !isAdding ? (
        <p className="text-[10px] text-text-muted italic">No custom fields</p>
      ) : (
        <div className="space-y-1.5">
          {fields.map(([name, value]) => (
            <div key={name} className="group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-text-muted">{name}</span>
                <button
                  onClick={() => handleRemove(name)}
                  className="p-0.5 text-text-muted hover:text-status-skipped
                    opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                >
                  <X size={10} />
                </button>
              </div>
              <input
                value={value}
                onChange={(e) => handleValueChange(name, e.target.value)}
                className="w-full bg-transparent text-xs text-text-primary
                  outline-none border-b border-border focus:border-node-event
                  transition-colors pb-0.5"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
