import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from '@/application/ui-store'
import { useGraphStore } from '@/application/graph-store'

describe('Overlay state machine (integration)', () => {
  beforeEach(() => {
    useUIStore.setState({
      activeOverlay: null,
      radialNodeId: null,
      theme: 'dark',
    })
    useGraphStore.getState().reset()
  })

  it('transitions: null → radial → field-panel → null', () => {
    const ui = useUIStore.getState()
    expect(useUIStore.getState().activeOverlay).toBeNull()
    expect(useUIStore.getState().radialNodeId).toBeNull()

    // Show radial subnodes
    ui.showRadialSubnodes('node-1')
    expect(useUIStore.getState().radialNodeId).toBe('node-1')
    expect(useUIStore.getState().activeOverlay).toBeNull()

    // Open field panel from radial
    ui.openFieldPanel('node-1', 'script')
    expect(useUIStore.getState().activeOverlay).toEqual({
      type: 'field-panel',
      nodeId: 'node-1',
      fieldKey: 'script',
    })

    // Close overlay
    ui.closeOverlay()
    expect(useUIStore.getState().activeOverlay).toBeNull()
  })

  it('transitions: null → cockpit → null', () => {
    const ui = useUIStore.getState()

    ui.openCockpit('node-2')
    expect(useUIStore.getState().activeOverlay).toEqual({
      type: 'cockpit',
      nodeId: 'node-2',
    })
    // Opening cockpit clears radial
    expect(useUIStore.getState().radialNodeId).toBeNull()

    ui.closeOverlay()
    expect(useUIStore.getState().activeOverlay).toBeNull()
  })

  it('toggling the same field panel closes it', () => {
    const ui = useUIStore.getState()

    ui.openFieldPanel('node-1', 'script')
    expect(useUIStore.getState().activeOverlay).not.toBeNull()

    // Opening the same field panel again should close it
    ui.openFieldPanel('node-1', 'script')
    expect(useUIStore.getState().activeOverlay).toBeNull()
  })

  it('switching to a different field replaces the overlay', () => {
    const ui = useUIStore.getState()

    ui.openFieldPanel('node-1', 'script')
    expect(useUIStore.getState().activeOverlay).toEqual({
      type: 'field-panel',
      nodeId: 'node-1',
      fieldKey: 'script',
    })

    // Open a different field — should replace, not close
    ui.openFieldPanel('node-1', 'dialogues')
    expect(useUIStore.getState().activeOverlay).toEqual({
      type: 'field-panel',
      nodeId: 'node-1',
      fieldKey: 'dialogues',
    })
  })

  it('pane click clears radial subnodes', () => {
    const ui = useUIStore.getState()

    ui.showRadialSubnodes('node-1')
    expect(useUIStore.getState().radialNodeId).toBe('node-1')

    // Simulating pane click: hide radials
    ui.hideRadialSubnodes()
    expect(useUIStore.getState().radialNodeId).toBeNull()
  })

  it('double-click (cockpit) clears any existing radial', () => {
    const ui = useUIStore.getState()

    ui.showRadialSubnodes('node-1')
    expect(useUIStore.getState().radialNodeId).toBe('node-1')

    ui.openCockpit('node-1')
    expect(useUIStore.getState().radialNodeId).toBeNull()
    expect(useUIStore.getState().activeOverlay?.type).toBe('cockpit')
  })

  it('theme toggles between light and dark', () => {
    const ui = useUIStore.getState()
    expect(useUIStore.getState().theme).toBe('dark')

    ui.toggleTheme()
    expect(useUIStore.getState().theme).toBe('light')

    ui.toggleTheme()
    expect(useUIStore.getState().theme).toBe('dark')
  })

  it('cockpit overlay stores the nodeId for the opened node', () => {
    // Create a real node in the graph store
    const nodeId = useGraphStore.getState().addNode('event', { x: 0, y: 0 }, 'Test')

    useUIStore.getState().openCockpit(nodeId)

    const overlay = useUIStore.getState().activeOverlay
    expect(overlay?.type).toBe('cockpit')
    if (overlay?.type === 'cockpit') {
      expect(overlay.nodeId).toBe(nodeId)
    }
  })
})
