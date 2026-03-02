import { useCallback, useEffect, useRef, useState } from 'react'

type EdgeLabelInputProps = {
  onConfirm: (label: string) => void
  onCancel: () => void
  onClear: () => void
  initialValue?: string
  placeholder?: string
}

export function EdgeLabelInput({
  onConfirm,
  onCancel,
  onClear,
  initialValue = '',
  placeholder = 'Edge label...',
}: EdgeLabelInputProps) {
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.stopPropagation()
      if (e.key === 'Enter') {
        if (value.trim()) {
          onConfirm(value.trim())
        } else {
          onClear()
        }
      } else if (e.key === 'Escape') {
        onCancel()
      }
    },
    [value, onConfirm, onCancel, onClear],
  )

  return (
    <div className="px-2 py-1.5">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-2 py-1 rounded-md text-xs bg-surface-glass border border-border
          text-text-primary placeholder:text-text-muted outline-none focus:border-node-event"
        style={{ fontFamily: 'var(--font-body)' }}
      />
      <div className="flex justify-end gap-1 mt-1">
        {initialValue && (
          <button
            onClick={onClear}
            className="text-[10px] text-status-skipped hover:text-text-secondary px-1.5 py-0.5 rounded cursor-pointer"
          >
            Clear
          </button>
        )}
        <button
          onClick={onCancel}
          className="text-[10px] text-text-muted hover:text-text-secondary px-1.5 py-0.5 rounded cursor-pointer"
        >
          Esc
        </button>
        <button
          onClick={() => value.trim() ? onConfirm(value.trim()) : onClear()}
          className="text-[10px] text-node-event hover:text-text-primary px-1.5 py-0.5 rounded cursor-pointer"
        >
          Enter ↵
        </button>
      </div>
    </div>
  )
}
