import { useEffect } from 'react'
import { useUIStore } from '@/application/ui-store'
import { useSessionStore } from '@/application/session-store'
import { useGraphStore } from '@/application/graph-store'
import { saveCampaignAction } from '@/application/campaign-actions'

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

      // Ctrl+S → save campaign
      if (ctrl && e.key === 's') {
        e.preventDefault()
        saveCampaignAction()
        return
      }

      // Ctrl+A → select all nodes
      if (ctrl && e.key === 'a') {
        e.preventDefault()
        const nodeIds = Object.keys(useGraphStore.getState().nodes)
        useGraphStore.getState().selectNodes(nodeIds)
        return
      }

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

      // Ctrl+Z → undo
      if (ctrl && !e.shiftKey && e.key === 'z') {
        e.preventDefault()
        useGraphStore.getState().undo()
        return
      }

      // Ctrl+Shift+Z → redo
      if (ctrl && e.shiftKey && e.key === 'Z') {
        e.preventDefault()
        useGraphStore.getState().redo()
        return
      }

      // Ctrl+Shift+R → toggle entity relationship graph
      if (ctrl && e.shiftKey && e.key === 'R') {
        e.preventDefault()
        useUIStore.getState().toggleEntityGraph()
        return
      }

      // Shift (alone) → toggle radial subnodes for selected node
      if (e.key === 'Shift' && !ctrl && !e.altKey) {
        const graph = useGraphStore.getState()
        const ui = useUIStore.getState()
        const selectedIds = Array.from(graph.selectedNodeIds)
        if (selectedIds.length === 1) {
          e.preventDefault()
          if (ui.radialNodeId === selectedIds[0]) {
            ui.hideRadialSubnodes()
          } else {
            ui.showRadialSubnodes(selectedIds[0])
          }
        }
        return
      }

      // Escape → priority chain dismissal
      if (e.key === 'Escape') {
        e.preventDefault()
        const ui = useUIStore.getState()
        const session = useSessionStore.getState()
        const graph = useGraphStore.getState()

        // 1. Close active overlay (field panel or cockpit)
        if (ui.activeOverlay) {
          ui.closeOverlay()
          return
        }
        // 2. Hide radial subnodes
        if (ui.radialNodeId) {
          ui.hideRadialSubnodes()
          return
        }
        // 3. Close entity graph or dashboard
        if (ui.entityGraphOpen) {
          ui.toggleEntityGraph()
          return
        }
        if (ui.dashboardOpen) {
          ui.toggleDashboard()
          return
        }
        if (ui.graphTemplatePanelOpen) {
          ui.toggleGraphTemplatePanel()
          return
        }
        // 4. Close panels (search, entity sidebar, legend, timeline)
        if (ui.searchPanelOpen) {
          ui.toggleSearchPanel()
          return
        }
        if (ui.entitySidebarOpen) {
          ui.toggleEntitySidebar()
          return
        }
        if (ui.legendPanelOpen) {
          ui.toggleLegendPanel()
          return
        }
        if (session.sessionTimelineOpen) {
          session.toggleSessionTimeline()
          return
        }
        // 4. Clear selection
        if (graph.selectedNodeIds.size > 0) {
          graph.clearSelection()
          return
        }
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
