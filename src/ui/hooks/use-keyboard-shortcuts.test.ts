import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from '@/application/ui-store'
import { useSessionStore } from '@/application/session-store'
import { useGraphStore } from '@/application/graph-store'
import { useHistoryStore } from '@/application/history-store'

// Test the keyboard shortcut logic directly against the store
// (the hook just dispatches to store actions)
describe('keyboard shortcut actions', () => {
  beforeEach(() => {
    useUIStore.setState({
      legendPanelOpen: false,
      searchPanelOpen: false,
      entitySidebarOpen: false,
    })
    useSessionStore.getState().reset()
    useGraphStore.getState().reset()
    useHistoryStore.getState().reset()
  })

  it('toggles legend panel (Ctrl+/)', () => {
    expect(useUIStore.getState().legendPanelOpen).toBe(false)
    useUIStore.getState().toggleLegendPanel()
    expect(useUIStore.getState().legendPanelOpen).toBe(true)
    useUIStore.getState().toggleLegendPanel()
    expect(useUIStore.getState().legendPanelOpen).toBe(false)
  })

  it('toggles search panel (Ctrl+F)', () => {
    expect(useUIStore.getState().searchPanelOpen).toBe(false)
    useUIStore.getState().toggleSearchPanel()
    expect(useUIStore.getState().searchPanelOpen).toBe(true)
    useUIStore.getState().toggleSearchPanel()
    expect(useUIStore.getState().searchPanelOpen).toBe(false)
  })

  it('toggles entity sidebar (Ctrl+E)', () => {
    expect(useUIStore.getState().entitySidebarOpen).toBe(false)
    useUIStore.getState().toggleEntitySidebar()
    expect(useUIStore.getState().entitySidebarOpen).toBe(true)
    useUIStore.getState().toggleEntitySidebar()
    expect(useUIStore.getState().entitySidebarOpen).toBe(false)
  })

  it('toggles session timeline (Ctrl+T)', () => {
    expect(useSessionStore.getState().sessionTimelineOpen).toBe(false)
    useSessionStore.getState().toggleSessionTimeline()
    expect(useSessionStore.getState().sessionTimelineOpen).toBe(true)
    useSessionStore.getState().toggleSessionTimeline()
    expect(useSessionStore.getState().sessionTimelineOpen).toBe(false)
  })

  it('toggles diff overlay (Ctrl+D)', () => {
    expect(useSessionStore.getState().diffOverlayActive).toBe(false)
    useSessionStore.getState().toggleDiffOverlay()
    expect(useSessionStore.getState().diffOverlayActive).toBe(true)
    useSessionStore.getState().toggleDiffOverlay()
    expect(useSessionStore.getState().diffOverlayActive).toBe(false)
  })

  it('copies selected nodes (Ctrl+C)', () => {
    const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
    useGraphStore.getState().selectNodes([id])
    useGraphStore.getState().copySelectedNodes()
    expect(useGraphStore.getState().clipboard).not.toBeNull()
    expect(useGraphStore.getState().clipboard!.nodes).toHaveLength(1)
  })

  it('cuts selected nodes (Ctrl+X)', () => {
    const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
    useGraphStore.getState().selectNodes([id])
    useGraphStore.getState().cutSelectedNodes()
    expect(useGraphStore.getState().clipboard).not.toBeNull()
    expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(0)
  })

  it('pastes clipboard (Ctrl+V)', () => {
    const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
    useGraphStore.getState().selectNodes([id])
    useGraphStore.getState().copySelectedNodes()
    useGraphStore.getState().pasteClipboard()
    expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(2)
  })

  it('deletes selected nodes (Delete)', () => {
    const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
    useGraphStore.getState().selectNodes([id])
    useGraphStore.getState().deleteSelectedNodes()
    expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(0)
  })

  it('undo restores previous state (Ctrl+Z)', () => {
    useGraphStore.getState().addNode('event', { x: 0, y: 0 })
    expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(1)
    useGraphStore.getState().undo()
    expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(0)
  })

  it('redo re-applies undone state (Ctrl+Shift+Z)', () => {
    useGraphStore.getState().addNode('event', { x: 0, y: 0 })
    useGraphStore.getState().undo()
    useGraphStore.getState().redo()
    expect(Object.keys(useGraphStore.getState().nodes)).toHaveLength(1)
  })

  it('select all nodes (Ctrl+A)', () => {
    useGraphStore.getState().addNode('event', { x: 0, y: 0 })
    useGraphStore.getState().addNode('narration', { x: 100, y: 0 })
    useGraphStore.getState().addNode('combat', { x: 200, y: 0 })

    const nodeIds = Object.keys(useGraphStore.getState().nodes)
    useGraphStore.getState().selectNodes(nodeIds)

    expect(useGraphStore.getState().selectedNodeIds.size).toBe(3)
  })

  describe('Escape priority chain', () => {
    it('closes active overlay first', () => {
      useUIStore.getState().openCockpit('node-1')
      expect(useUIStore.getState().activeOverlay).not.toBeNull()

      // Escape should close overlay
      useUIStore.getState().closeOverlay()
      expect(useUIStore.getState().activeOverlay).toBeNull()
    })

    it('hides radial subnodes when no overlay', () => {
      useUIStore.getState().showRadialSubnodes('node-1')
      expect(useUIStore.getState().radialNodeId).toBe('node-1')

      useUIStore.getState().hideRadialSubnodes()
      expect(useUIStore.getState().radialNodeId).toBeNull()
    })

    it('closes search panel when no overlay or radial', () => {
      useUIStore.getState().toggleSearchPanel()
      expect(useUIStore.getState().searchPanelOpen).toBe(true)

      useUIStore.getState().toggleSearchPanel()
      expect(useUIStore.getState().searchPanelOpen).toBe(false)
    })

    it('clears selection when nothing else is open', () => {
      const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      useGraphStore.getState().selectNodes([id])
      expect(useGraphStore.getState().selectedNodeIds.size).toBe(1)

      useGraphStore.getState().clearSelection()
      expect(useGraphStore.getState().selectedNodeIds.size).toBe(0)
    })

    it('follows correct priority: overlay > radial > panel > selection', () => {
      // Set up all states (cockpit set last since openCockpit clears radialNodeId)
      const id = useGraphStore.getState().addNode('event', { x: 0, y: 0 })
      useGraphStore.getState().selectNodes([id])
      useUIStore.getState().toggleSearchPanel()
      // Use setState directly to avoid openCockpit clearing radialNodeId
      useUIStore.setState({
        activeOverlay: { type: 'cockpit', nodeId: 'node-1' },
        radialNodeId: 'node-1',
        searchPanelOpen: true,
      })

      // Step 1: close overlay
      expect(useUIStore.getState().activeOverlay).not.toBeNull()
      useUIStore.getState().closeOverlay()
      expect(useUIStore.getState().activeOverlay).toBeNull()

      // Step 2: hide radial
      expect(useUIStore.getState().radialNodeId).toBe('node-1')
      useUIStore.getState().hideRadialSubnodes()
      expect(useUIStore.getState().radialNodeId).toBeNull()

      // Step 3: close search panel
      expect(useUIStore.getState().searchPanelOpen).toBe(true)
      useUIStore.getState().toggleSearchPanel()
      expect(useUIStore.getState().searchPanelOpen).toBe(false)

      // Step 4: clear selection
      expect(useGraphStore.getState().selectedNodeIds.size).toBe(1)
      useGraphStore.getState().clearSelection()
      expect(useGraphStore.getState().selectedNodeIds.size).toBe(0)
    })
  })

  describe('Ctrl+Shift+R → entity graph', () => {
    it('toggles entity relationship graph', () => {
      expect(useUIStore.getState().entityGraphOpen).toBe(false)
      useUIStore.getState().toggleEntityGraph()
      expect(useUIStore.getState().entityGraphOpen).toBe(true)
      useUIStore.getState().toggleEntityGraph()
      expect(useUIStore.getState().entityGraphOpen).toBe(false)
    })
  })
})
