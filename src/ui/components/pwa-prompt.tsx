import { useState, useEffect, useCallback } from 'react'
import { Download, X } from 'lucide-react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'projectflow-pwa-dismissed'

export function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem(DISMISS_KEY) === 'true',
  )

  useEffect(() => {
    function handleBeforeInstall(e: Event) {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  const handleInstall = useCallback(async () => {
    if (!installEvent) return
    await installEvent.prompt()
    const { outcome } = await installEvent.userChoice
    if (outcome === 'accepted') {
      setInstallEvent(null)
    }
  }, [installEvent])

  const handleDismiss = useCallback(() => {
    setDismissed(true)
    localStorage.setItem(DISMISS_KEY, 'true')
  }, [])

  if (!installEvent || dismissed) return null

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 glass-panel rounded-xl
        border border-border shadow-2xl px-4 py-3 flex items-center gap-3 max-w-sm"
    >
      <Download size={18} className="text-node-event shrink-0" />
      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-semibold text-text-primary"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Install ProjectFlow
        </p>
        <p className="text-[10px] text-text-muted mt-0.5">
          Use offline as a standalone app.
        </p>
      </div>
      <button
        onClick={handleInstall}
        className="px-3 py-1.5 rounded-lg text-xs font-medium
          text-node-event bg-node-event/10 hover:bg-node-event/15
          transition-all cursor-pointer shrink-0"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Install
      </button>
      <button
        onClick={handleDismiss}
        className="p-1 rounded-md text-text-muted hover:text-text-primary
          hover:bg-surface-glass transition-all cursor-pointer"
      >
        <X size={14} />
      </button>
    </div>
  )
}
