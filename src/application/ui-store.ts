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

  // Campaign dashboard
  dashboardOpen: boolean

  // Auto-save
  autoSaveEnabled: boolean
  autoSaveIntervalMs: number
  autoSaveStatus: 'saving' | 'saved' | null

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
  toggleDashboard: () => void
  toggleAutoSave: () => void
  setAutoSaveIntervalMs: (ms: number) => void
  setAutoSaveStatus: (status: 'saving' | 'saved' | null) => void
}

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
  dashboardOpen: false,
  autoSaveEnabled: false,
  autoSaveIntervalMs: 60_000,
  autoSaveStatus: null,

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
    set((state) => ({
      entitySidebarOpen: !state.entitySidebarOpen,
      selectedEntityId: state.entitySidebarOpen ? null : state.selectedEntityId,
    })),

  openEntitySidebar: () => set({ entitySidebarOpen: true }),

  selectEntity: (id) => set({ selectedEntityId: id }),

  toggleLegendPanel: () =>
    set((state) => ({ legendPanelOpen: !state.legendPanelOpen })),

  toggleSearchPanel: () =>
    set((state) => ({ searchPanelOpen: !state.searchPanelOpen })),

  setEntityHighlightFilter: (filter) => set({ entityHighlightFilter: filter }),

  toggleTemplateManager: () =>
    set((state) => ({ templateManagerOpen: !state.templateManagerOpen })),

  toggleEntityGraph: () =>
    set((state) => ({ entityGraphOpen: !state.entityGraphOpen })),

  toggleDashboard: () =>
    set((state) => ({ dashboardOpen: !state.dashboardOpen })),

  toggleAutoSave: () =>
    set((state) => ({ autoSaveEnabled: !state.autoSaveEnabled })),

  setAutoSaveIntervalMs: (ms) => set({ autoSaveIntervalMs: ms }),

  setAutoSaveStatus: (status) => set({ autoSaveStatus: status }),
}))
