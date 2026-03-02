import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from '@/application/ui-store'
import { useSessionStore } from '@/application/session-store'

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
})
