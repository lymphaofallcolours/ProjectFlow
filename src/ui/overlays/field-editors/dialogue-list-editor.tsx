import { useCallback } from 'react'
import { Plus, X } from 'lucide-react'
import type { DialogueEntry } from '@/domain/types'

type DialogueListEditorProps = {
  value: DialogueEntry[]
  onChange: (value: DialogueEntry[]) => void
}

export function DialogueListEditor({ value, onChange }: DialogueListEditorProps) {
  const handleAdd = useCallback(() => {
    onChange([...value, { entityRef: '', line: '' }])
  }, [value, onChange])

  const handleRemove = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index))
    },
    [value, onChange],
  )

  const handleUpdate = useCallback(
    (index: number, field: keyof DialogueEntry, text: string) => {
      const updated = value.map((entry, i) =>
        i === index ? { ...entry, [field]: text } : entry,
      )
      onChange(updated)
    },
    [value, onChange],
  )

  return (
    <div className="space-y-2">
      {value.map((entry, i) => (
        <div key={i} className="flex gap-2 items-start group">
          <input
            value={entry.entityRef}
            onChange={(e) => handleUpdate(i, 'entityRef', e.target.value)}
            placeholder="!@NPC"
            className="w-20 shrink-0 bg-transparent border-b border-border text-xs text-text-secondary
              placeholder:text-text-muted outline-none py-1"
            style={{ fontFamily: 'var(--font-mono)' }}
          />
          <textarea
            value={entry.line}
            onChange={(e) => handleUpdate(i, 'line', e.target.value)}
            placeholder="Dialogue line..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted
              outline-none resize-none py-1 min-h-[24px]"
          />
          <button
            onClick={() => handleRemove(i)}
            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity mt-1 cursor-pointer"
          >
            <X size={14} className="text-text-muted" />
          </button>
        </div>
      ))}
      <button
        onClick={handleAdd}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary
          transition-colors cursor-pointer"
      >
        <Plus size={12} />
        Add line
      </button>
    </div>
  )
}
