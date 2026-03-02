import { useEffect } from 'react'
import { useUIStore } from '@/application/ui-store'

export function useKeyboardShortcuts() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept when typing in input/textarea/contenteditable
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      const ctrl = e.ctrlKey || e.metaKey

      // Ctrl+/ → toggle legend
      if (ctrl && e.key === '/') {
        e.preventDefault()
        useUIStore.getState().toggleLegendPanel()
        return
      }

      // Ctrl+F → toggle search (prevent browser default)
      if (ctrl && e.key === 'f') {
        e.preventDefault()
        useUIStore.getState().toggleSearchPanel()
        return
      }

      // Ctrl+E → toggle entity sidebar
      if (ctrl && e.key === 'e') {
        e.preventDefault()
        useUIStore.getState().toggleEntitySidebar()
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
}
