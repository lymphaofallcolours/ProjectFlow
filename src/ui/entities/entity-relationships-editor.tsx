import { useState, useCallback } from 'react'
import { Plus, X, ArrowRight } from 'lucide-react'
import type { Entity } from '@/domain/entity-types'
import { ENTITY_TYPE_CONFIGS } from '@/domain/entity-types'
import { useEntityStore } from '@/application/entity-store'
import { useUIStore } from '@/application/ui-store'

type EntityRelationshipsEditorProps = {
  entityId: string
  entity: Entity
}

export function EntityRelationshipsEditor({ entityId, entity }: EntityRelationshipsEditorProps) {
  const addRelationship = useEntityStore((s) => s.addRelationship)
  const removeRelationship = useEntityStore((s) => s.removeRelationship)
  const allEntities = useEntityStore((s) => s.getAllEntities)
  const getEntity = useEntityStore((s) => s.getEntity)
  const selectEntity = useUIStore((s) => s.selectEntity)

  const [isAdding, setIsAdding] = useState(false)
  const [targetId, setTargetId] = useState('')
  const [relType, setRelType] = useState('')

  const otherEntities = allEntities().filter((e) => e.id !== entityId)
  const relationships = entity.relationships ?? []

  const handleAdd = useCallback(() => {
    if (!targetId || !relType.trim()) return
    addRelationship(entityId, {
      targetEntityId: targetId,
      type: relType.trim(),
    })
    setTargetId('')
    setRelType('')
    setIsAdding(false)
  }, [entityId, targetId, relType, addRelationship])

  const handleNavigate = useCallback(
    (id: string) => {
      selectEntity(id)
    },
    [selectEntity],
  )

  return (
    <div className="px-4 pb-3">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
          Relationships
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
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full bg-transparent text-xs text-text-primary outline-none
              border-b border-border focus:border-node-event transition-colors pb-0.5"
          >
            <option value="">Select entity...</option>
            {otherEntities.map((e) => {
              const cfg = ENTITY_TYPE_CONFIGS.find((c) => c.type === e.type)
              return (
                <option key={e.id} value={e.id}>
                  {cfg?.label}: {e.name}
                </option>
              )
            })}
          </select>
          <input
            value={relType}
            onChange={(e) => setRelType(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') {
                setIsAdding(false)
                setTargetId('')
                setRelType('')
              }
            }}
            placeholder="Relationship type (e.g. ally, rival)"
            className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted
              outline-none border-b border-border focus:border-node-event transition-colors pb-0.5"
          />
          <div className="flex gap-1.5 justify-end">
            <button
              onClick={() => {
                setIsAdding(false)
                setTargetId('')
                setRelType('')
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

      {relationships.length === 0 && !isAdding ? (
        <p className="text-[10px] text-text-muted italic">No relationships</p>
      ) : (
        <div className="space-y-1">
          {relationships.map((rel) => {
            const target = getEntity(rel.targetEntityId)
            const cfg = target
              ? ENTITY_TYPE_CONFIGS.find((c) => c.type === target.type)
              : undefined
            return (
              <div
                key={rel.targetEntityId}
                className="flex items-center gap-1.5 text-[11px] group"
              >
                <span className="text-text-muted shrink-0">{rel.type}</span>
                <ArrowRight size={10} className="text-text-muted shrink-0" />
                <button
                  onClick={() => handleNavigate(rel.targetEntityId)}
                  className="flex items-center gap-1 text-text-primary hover:underline
                    cursor-pointer truncate"
                >
                  {cfg && (
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: cfg.color }}
                    />
                  )}
                  {target?.name ?? 'Unknown'}
                </button>
                <button
                  onClick={() => removeRelationship(entityId, rel.targetEntityId)}
                  className="ml-auto p-0.5 text-text-muted hover:text-status-skipped
                    opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                >
                  <X size={10} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
