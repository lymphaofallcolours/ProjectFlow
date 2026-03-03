import { useState, useCallback } from 'react'
import { X, Plus, Pencil, Trash2, LayoutTemplate, Check } from 'lucide-react'
import { useUIStore } from '@/application/ui-store'
import { useCampaignStore } from '@/application/campaign-store'
import type { CustomFieldTemplate } from '@/domain/types'
import { FieldIcon } from '@/ui/overlays/field-icon'

export function TemplateManager() {
  const isOpen = useUIStore((s) => s.templateManagerOpen)
  const close = useUIStore((s) => s.toggleTemplateManager)
  const templates = useCampaignStore((s) => s.customFieldTemplates)
  const addTemplate = useCampaignStore((s) => s.addTemplate)
  const updateTemplate = useCampaignStore((s) => s.updateTemplate)
  const removeTemplate = useCampaignStore((s) => s.removeTemplate)

  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleClose = useCallback(() => {
    close()
    setShowCreate(false)
    setEditingId(null)
  }, [close])

  if (!isOpen) return null

  return (
    <div
      className="absolute left-0 top-0 bottom-0 w-80 z-30 glass-panel border-r border-border
        flex flex-col shadow-2xl"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <LayoutTemplate size={14} className="text-text-muted" />
          <h2
            className="text-sm font-semibold text-text-primary tracking-wide"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Templates
          </h2>
        </div>
        <button
          onClick={handleClose}
          className="p-1 rounded-md text-text-muted hover:text-text-primary
            hover:bg-surface-glass transition-all cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      {/* Template list */}
      <div className="flex-1 overflow-y-auto">
        {templates.length === 0 && !showCreate && (
          <div className="px-4 py-8 text-center">
            <LayoutTemplate size={28} className="mx-auto mb-2 text-text-muted opacity-40" />
            <p className="text-xs text-text-muted">
              No templates yet. Create one to quickly add pre-configured custom fields.
            </p>
          </div>
        )}

        {templates.map((template) => (
          <TemplateRow
            key={template.id}
            template={template}
            isEditing={editingId === template.id}
            onEdit={() => setEditingId(template.id)}
            onCancelEdit={() => setEditingId(null)}
            onUpdate={(updates) => {
              updateTemplate(template.id, updates)
              setEditingId(null)
            }}
            onDelete={() => {
              removeTemplate(template.id)
              if (editingId === template.id) setEditingId(null)
            }}
          />
        ))}
      </div>

      {/* Create form or button */}
      <div className="px-3 py-2 border-t border-border">
        {showCreate ? (
          <TemplateCreateForm
            onCreated={(label, icon, description) => {
              addTemplate(label, icon, description)
              setShowCreate(false)
            }}
            onCancel={() => setShowCreate(false)}
          />
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
              text-xs font-medium text-text-secondary hover:text-text-primary
              bg-surface-glass hover:bg-surface-overlay border border-border
              transition-all cursor-pointer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <Plus size={13} />
            Add Template
          </button>
        )}
      </div>
    </div>
  )
}

function TemplateRow({
  template,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
}: {
  template: CustomFieldTemplate
  isEditing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onUpdate: (updates: Partial<Pick<CustomFieldTemplate, 'label' | 'icon' | 'description'>>) => void
  onDelete: () => void
}) {
  const [label, setLabel] = useState(template.label)
  const [icon, setIcon] = useState(template.icon)
  const [description, setDescription] = useState(template.description ?? '')

  if (isEditing) {
    return (
      <div className="px-3 py-2 border-b border-border space-y-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label"
          className="w-full bg-surface-glass border border-border rounded-md px-2 py-1.5
            text-xs text-text-primary placeholder:text-text-muted outline-none
            focus:border-node-event transition-colors"
          autoFocus
        />
        <input
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="Icon name (e.g. Swords, BookOpen)"
          className="w-full bg-surface-glass border border-border rounded-md px-2 py-1.5
            text-xs text-text-primary placeholder:text-text-muted outline-none
            focus:border-node-event transition-colors"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full bg-surface-glass border border-border rounded-md px-2 py-1.5
            text-xs text-text-primary placeholder:text-text-muted outline-none
            focus:border-node-event transition-colors"
        />
        <div className="flex gap-1.5">
          <button
            onClick={() => onUpdate({ label, icon, description: description || undefined })}
            disabled={!label.trim()}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md
              text-xs font-medium text-node-event bg-node-event/10 hover:bg-node-event/15
              transition-all cursor-pointer disabled:opacity-40 disabled:cursor-default"
          >
            <Check size={12} />
            Save
          </button>
          <button
            onClick={onCancelEdit}
            className="px-2 py-1.5 rounded-md text-xs text-text-muted
              hover:text-text-secondary transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex items-start gap-3 px-4 py-2.5 border-b border-border
      hover:bg-surface-glass/50 transition-colors">
      <div className="mt-0.5 text-text-muted">
        <FieldIcon name={template.icon} size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <span
          className="text-xs font-medium text-text-primary block truncate"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {template.label}
        </span>
        {template.description && (
          <span className="text-[10px] text-text-muted block truncate mt-0.5">
            {template.description}
          </span>
        )}
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1 rounded text-text-muted hover:text-text-primary
            hover:bg-surface-glass transition-all cursor-pointer"
          title="Edit template"
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded text-text-muted hover:text-node-combat
            hover:bg-node-combat/10 transition-all cursor-pointer"
          title="Delete template"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

function TemplateCreateForm({
  onCreated,
  onCancel,
}: {
  onCreated: (label: string, icon: string, description?: string) => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState('')
  const [icon, setIcon] = useState('Sparkles')
  const [description, setDescription] = useState('')

  const handleSubmit = useCallback(() => {
    if (!label.trim()) return
    onCreated(label.trim(), icon.trim() || 'Sparkles', description.trim() || undefined)
  }, [label, icon, description, onCreated])

  return (
    <div className="space-y-2">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Template label"
        className="w-full bg-surface-glass border border-border rounded-md px-2.5 py-1.5
          text-xs text-text-primary placeholder:text-text-muted outline-none
          focus:border-node-event transition-colors"
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <input
        value={icon}
        onChange={(e) => setIcon(e.target.value)}
        placeholder="Icon name (e.g. Swords)"
        className="w-full bg-surface-glass border border-border rounded-md px-2.5 py-1.5
          text-xs text-text-primary placeholder:text-text-muted outline-none
          focus:border-node-event transition-colors"
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="w-full bg-surface-glass border border-border rounded-md px-2.5 py-1.5
          text-xs text-text-primary placeholder:text-text-muted outline-none
          focus:border-node-event transition-colors"
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <div className="flex gap-1.5">
        <button
          onClick={handleSubmit}
          disabled={!label.trim()}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
            text-xs font-medium text-node-event bg-node-event/10 hover:bg-node-event/15
            transition-all cursor-pointer disabled:opacity-40 disabled:cursor-default"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <Plus size={13} />
          Create
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-2 rounded-lg text-xs text-text-muted
            hover:text-text-secondary transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
