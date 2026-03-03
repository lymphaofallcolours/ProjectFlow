import { useEffect, useRef } from 'react'
import { useUIStore } from '@/application/ui-store'
import { autoSaveCampaignAction } from '@/application/campaign-actions'

export function useAutoSave() {
  const autoSaveEnabled = useUIStore((s) => s.autoSaveEnabled)
  const autoSaveIntervalMs = useUIStore((s) => s.autoSaveIntervalMs)
  const setAutoSaveStatus = useUIStore((s) => s.setAutoSaveStatus)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!autoSaveEnabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setAutoSaveStatus(null)
      return
    }

    async function doAutoSave() {
      setAutoSaveStatus('saving')
      const success = await autoSaveCampaignAction()
      if (success) {
        setAutoSaveStatus('saved')
        // Clear "saved" status after 3 seconds
        setTimeout(() => {
          useUIStore.getState().setAutoSaveStatus(null)
        }, 3000)
      } else {
        setAutoSaveStatus(null)
      }
    }

    intervalRef.current = setInterval(doAutoSave, autoSaveIntervalMs)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [autoSaveEnabled, autoSaveIntervalMs, setAutoSaveStatus])
}
