import { describe, it, expect, beforeEach } from 'vitest'
import { useSessionStore } from './session-store'

describe('useSessionStore', () => {
  beforeEach(() => {
    useSessionStore.getState().reset()
  })

  describe('startSession', () => {
    it('creates a session and sets it as active', () => {
      const id = useSessionStore.getState().startSession('Session 1')
      const state = useSessionStore.getState()
      expect(state.activeSessionId).toBe(id)
      expect(state.playthroughLog).toHaveLength(1)
      expect(state.playthroughLog[0].sessionLabel).toBe('Session 1')
    })

    it('creates a session without label', () => {
      const id = useSessionStore.getState().startSession()
      const session = useSessionStore.getState().playthroughLog.find((e) => e.id === id)
      expect(session).toBeDefined()
      expect(session?.sessionLabel).toBeUndefined()
    })

    it('generates a unique id', () => {
      const id1 = useSessionStore.getState().startSession()
      const id2 = useSessionStore.getState().startSession()
      expect(id1).not.toBe(id2)
    })

    it('sets sessionDate to today', () => {
      useSessionStore.getState().startSession()
      const session = useSessionStore.getState().playthroughLog[0]
      expect(session.sessionDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('endSession', () => {
    it('clears activeSessionId', () => {
      useSessionStore.getState().startSession('Test')
      useSessionStore.getState().endSession()
      expect(useSessionStore.getState().activeSessionId).toBeNull()
    })

    it('preserves the session in the log', () => {
      useSessionStore.getState().startSession('Test')
      useSessionStore.getState().endSession()
      expect(useSessionStore.getState().playthroughLog).toHaveLength(1)
    })
  })

  describe('deleteSession', () => {
    it('removes session from log', () => {
      const id = useSessionStore.getState().startSession('To Delete')
      useSessionStore.getState().deleteSession(id)
      expect(useSessionStore.getState().playthroughLog).toHaveLength(0)
    })

    it('clears activeSessionId if deleted session was active', () => {
      const id = useSessionStore.getState().startSession('Active')
      useSessionStore.getState().deleteSession(id)
      expect(useSessionStore.getState().activeSessionId).toBeNull()
    })
  })

  describe('updateSessionLabel', () => {
    it('updates the label of a session', () => {
      const id = useSessionStore.getState().startSession('Original')
      useSessionStore.getState().updateSessionLabel(id, 'Session 5 — Ambush')
      const session = useSessionStore.getState().playthroughLog.find((e) => e.id === id)
      expect(session?.sessionLabel).toBe('Session 5 — Ambush')
    })
  })

  describe('recordNodeVisit', () => {
    it('adds a visit to the active session', () => {
      useSessionStore.getState().startSession('Test')
      useSessionStore.getState().recordNodeVisit('node-1', 'played_as_planned')
      const session = useSessionStore.getState().getActiveSession()
      expect(session?.nodesVisited).toHaveLength(1)
      expect(session?.nodesVisited[0].nodeId).toBe('node-1')
      expect(session?.nodesVisited[0].status).toBe('played_as_planned')
    })

    it('replaces existing visit for same nodeId', () => {
      useSessionStore.getState().startSession('Test')
      useSessionStore.getState().recordNodeVisit('node-1', 'played_as_planned')
      useSessionStore.getState().recordNodeVisit('node-1', 'modified', 'Changed')
      const session = useSessionStore.getState().getActiveSession()
      expect(session?.nodesVisited).toHaveLength(1)
      expect(session?.nodesVisited[0].status).toBe('modified')
      expect(session?.nodesVisited[0].notes).toBe('Changed')
    })

    it('is a no-op without active session', () => {
      useSessionStore.getState().recordNodeVisit('node-1', 'played_as_planned')
      expect(useSessionStore.getState().playthroughLog).toHaveLength(0)
    })
  })

  describe('removeNodeVisit', () => {
    it('removes a visit from the active session', () => {
      useSessionStore.getState().startSession('Test')
      useSessionStore.getState().recordNodeVisit('node-1', 'played_as_planned')
      useSessionStore.getState().removeNodeVisit('node-1')
      const session = useSessionStore.getState().getActiveSession()
      expect(session?.nodesVisited).toHaveLength(0)
    })
  })

  describe('selectSession', () => {
    it('sets the active session id', () => {
      const id = useSessionStore.getState().startSession('Test')
      useSessionStore.getState().endSession()
      useSessionStore.getState().selectSession(id)
      expect(useSessionStore.getState().activeSessionId).toBe(id)
    })

    it('clears selection with null', () => {
      useSessionStore.getState().startSession('Test')
      useSessionStore.getState().selectSession(null)
      expect(useSessionStore.getState().activeSessionId).toBeNull()
    })
  })

  describe('getActiveSession / getSelectedSession', () => {
    it('returns the active session', () => {
      const id = useSessionStore.getState().startSession('Test')
      const session = useSessionStore.getState().getActiveSession()
      expect(session?.id).toBe(id)
    })

    it('returns undefined when no active session', () => {
      expect(useSessionStore.getState().getActiveSession()).toBeUndefined()
    })
  })

  describe('toggleDiffOverlay', () => {
    it('toggles diff overlay on and off', () => {
      expect(useSessionStore.getState().diffOverlayActive).toBe(false)
      useSessionStore.getState().toggleDiffOverlay()
      expect(useSessionStore.getState().diffOverlayActive).toBe(true)
      useSessionStore.getState().toggleDiffOverlay()
      expect(useSessionStore.getState().diffOverlayActive).toBe(false)
    })
  })

  describe('setDiffOverlayActive', () => {
    it('sets diff overlay to specific value', () => {
      useSessionStore.getState().setDiffOverlayActive(true)
      expect(useSessionStore.getState().diffOverlayActive).toBe(true)
    })
  })

  describe('toggleSessionTimeline', () => {
    it('toggles session timeline sidebar', () => {
      expect(useSessionStore.getState().sessionTimelineOpen).toBe(false)
      useSessionStore.getState().toggleSessionTimeline()
      expect(useSessionStore.getState().sessionTimelineOpen).toBe(true)
    })
  })

  describe('loadPlaythroughLog', () => {
    it('replaces the playthrough log', () => {
      const log = [
        { id: 's1', sessionDate: '2026-01-01', nodesVisited: [] },
        { id: 's2', sessionDate: '2026-01-02', nodesVisited: [] },
      ]
      useSessionStore.getState().loadPlaythroughLog(log)
      expect(useSessionStore.getState().playthroughLog).toHaveLength(2)
    })
  })

  describe('reset', () => {
    it('clears all state', () => {
      useSessionStore.getState().startSession('Test')
      useSessionStore.getState().toggleDiffOverlay()
      useSessionStore.getState().toggleSessionTimeline()
      useSessionStore.getState().reset()
      const state = useSessionStore.getState()
      expect(state.playthroughLog).toHaveLength(0)
      expect(state.activeSessionId).toBeNull()
      expect(state.diffOverlayActive).toBe(false)
      expect(state.sessionTimelineOpen).toBe(false)
    })
  })
})
