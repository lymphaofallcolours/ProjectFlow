import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from './ui-store'

beforeEach(() => {
  useUIStore.setState({
    theme: 'dark',
    activeOverlay: null,
    radialNodeId: null,
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
})
