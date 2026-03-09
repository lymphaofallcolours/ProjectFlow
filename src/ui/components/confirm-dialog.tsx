import { useEffect, useRef } from 'react'

type ConfirmDialogProps = {
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter') onConfirm()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onConfirm, onCancel])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onCancel()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30">
      <div
        ref={ref}
        className="glass-panel rounded-xl p-4 min-w-[260px] max-w-[340px] shadow-xl"
      >
        <p className="text-sm text-text-primary mb-4" style={{ fontFamily: 'var(--font-display)' }}>
          {message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-xs text-text-secondary
              hover:text-text-primary hover:bg-surface-glass transition-colors cursor-pointer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 rounded-lg text-xs text-white
              bg-node-event/80 hover:bg-node-event transition-colors cursor-pointer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
