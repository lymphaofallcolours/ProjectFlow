import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from '@/application/ui-store'
import { useSessionStore } from '@/application/session-store'
import { useGraphStore } from '@/application/graph-store'

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
})
