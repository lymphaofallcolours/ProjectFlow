import { describe, it, expect, beforeEach } from 'vitest'
import { useGraphStore } from '@/application/graph-store'
import { useSessionStore } from '@/application/session-store'
import { buildDiffMap } from '@/domain/playthrough-operations'

describe('Session timeline (integration)', () => {
  beforeEach(() => {
    useGraphStore.getState().reset()
    useSessionStore.getState().reset()
  })

  it('active session reflects node visits in correct order', () => {
    const n1 = useGraphStore.getState().addNode('narration', { x: 0, y: 0 }, 'First')
    const n2 = useGraphStore.getState().addNode('combat', { x: 200, y: 0 }, 'Second')
    const n3 = useGraphStore.getState().addNode('social', { x: 400, y: 0 }, 'Third')

    useSessionStore.getState().startSession('Timeline Test')
    useSessionStore.getState().recordNodeVisit(n1, 'played_as_planned')
    useSessionStore.getState().recordNodeVisit(n2, 'modified', 'Changed')
    useSessionStore.getState().recordNodeVisit(n3, 'skipped')

    const session = useSessionStore.getState().getActiveSession()!
    expect(session.nodesVisited).toHaveLength(3)
    expect(session.nodesVisited[0].nodeId).toBe(n1)
    expect(session.nodesVisited[1].nodeId).toBe(n2)
    expect(session.nodesVisited[1].notes).toBe('Changed')
    expect(session.nodesVisited[2].nodeId).toBe(n3)
  })

  it('selecting a past session updates the view', () => {
    const n1 = useGraphStore.getState().addNode('narration', { x: 0, y: 0 }, 'Scene')

    // Create and end session 1
    const id1 = useSessionStore.getState().startSession('Session 1')
    useSessionStore.getState().recordNodeVisit(n1, 'played_as_planned')
    useSessionStore.getState().endSession()

    // Create session 2
    const id2 = useSessionStore.getState().startSession('Session 2')
    useSessionStore.getState().recordNodeVisit(n1, 'modified', 'Different')
    useSessionStore.getState().endSession()

    // Select session 1
    useSessionStore.getState().selectSession(id1)
    const s1 = useSessionStore.getState().getSelectedSession()
    expect(s1?.id).toBe(id1)
    expect(s1?.nodesVisited[0].status).toBe('played_as_planned')

    // Select session 2
    useSessionStore.getState().selectSession(id2)
    const s2 = useSessionStore.getState().getSelectedSession()
    expect(s2?.id).toBe(id2)
    expect(s2?.nodesVisited[0].status).toBe('modified')
  })

  it('diff overlay and session selection work together', () => {
    const n1 = useGraphStore.getState().addNode('combat', { x: 0, y: 0 }, 'Battle')
    const n2 = useGraphStore.getState().addNode('social', { x: 200, y: 0 }, 'Talk')

    const sessionId = useSessionStore.getState().startSession('Diff Test')
    useSessionStore.getState().recordNodeVisit(n1, 'played_as_planned')
    useSessionStore.getState().recordNodeVisit(n2, 'skipped')

    // Enable diff overlay
    useSessionStore.getState().setDiffOverlayActive(true)
    expect(useSessionStore.getState().diffOverlayActive).toBe(true)

    // Compute diff map from selected session
    const session = useSessionStore.getState().playthroughLog.find((e) => e.id === sessionId)!
    const diffMap = buildDiffMap(session)
    expect(diffMap[n1]).toBe('played_as_planned')
    expect(diffMap[n2]).toBe('skipped')
  })

  it('session store reset clears all state', () => {
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
