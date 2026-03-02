import { useEffect } from 'react'
import { useUIStore } from '@/application/ui-store'
import { useSessionStore } from '@/application/session-store'
import { useGraphStore } from '@/application/graph-store'

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

      // Ctrl+T → toggle session timeline
      if (ctrl && e.key === 't') {
        e.preventDefault()
        useSessionStore.getState().toggleSessionTimeline()
        return
      }

      // Ctrl+D → toggle diff overlay
      if (ctrl && e.key === 'd') {
        e.preventDefault()
        useSessionStore.getState().toggleDiffOverlay()
        return
      }

      // Ctrl+C → copy selected nodes
      if (ctrl && e.key === 'c') {
        e.preventDefault()
        useGraphStore.getState().copySelectedNodes()
        return
      }

      // Ctrl+X → cut selected nodes
      if (ctrl && e.key === 'x') {
        e.preventDefault()
        useGraphStore.getState().cutSelectedNodes()
        return
      }

      // Ctrl+V → paste clipboard
      if (ctrl && e.key === 'v') {
        e.preventDefault()
        useGraphStore.getState().pasteClipboard()
        return
      }

      // Ctrl+Z → undo (will be wired in Commit 5)
      if (ctrl && !e.shiftKey && e.key === 'z') {
        e.preventDefault()
        return
      }

      // Ctrl+Shift+Z → redo (will be wired in Commit 5)
      if (ctrl && e.shiftKey && e.key === 'Z') {
        e.preventDefault()
        return
      }

      // Delete / Backspace → delete selected nodes
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        useGraphStore.getState().deleteSelectedNodes()
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
}
