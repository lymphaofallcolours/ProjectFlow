import { useCallback } from 'react'
import { Plus, X } from 'lucide-react'
import type { DiceRollEntry } from '@/domain/types'

type DiceRollListEditorProps = {
  value: DiceRollEntry[]
  onChange: (value: DiceRollEntry[]) => void
}

export function DiceRollListEditor({ value, onChange }: DiceRollListEditorProps) {
  const handleAdd = useCallback(() => {
    onChange([...value, { description: '' }])
  }, [value, onChange])

  const handleRemove = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index))
    },
    [value, onChange],
  )

  const handleUpdate = useCallback(
    (index: number, field: keyof DiceRollEntry, text: string) => {
      const updated = value.map((roll, i) =>
        i === index ? { ...roll, [field]: text } : roll,
      )
      onChange(updated)
    },
    [value, onChange],
  )

  return (
    <div className="space-y-2">
      {value.map((roll, i) => (
        <div key={i} className="flex gap-2 items-start group">
          <div className="flex-1 space-y-1">
            <input
              value={roll.description}
              onChange={(e) => handleUpdate(i, 'description', e.target.value)}
              placeholder="Description"
              className="w-full bg-transparent text-sm text-text-primary
                placeholder:text-text-muted outline-none"
            />
            <input
              value={roll.formula ?? ''}
              onChange={(e) => handleUpdate(i, 'formula', e.target.value)}
              placeholder="Formula (e.g. 1d100 vs 45)"
              className="w-full bg-transparent text-xs text-text-secondary
                placeholder:text-text-muted outline-none"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
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
        Add roll
      </button>
    </div>
  )
}
