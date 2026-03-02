import { useCallback } from 'react'
import { Plus, X } from 'lucide-react'
import type { CustomField } from '@/domain/types'
import { createEmptyRichContent } from '@/domain/graph-operations'

type CustomFieldEditorProps = {
  value: CustomField[]
  onChange: (value: CustomField[]) => void
}

export function CustomFieldEditor({ value, onChange }: CustomFieldEditorProps) {
  const handleAdd = useCallback(() => {
    onChange([...value, { label: '', content: createEmptyRichContent() }])
  }, [value, onChange])

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
            <button
              onClick={() => handleRemove(i)}
              className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity cursor-pointer"
            >
              <X size={14} className="text-text-muted" />
            </button>
          </div>
          <textarea
            value={field.content.markdown}
            onChange={(e) => handleUpdateContent(i, e.target.value)}
            placeholder="Content..."
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted
              outline-none resize-none min-h-[60px]"
          />
        </div>
      ))}
      <button
        onClick={handleAdd}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary
          transition-colors cursor-pointer"
      >
        <Plus size={12} />
        Add custom field
      </button>
    </div>
  )
}
