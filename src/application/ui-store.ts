import { create } from 'zustand'
import type { FieldKey } from '@/domain/types'

type FieldPanelOverlay = {
  type: 'field-panel'
  nodeId: string
  fieldKey: FieldKey
}

type CockpitOverlay = {
  type: 'cockpit'
  nodeId: string
}

export type OverlayState = FieldPanelOverlay | CockpitOverlay

type UIState = {
  theme: 'light' | 'dark'
  activeOverlay: OverlayState | null
  radialNodeId: string | null

  // Entity sidebar
  entitySidebarOpen: boolean
  selectedEntityId: string | null

  // Legend panel
  legendPanelOpen: boolean

  // Search panel
  searchPanelOpen: boolean
  entityHighlightFilter: { entityName: string; entityType?: string } | null

  // Template manager
  templateManagerOpen: boolean

  // Entity relationship graph
  entityGraphOpen: boolean

  // Graph structure templates
  graphTemplatePanelOpen: boolean

  // Campaign dashboard
  dashboardOpen: boolean

  // Canvas background
  canvasBackground: 'none' | 'dots' | 'grid'

  // Snap-to-grid
  snapToGrid: boolean

  // Layout animation
  isLayoutAnimating: boolean

  // Auto-save
  autoSaveEnabled: boolean
  autoSaveIntervalMs: number
  autoSaveStatus: 'saving' | 'saved' | null

  // Toolbar
  toolbarDropdownOpen: boolean

  // Peripheral view
  peripheralViewEnabled: boolean
  peripheralEditingField: FieldKey | null

  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  openFieldPanel: (nodeId: string, fieldKey: FieldKey) => void
  openCockpit: (nodeId: string) => void
  closeOverlay: () => void
  showRadialSubnodes: (nodeId: string) => void
  hideRadialSubnodes: () => void
  toggleEntitySidebar: () => void
  openEntitySidebar: () => void
  selectEntity: (id: string | null) => void
  toggleLegendPanel: () => void
  toggleSearchPanel: () => void
  setEntityHighlightFilter: (filter: { entityName: string; entityType?: string } | null) => void
  toggleTemplateManager: () => void
  toggleEntityGraph: () => void
  toggleGraphTemplatePanel: () => void
  toggleDashboard: () => void
  cycleCanvasBackground: () => void
  toggleSnapToGrid: () => void
  startLayoutAnimation: () => void
  toggleAutoSave: () => void
  setAutoSaveIntervalMs: (ms: number) => void
  setAutoSaveStatus: (status: 'saving' | 'saved' | null) => void
  setToolbarDropdownOpen: (open: boolean) => void
  togglePeripheralView: () => void
  setPeripheralEditingField: (fieldKey: FieldKey | null) => void
}

const closedPanels = {
  searchPanelOpen: false,
  templateManagerOpen: false,
  graphTemplatePanelOpen: false,
  dashboardOpen: false,
  entitySidebarOpen: false,
  legendPanelOpen: false,
  entityGraphOpen: false,
} as const

export const useUIStore = create<UIState>((set, get) => ({
  theme: 'dark',
  activeOverlay: null,
  radialNodeId: null,
  entitySidebarOpen: false,
  selectedEntityId: null,
  legendPanelOpen: false,
  searchPanelOpen: false,
  entityHighlightFilter: null,
  templateManagerOpen: false,
  entityGraphOpen: false,
  graphTemplatePanelOpen: false,
  dashboardOpen: false,
  canvasBackground: 'dots' as const,
  snapToGrid: false,
  isLayoutAnimating: false,
  autoSaveEnabled: false,
  autoSaveIntervalMs: 60_000,
  autoSaveStatus: null,
  toolbarDropdownOpen: false,
  peripheralViewEnabled: false,
  peripheralEditingField: null,

  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

  openFieldPanel: (nodeId, fieldKey) => {
    const current = get().activeOverlay
    if (
      current?.type === 'field-panel' &&
      current.nodeId === nodeId &&
      current.fieldKey === fieldKey
    ) {
      set({ activeOverlay: null })
      return
    }
    set({ activeOverlay: { type: 'field-panel', nodeId, fieldKey } })
  },

  openCockpit: (nodeId) => {
    set({ activeOverlay: { type: 'cockpit', nodeId }, radialNodeId: null })
  },

  closeOverlay: () => set({ activeOverlay: null }),

  showRadialSubnodes: (nodeId) => set({ radialNodeId: nodeId }),
  hideRadialSubnodes: () => set({ radialNodeId: null }),

  toggleEntitySidebar: () =>
    set((state) =>
      state.entitySidebarOpen
        ? { entitySidebarOpen: false, selectedEntityId: null }
        : { ...closedPanels, entitySidebarOpen: true },
    ),

  openEntitySidebar: () => set({ ...closedPanels, entitySidebarOpen: true }),

  selectEntity: (id) => set({ selectedEntityId: id }),

  toggleLegendPanel: () =>
    set((state) =>
      state.legendPanelOpen
        ? { legendPanelOpen: false }
        : { ...closedPanels, legendPanelOpen: true },
    ),

  toggleSearchPanel: () =>
    set((state) =>
      state.searchPanelOpen
        ? { searchPanelOpen: false }
        : { ...closedPanels, searchPanelOpen: true },
    ),

  setEntityHighlightFilter: (filter) => set({ entityHighlightFilter: filter }),

  toggleTemplateManager: () =>
    set((state) =>
      state.templateManagerOpen
        ? { templateManagerOpen: false }
        : { ...closedPanels, templateManagerOpen: true },
    ),

  toggleEntityGraph: () =>
    set((state) =>
      state.entityGraphOpen
        ? { entityGraphOpen: false }
        : { ...closedPanels, entityGraphOpen: true },
    ),

  toggleGraphTemplatePanel: () =>
    set((state) =>
      state.graphTemplatePanelOpen
        ? { graphTemplatePanelOpen: false }
        : { ...closedPanels, graphTemplatePanelOpen: true },
    ),

  toggleDashboard: () =>
    set((state) =>
      state.dashboardOpen
        ? { dashboardOpen: false }
        : { ...closedPanels, dashboardOpen: true },
    ),

  cycleCanvasBackground: () =>
    set((state) => {
      const order: Array<'dots' | 'grid' | 'none'> = ['dots', 'grid', 'none']
      const idx = order.indexOf(state.canvasBackground)
      return { canvasBackground: order[(idx + 1) % order.length] }
    }),

  toggleSnapToGrid: () =>
    set((state) => ({ snapToGrid: !state.snapToGrid })),

  startLayoutAnimation: () => {
    set({ isLayoutAnimating: true })
    setTimeout(() => set({ isLayoutAnimating: false }), 300)
  },

  toggleAutoSave: () =>
    set((state) => ({ autoSaveEnabled: !state.autoSaveEnabled })),

  setAutoSaveIntervalMs: (ms) => set({ autoSaveIntervalMs: ms }),

  setAutoSaveStatus: (status) => set({ autoSaveStatus: status }),

  setToolbarDropdownOpen: (open) => {
    if (open) {
      set({ toolbarDropdownOpen: true, ...closedPanels })
    } else {
      set({ toolbarDropdownOpen: false })
    }
  },

  togglePeripheralView: () =>
    set((state) => ({
      peripheralViewEnabled: !state.peripheralViewEnabled,
      peripheralEditingField: state.peripheralViewEnabled ? null : state.peripheralEditingField,
    })),

  setPeripheralEditingField: (fieldKey) => set({ peripheralEditingField: fieldKey }),
}))
