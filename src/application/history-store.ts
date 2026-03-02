// History state management — tracks undo/redo snapshots
// Pure data store: no imports from graph-store (graph-store imports us)
import { create } from 'zustand'
import type { HistorySnapshot } from '@/domain/history-operations'
import { MAX_HISTORY_SIZE } from '@/domain/history-operations'

type HistoryState = {
  past: HistorySnapshot[]
  future: HistorySnapshot[]

  pushSnapshot: (snapshot: HistorySnapshot) => void
  popUndo: (current: HistorySnapshot) => HistorySnapshot | null
  popRedo: (current: HistorySnapshot) => HistorySnapshot | null
  canUndo: () => boolean
  canRedo: () => boolean
  clear: () => void
  reset: () => void
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],

  pushSnapshot: (snapshot) => {
    set((state) => ({
      past: [...state.past, snapshot].slice(-MAX_HISTORY_SIZE),
      future: [],
    }))
  },

  popUndo: (current) => {
    const { past } = get()
    if (past.length === 0) return null
    const snapshot = past[past.length - 1]
    set((state) => ({
      past: past.slice(0, -1),
      future: [...state.future, current],
    }))
    return snapshot
  },

  popRedo: (current) => {
    const { future } = get()
    if (future.length === 0) return null
    const snapshot = future[future.length - 1]
    set((state) => ({
      future: future.slice(0, -1),
      past: [...state.past, current],
    }))
    return snapshot
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  clear: () => set({ past: [], future: [] }),
  reset: () => set({ past: [], future: [] }),
}))
