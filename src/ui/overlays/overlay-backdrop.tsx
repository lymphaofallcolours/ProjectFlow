import { useEscapeKey } from '@/ui/hooks/use-escape-key'

type OverlayBackdropProps = {
  onDismiss: () => void
  children: React.ReactNode
}

export function OverlayBackdrop({ onDismiss, children }: OverlayBackdropProps) {
  useEscapeKey(onDismiss)

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onDismiss}>
      {/* Blurred backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: 'var(--color-surface-overlay)',
          backdropFilter: 'blur(12px) saturate(150%)',
          WebkitBackdropFilter: 'blur(12px) saturate(150%)',
        }}
      />
      {/* Content — stops click propagation so clicking the panel doesn't dismiss */}
      <div className="relative z-10 w-full h-full" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
