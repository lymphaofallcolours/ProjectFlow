import React, { useCallback } from 'react'
import { Pencil, X } from 'lucide-react'
import type { StoryNode, FieldDefinition } from '@/domain/types'
import { useUIStore } from '@/application/ui-store'
import { FieldIcon } from './field-icon'
import { FieldReadView } from './field-read-view'
import { FieldEditor } from './field-editors/field-editor'

type PeripheralFieldCardProps = {
  node: StoryNode
  fieldDef: FieldDefinition
  index: number
}

export const PeripheralFieldCard = React.memo(function PeripheralFieldCard({
  node,
  fieldDef,
  index,
}: PeripheralFieldCardProps) {
  const editingField = useUIStore((s) => s.peripheralEditingField)
  const setEditing = useUIStore((s) => s.setPeripheralEditingField)
  const isEditing = editingField === fieldDef.key

  const handleToggleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setEditing(isEditing ? null : fieldDef.key)
    },
    [isEditing, fieldDef.key, setEditing],
  )

  return (
    <div
      className="glass-panel rounded-xl overflow-hidden pointer-events-auto
        peripheral-card-enter"
      style={{
        // Colored left accent — the bookmark ribbon
        borderLeft: `2px solid ${fieldDef.color}`,
        animationDelay: `${index * 40}ms`,
      }}
    >
      {/* Header — tinted with field accent color */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{
          background: `color-mix(in srgb, ${fieldDef.color} 6%, transparent)`,
        }}
      >
        <FieldIcon name={fieldDef.icon} size={14} style={{ color: fieldDef.color }} />
        <span
          className="text-[11px] font-semibold tracking-wide flex-1 uppercase"
          style={{
            fontFamily: 'var(--font-display)',
            color: fieldDef.color,
          }}
        >
          {fieldDef.label}
        </span>
        <button
          onClick={handleToggleEdit}
          className="p-1 rounded-md hover:bg-surface-glass transition-all duration-150 cursor-pointer
            opacity-60 hover:opacity-100"
          title={isEditing ? 'Close editor' : 'Edit field'}
        >
          {isEditing ? (
            <X size={12} className="text-text-secondary" />
          ) : (
            <Pencil size={12} className="text-text-muted" />
          )}
        </button>
      </div>

      {/* Content body */}
      <div className="px-3 pb-3">
        <div className="pt-2 max-h-[280px] overflow-y-auto peripheral-scrollbar">
          {isEditing ? (
            <FieldEditor node={node} fieldKey={fieldDef.key} />
          ) : (
            <FieldReadView node={node} fieldKey={fieldDef.key} />
          )}
        </div>
      </div>
    </div>
  )
})
