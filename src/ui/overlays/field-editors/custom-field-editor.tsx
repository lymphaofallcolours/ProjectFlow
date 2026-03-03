import { useState, useCallback, useRef, useEffect } from 'react'
import { Plus, X, LayoutTemplate } from 'lucide-react'
import type { CustomField, RichContent } from '@/domain/types'
import { createEmptyRichContent } from '@/domain/graph-operations'
import { instantiateTemplate } from '@/domain/template-operations'
import { useCampaignStore } from '@/application/campaign-store'
import { TipTapEditor } from '@/ui/editor/tiptap-editor'
import { AttachmentGallery } from '@/ui/editor/attachment-gallery'

type CustomFieldEditorProps = {
  value: CustomField[]
  onChange: (value: CustomField[]) => void
}

export function CustomFieldEditor({ value, onChange }: CustomFieldEditorProps) {
  const [showPicker, setShowPicker] = useState(false)
  const templates = useCampaignStore((s) => s.customFieldTemplates)

  const handleAddBlank = useCallback(() => {
    onChange([...value, { label: '', content: createEmptyRichContent() }])
    setShowPicker(false)
  }, [value, onChange])

  const handleAddFromTemplate = useCallback(
    (templateId: string) => {
      const template = templates.find((t) => t.id === templateId)
      if (!template) return
      onChange([...value, instantiateTemplate(template)])
      setShowPicker(false)
    },
    [value, onChange, templates],
  )

  const handleRemove = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index))
    },
    [value, onChange],
  )

  const handleUpdateLabel = useCallback(
    (index: number, label: string) => {
      const updated = value.map((field, i) =>
        i === index ? { ...field, label } : field,
      )
      onChange(updated)
    },
    [value, onChange],
  )

  const handleUpdateContent = useCallback(
    (index: number, markdown: string) => {
      const updated = value.map((field, i) =>
        i === index ? { ...field, content: { ...field.content, markdown } } : field,
      )
      onChange(updated)
    },
    [value, onChange],
  )

  const handleUpdateRichContent = useCallback(
    (index: number, content: RichContent) => {
      const updated = value.map((field, i) =>
        i === index ? { ...field, content } : field,
      )
      onChange(updated)
    },
    [value, onChange],
  )

  return (
    <div className="space-y-3">
      {value.map((field, i) => (
        <div key={i} className="space-y-1 group">
          <div className="flex items-center gap-2">
            <input
              value={field.label}
              onChange={(e) => handleUpdateLabel(i, e.target.value)}
              placeholder="Field label"
              className="flex-1 bg-transparent text-xs font-medium text-text-secondary
                placeholder:text-text-muted outline-none uppercase tracking-wider"
            />
            {field.templateId && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium
                text-node-investigation bg-node-investigation/10 shrink-0">
                template
              </span>
            )}
            <button
              onClick={() => handleRemove(i)}
              className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity cursor-pointer"
            >
              <X size={14} className="text-text-muted" />
            </button>
          </div>
          <TipTapEditor
            content={field.content.markdown}
            onUpdate={(text) => handleUpdateContent(i, text)}
            placeholder="Content..."
            className="min-h-[60px]"
          />
          <AttachmentGallery
            value={field.content}
            onChange={(content) => handleUpdateRichContent(i, content)}
          />
        </div>
      ))}

      <div className="relative">
        {showPicker ? (
          <AddFieldPicker
            templates={templates}
            onAddBlank={handleAddBlank}
            onAddFromTemplate={handleAddFromTemplate}
            onClose={() => setShowPicker(false)}
          />
        ) : (
          <button
            onClick={templates.length > 0 ? () => setShowPicker(true) : handleAddBlank}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary
              transition-colors cursor-pointer"
          >
            <Plus size={12} />
            Add custom field
          </button>
        )}
      </div>
    </div>
  )
}

function AddFieldPicker({
  templates,
  onAddBlank,
  onAddFromTemplate,
  onClose,
}: {
  templates: { id: string; label: string; icon: string }[]
  onAddBlank: () => void
  onAddFromTemplate: (id: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="glass-panel rounded-lg border border-border shadow-lg p-1 space-y-0.5"
    >
      <button
        onClick={onAddBlank}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs
          text-text-secondary hover:text-text-primary hover:bg-surface-glass
          transition-all cursor-pointer"
      >
        <Plus size={12} />
        Blank field
      </button>
      {templates.length > 0 && (
        <div className="h-px bg-border mx-1" />
      )}
      {templates.map((t) => (
        <button
          key={t.id}
          onClick={() => onAddFromTemplate(t.id)}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs
            text-text-secondary hover:text-text-primary hover:bg-surface-glass
            transition-all cursor-pointer"
        >
          <LayoutTemplate size={12} className="text-node-investigation" />
          {t.label}
        </button>
      ))}
    </div>
  )
}
