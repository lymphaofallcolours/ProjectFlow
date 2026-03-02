import { create } from 'zustand'
import type { PlaythroughEntry, PlaythroughStatus } from '@/domain/types'
import {
  createPlaythroughEntry,
  addNodeVisit as addNodeVisitOp,
  removeNodeVisit as removeNodeVisitOp,
  updateSessionLabel as updateSessionLabelOp,
} from '@/domain/playthrough-operations'

type SessionState = {
  playthroughLog: PlaythroughEntry[]
  activeSessionId: string | null
  diffOverlayActive: boolean
  sessionTimelineOpen: boolean

  // Session lifecycle
  startSession: (label?: string) => string
  endSession: () => void
  deleteSession: (id: string) => void
  updateSessionLabel: (id: string, label: string) => void

  // Node visit tracking
  recordNodeVisit: (nodeId: string, status: PlaythroughStatus, notes?: string) => void
  removeNodeVisit: (nodeId: string) => void

  // Session selection
  selectSession: (id: string | null) => void
  getActiveSession: () => PlaythroughEntry | undefined
  getSelectedSession: () => PlaythroughEntry | undefined

  // Diff overlay
  toggleDiffOverlay: () => void
  setDiffOverlayActive: (active: boolean) => void

  // Timeline sidebar
  toggleSessionTimeline: () => void

  // Persistence
  loadPlaythroughLog: (log: PlaythroughEntry[]) => void
  reset: () => void
}

const initialState = {
  playthroughLog: [] as PlaythroughEntry[],
  activeSessionId: null as string | null,
  diffOverlayActive: false,
  sessionTimelineOpen: false,
}

export const useSessionStore = create<SessionState>((set, get) => ({
  ...initialState,

  startSession: (label) => {
    const entry = createPlaythroughEntry(label)
    set((state) => ({
      playthroughLog: [...state.playthroughLog, entry],
      activeSessionId: entry.id,
    }))
    return entry.id
  },

  endSession: () => {
    set({ activeSessionId: null })
  },

  deleteSession: (id) => {
    set((state) => ({
      playthroughLog: state.playthroughLog.filter((e) => e.id !== id),
      activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
    }))
  },

  updateSessionLabel: (id, label) => {
    set((state) => ({
      playthroughLog: state.playthroughLog.map((e) =>
        e.id === id ? updateSessionLabelOp(e, label) : e,
      ),
    }))
  },

  recordNodeVisit: (nodeId, status, notes) => {
    const { activeSessionId } = get()
    if (!activeSessionId) return
    set((state) => ({
      playthroughLog: state.playthroughLog.map((e) =>
        e.id === activeSessionId ? addNodeVisitOp(e, nodeId, status, notes) : e,
      ),
    }))
  },

  removeNodeVisit: (nodeId) => {
    const { activeSessionId } = get()
    if (!activeSessionId) return
    set((state) => ({
      playthroughLog: state.playthroughLog.map((e) =>
        e.id === activeSessionId ? removeNodeVisitOp(e, nodeId) : e,
      ),
    }))
  },

  selectSession: (id) => {
    set({ activeSessionId: id })
  },

  getActiveSession: () => {
    const { playthroughLog, activeSessionId } = get()
    return playthroughLog.find((e) => e.id === activeSessionId)
  },

  getSelectedSession: () => {
    const { playthroughLog, activeSessionId } = get()
    return playthroughLog.find((e) => e.id === activeSessionId)
  },

  toggleDiffOverlay: () => {
    set((state) => ({ diffOverlayActive: !state.diffOverlayActive }))
  },

  setDiffOverlayActive: (active) => {
    set({ diffOverlayActive: active })
  },

  toggleSessionTimeline: () => {
    set((state) => ({ sessionTimelineOpen: !state.sessionTimelineOpen }))
  },

  loadPlaythroughLog: (log) => {
    set({ playthroughLog: log })
  },

  reset: () => set(initialState),
}))
