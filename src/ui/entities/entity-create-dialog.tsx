import { useState, useCallback } from 'react'
import type { EntityType } from '@/domain/entity-types'
import { ENTITY_TYPE_CONFIGS } from '@/domain/entity-types'
import { useEntityStore } from '@/application/entity-store'

type EntityCreateDialogProps = {
  onCreated: (id: string) => void
  onCancel: () => void
}

export function EntityCreateDialog({ onCreated, onCancel }: EntityCreateDialogProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<EntityType>('pc')
  const [description, setDescription] = useState('')

  const addEntity = useEntityStore((s) => s.addEntity)

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!name.trim()) return
      const id = addEntity(type, name.trim(), description.trim() || undefined)
      onCreated(id)
    },
    [name, type, description, addEntity, onCreated],
  )

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col px-4 py-3 gap-3">
      {/* Name */}
      <div>
        <label className="block text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">
          Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Entity name"
          autoFocus
          className="w-full bg-surface-glass border border-border rounded-lg px-3 py-1.5
            text-xs text-text-primary placeholder:text-text-muted outline-none
            focus:border-node-event transition-colors"
        />
      </div>

      {/* Type selector */}
      <div>
        <label className="block text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1.5">
          Type
        </label>
        <div className="grid grid-cols-3 gap-1">
          {ENTITY_TYPE_CONFIGS.map((cfg) => (
            <button
              key={cfg.type}
              type="button"
              onClick={() => setType(cfg.type)}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-medium border transition-all cursor-pointer
                ${type === cfg.type
                  ? 'border-current bg-surface-glass'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
                }`}
              style={type === cfg.type ? { color: cfg.color, borderColor: `${cfg.color}66` } : undefined}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description..."
          className="w-full bg-surface-glass border border-border rounded-lg px-3 py-1.5
            text-xs text-text-primary placeholder:text-text-muted outline-none
            focus:border-node-event transition-colors resize-none min-h-[60px]"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-2">
        <button
          type="submit"
          disabled={!name.trim()}
          className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium
            bg-node-event text-white hover:opacity-90
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-all cursor-pointer"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Create
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-xs text-text-muted
            hover:text-text-secondary transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
