import { useEffect } from 'react'
import { useUIStore } from '@/application/ui-store'
import { getStoredTheme, applyTheme } from '@/infrastructure/theme'

export function ThemeInitializer() {
  const setTheme = useUIStore((s) => s.setTheme)

  useEffect(() => {
    const stored = getStoredTheme()
    setTheme(stored)
    applyTheme(stored)
  }, [setTheme])

  return null
}
