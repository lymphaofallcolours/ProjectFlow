import { useCallback } from 'react'
import { Plus, X } from 'lucide-react'
import type { SoundtrackCue } from '@/domain/types'

type SoundtrackListEditorProps = {
  value: SoundtrackCue[]
  onChange: (value: SoundtrackCue[]) => void
}

export function SoundtrackListEditor({ value, onChange }: SoundtrackListEditorProps) {
  const handleAdd = useCallback(() => {
    onChange([...value, { trackName: '' }])
  }, [value, onChange])

  const handleRemove = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index))
    },
    [value, onChange],
  )

  const handleUpdate = useCallback(
    (index: number, field: keyof SoundtrackCue, text: string) => {
      const updated = value.map((cue, i) =>
        i === index ? { ...cue, [field]: text } : cue,
      )
      onChange(updated)
    },
    [value, onChange],
  )

  return (
    <div className="space-y-2">
      {value.map((cue, i) => (
        <div key={i} className="flex gap-2 items-start group">
          <div className="flex-1 space-y-1">
            <input
              value={cue.trackName}
              onChange={(e) => handleUpdate(i, 'trackName', e.target.value)}
              placeholder="Track name"
              className="w-full bg-transparent text-sm text-text-primary
                placeholder:text-text-muted outline-none"
            />
            <input
              value={cue.note ?? ''}
              onChange={(e) => handleUpdate(i, 'note', e.target.value)}
              placeholder="Note (optional)"
              className="w-full bg-transparent text-xs text-text-secondary
                placeholder:text-text-muted outline-none"
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
        Add track
      </button>
    </div>
  )
}
