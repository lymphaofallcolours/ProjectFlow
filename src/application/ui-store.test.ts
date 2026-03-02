import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from './ui-store'

beforeEach(() => {
  useUIStore.setState({
    theme: 'dark',
    activeOverlay: null,
    radialNodeId: null,
    entitySidebarOpen: false,
    selectedEntityId: null,
    legendPanelOpen: false,
    searchPanelOpen: false,
    entityHighlightFilter: null,
  })
})

describe('useUIStore', () => {
  describe('theme', () => {
    it('toggles between dark and light', () => {
      expect(useUIStore.getState().theme).toBe('dark')
      useUIStore.getState().toggleTheme()
      expect(useUIStore.getState().theme).toBe('light')
      useUIStore.getState().toggleTheme()
      expect(useUIStore.getState().theme).toBe('dark')
    })

    it('sets theme directly', () => {
      useUIStore.getState().setTheme('light')
      expect(useUIStore.getState().theme).toBe('light')
    })
  })

  describe('openFieldPanel', () => {
    it('sets field-panel overlay', () => {
      useUIStore.getState().openFieldPanel('node-1', 'script')
      const overlay = useUIStore.getState().activeOverlay
      expect(overlay).toEqual({ type: 'field-panel', nodeId: 'node-1', fieldKey: 'script' })
    })

    it('closes when clicking the same subnode again', () => {
      useUIStore.getState().openFieldPanel('node-1', 'script')
      useUIStore.getState().openFieldPanel('node-1', 'script')
      expect(useUIStore.getState().activeOverlay).toBeNull()
    })

    it('swaps to different field on same node', () => {
      useUIStore.getState().openFieldPanel('node-1', 'script')
      useUIStore.getState().openFieldPanel('node-1', 'combat')
      const overlay = useUIStore.getState().activeOverlay
      expect(overlay).toEqual({ type: 'field-panel', nodeId: 'node-1', fieldKey: 'combat' })
    })
  })

  describe('openCockpit', () => {
    it('sets cockpit overlay', () => {
      useUIStore.getState().openCockpit('node-1')
      expect(useUIStore.getState().activeOverlay).toEqual({ type: 'cockpit', nodeId: 'node-1' })
    })

    it('clears radial subnodes when opening cockpit', () => {
      useUIStore.getState().showRadialSubnodes('node-1')
      useUIStore.getState().openCockpit('node-1')
      expect(useUIStore.getState().radialNodeId).toBeNull()
    })
  })

  describe('closeOverlay', () => {
    it('clears the active overlay', () => {
      useUIStore.getState().openCockpit('node-1')
      useUIStore.getState().closeOverlay()
      expect(useUIStore.getState().activeOverlay).toBeNull()
    })
  })

  describe('radial subnodes', () => {
    it('shows radial subnodes for a node', () => {
      useUIStore.getState().showRadialSubnodes('node-1')
      expect(useUIStore.getState().radialNodeId).toBe('node-1')
    })

    it('hides radial subnodes', () => {
      useUIStore.getState().showRadialSubnodes('node-1')
      useUIStore.getState().hideRadialSubnodes()
      expect(useUIStore.getState().radialNodeId).toBeNull()
    })
  })

  describe('entity sidebar', () => {
    it('toggles entity sidebar open/closed', () => {
      expect(useUIStore.getState().entitySidebarOpen).toBe(false)
      useUIStore.getState().toggleEntitySidebar()
      expect(useUIStore.getState().entitySidebarOpen).toBe(true)
      useUIStore.getState().toggleEntitySidebar()
      expect(useUIStore.getState().entitySidebarOpen).toBe(false)
    })

    it('clears selected entity when closing sidebar', () => {
      useUIStore.getState().toggleEntitySidebar()
      useUIStore.getState().selectEntity('e1')
      useUIStore.getState().toggleEntitySidebar()
      expect(useUIStore.getState().selectedEntityId).toBeNull()
    })

    it('selects an entity', () => {
      useUIStore.getState().selectEntity('entity-123')
      expect(useUIStore.getState().selectedEntityId).toBe('entity-123')
    })

    it('deselects an entity', () => {
      useUIStore.getState().selectEntity('entity-123')
      useUIStore.getState().selectEntity(null)
      expect(useUIStore.getState().selectedEntityId).toBeNull()
    })
  })

  describe('legend panel', () => {
    it('toggles legend panel', () => {
      expect(useUIStore.getState().legendPanelOpen).toBe(false)
      useUIStore.getState().toggleLegendPanel()
      expect(useUIStore.getState().legendPanelOpen).toBe(true)
      useUIStore.getState().toggleLegendPanel()
      expect(useUIStore.getState().legendPanelOpen).toBe(false)
    })
  })

  describe('search panel', () => {
    it('toggles search panel', () => {
      expect(useUIStore.getState().searchPanelOpen).toBe(false)
      useUIStore.getState().toggleSearchPanel()
      expect(useUIStore.getState().searchPanelOpen).toBe(true)
    })

    it('sets entity highlight filter', () => {
      useUIStore.getState().setEntityHighlightFilter({ entityName: 'Alfa' })
      expect(useUIStore.getState().entityHighlightFilter).toEqual({ entityName: 'Alfa' })
    })

    it('clears entity highlight filter', () => {
      useUIStore.getState().setEntityHighlightFilter({ entityName: 'Alfa' })
      useUIStore.getState().setEntityHighlightFilter(null)
      expect(useUIStore.getState().entityHighlightFilter).toBeNull()
    })
  })
})
