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

  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  openFieldPanel: (nodeId: string, fieldKey: FieldKey) => void
  openCockpit: (nodeId: string) => void
  closeOverlay: () => void
  showRadialSubnodes: (nodeId: string) => void
  hideRadialSubnodes: () => void
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: 'dark',
  activeOverlay: null,
  radialNodeId: null,

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
}))
