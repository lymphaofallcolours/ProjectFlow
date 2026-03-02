import { useCallback, useEffect, useRef, useState } from 'react'

type PlaythroughNotesInputProps = {
  onConfirm: (notes: string) => void
  onCancel: () => void
  initialValue?: string
}

export function PlaythroughNotesInput({
  onConfirm,
  onCancel,
  initialValue = '',
}: PlaythroughNotesInputProps) {
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.stopPropagation()
      if (e.key === 'Enter' && value.trim()) {
        onConfirm(value.trim())
      } else if (e.key === 'Escape') {
        onCancel()
      }
    },
    [value, onConfirm, onCancel],
  )

  return (
    <div className="px-2 py-1.5">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What changed?"
        className="w-full px-2 py-1 rounded-md text-xs bg-surface-glass border border-border
          text-text-primary placeholder:text-text-muted outline-none focus:border-status-modified"
        style={{ fontFamily: 'var(--font-body)' }}
      />
      <div className="flex justify-end gap-1 mt-1">
        <button
          onClick={onCancel}
          className="text-[10px] text-text-muted hover:text-text-secondary px-1.5 py-0.5 rounded cursor-pointer"
        >
          Esc
        </button>
        <button
          onClick={() => value.trim() && onConfirm(value.trim())}
          className="text-[10px] text-status-modified hover:text-text-primary px-1.5 py-0.5 rounded cursor-pointer"
        >
          Enter ↵
        </button>
      </div>
    </div>
  )
}
