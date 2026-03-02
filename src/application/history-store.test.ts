import { describe, it, expect, beforeEach } from 'vitest'
import { useHistoryStore } from './history-store'
import { createSnapshot, MAX_HISTORY_SIZE } from '@/domain/history-operations'
import { createTestNode } from '../../tests/fixtures/factories'

function snap(nodeCount = 0) {
  const nodes: Record<string, ReturnType<typeof createTestNode>> = {}
  for (let i = 0; i < nodeCount; i++) {
    const n = createTestNode({ id: `n${i}` })
    nodes[n.id] = n
  }
  return createSnapshot(nodes, {})
}

beforeEach(() => {
  useHistoryStore.getState().reset()
})

describe('useHistoryStore', () => {
  describe('pushSnapshot', () => {
    it('adds a snapshot to past', () => {
      const s = snap(1)
      useHistoryStore.getState().pushSnapshot(s)
      expect(useHistoryStore.getState().past).toHaveLength(1)
      expect(useHistoryStore.getState().past[0]).toBe(s)
    })

    it('clears future on push', () => {
      const s1 = snap(1)
      const s2 = snap(2)
      const current = snap(3)
      useHistoryStore.getState().pushSnapshot(s1)
      useHistoryStore.getState().pushSnapshot(s2)
      // Simulate undo to get something in future
      useHistoryStore.getState().popUndo(current)
      expect(useHistoryStore.getState().future).toHaveLength(1)
      // Push new snapshot clears future
      useHistoryStore.getState().pushSnapshot(snap(4))
      expect(useHistoryStore.getState().future).toHaveLength(0)
    })

    it('caps history at MAX_HISTORY_SIZE', () => {
      for (let i = 0; i < MAX_HISTORY_SIZE + 10; i++) {
        useHistoryStore.getState().pushSnapshot(snap(i))
      }
      expect(useHistoryStore.getState().past).toHaveLength(MAX_HISTORY_SIZE)
    })
  })

  describe('popUndo', () => {
    it('returns last snapshot from past', () => {
      const s1 = snap(1)
      const s2 = snap(2)
      useHistoryStore.getState().pushSnapshot(s1)
      useHistoryStore.getState().pushSnapshot(s2)
      const result = useHistoryStore.getState().popUndo(snap(3))
      expect(result).toBe(s2)
      expect(useHistoryStore.getState().past).toHaveLength(1)
    })

    it('pushes current to future', () => {
      const s1 = snap(1)
      const current = snap(2)
      useHistoryStore.getState().pushSnapshot(s1)
      useHistoryStore.getState().popUndo(current)
      expect(useHistoryStore.getState().future).toHaveLength(1)
      expect(useHistoryStore.getState().future[0]).toBe(current)
    })

    it('returns null when past is empty', () => {
      const result = useHistoryStore.getState().popUndo(snap())
      expect(result).toBeNull()
    })
  })

  describe('popRedo', () => {
    it('returns last snapshot from future', () => {
      const s1 = snap(1)
      const s2 = snap(2)
      const current = snap(3)
      useHistoryStore.getState().pushSnapshot(s1)
      useHistoryStore.getState().pushSnapshot(s2)
      // Undo to populate future
      useHistoryStore.getState().popUndo(current)
      const result = useHistoryStore.getState().popRedo(snap(4))
      expect(result).toBe(current)
    })

    it('pushes current to past', () => {
      const s1 = snap(1)
      const current = snap(2)
      useHistoryStore.getState().pushSnapshot(s1)
      const afterUndo = useHistoryStore.getState().popUndo(current)!
      // Now redo
      useHistoryStore.getState().popRedo(afterUndo)
      expect(useHistoryStore.getState().past).toHaveLength(1)
      expect(useHistoryStore.getState().past[0]).toBe(afterUndo)
    })

    it('returns null when future is empty', () => {
      const result = useHistoryStore.getState().popRedo(snap())
      expect(result).toBeNull()
    })
  })

  describe('canUndo / canRedo', () => {
    it('canUndo is false when past is empty', () => {
      expect(useHistoryStore.getState().canUndo()).toBe(false)
    })

    it('canUndo is true when past has entries', () => {
      useHistoryStore.getState().pushSnapshot(snap(1))
      expect(useHistoryStore.getState().canUndo()).toBe(true)
    })

    it('canRedo is false when future is empty', () => {
      expect(useHistoryStore.getState().canRedo()).toBe(false)
    })

    it('canRedo is true after undo', () => {
      useHistoryStore.getState().pushSnapshot(snap(1))
      useHistoryStore.getState().popUndo(snap(2))
      expect(useHistoryStore.getState().canRedo()).toBe(true)
    })
  })

  describe('clear / reset', () => {
    it('clear empties both stacks', () => {
      useHistoryStore.getState().pushSnapshot(snap(1))
      useHistoryStore.getState().pushSnapshot(snap(2))
      useHistoryStore.getState().popUndo(snap(3))
      useHistoryStore.getState().clear()
      expect(useHistoryStore.getState().past).toHaveLength(0)
      expect(useHistoryStore.getState().future).toHaveLength(0)
    })

    it('reset empties both stacks', () => {
      useHistoryStore.getState().pushSnapshot(snap(1))
      useHistoryStore.getState().reset()
      expect(useHistoryStore.getState().past).toHaveLength(0)
      expect(useHistoryStore.getState().future).toHaveLength(0)
    })
  })

  describe('undo-redo roundtrip', () => {
    it('multiple undo then redo restores original state', () => {
      const s1 = snap(1)
      const s2 = snap(2)
      const s3 = snap(3)
      const s4 = snap(4)
      useHistoryStore.getState().pushSnapshot(s1)
      useHistoryStore.getState().pushSnapshot(s2)
      useHistoryStore.getState().pushSnapshot(s3)

      // Undo twice: current is s4
      const afterUndo1 = useHistoryStore.getState().popUndo(s4)
      expect(afterUndo1).toBe(s3)
      const afterUndo2 = useHistoryStore.getState().popUndo(afterUndo1!)
      expect(afterUndo2).toBe(s2)

      // Redo twice
      const afterRedo1 = useHistoryStore.getState().popRedo(afterUndo2!)
      expect(afterRedo1).toBe(s3)
      const afterRedo2 = useHistoryStore.getState().popRedo(afterRedo1!)
      expect(afterRedo2).toBe(s4)
    })
  })
})
