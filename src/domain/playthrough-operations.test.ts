import { describe, it, expect, beforeEach } from 'vitest'
import {
  setNodePlaythroughStatus,
  clearNodePlaythroughStatus,
  createPlaythroughEntry,
  addNodeVisit,
  removeNodeVisit,
  updateSessionLabel,
  buildDiffMap,
  buildCumulativeDiffMap,
  exportSessionAsMarkdown,
  PLAYTHROUGH_STATUS_CONFIG,
  PLAYTHROUGH_STATUSES,
} from './playthrough-operations'
import { createTestNode } from '../../tests/fixtures/factories'
import type { StoryNode } from './types'

describe('PLAYTHROUGH_STATUS_CONFIG', () => {
  it('has config for all 4 statuses', () => {
    expect(Object.keys(PLAYTHROUGH_STATUS_CONFIG)).toHaveLength(4)
    expect(PLAYTHROUGH_STATUS_CONFIG.played_as_planned.label).toBe('Played as Planned')
    expect(PLAYTHROUGH_STATUS_CONFIG.modified.label).toBe('Modified')
    expect(PLAYTHROUGH_STATUS_CONFIG.skipped.label).toBe('Skipped')
    expect(PLAYTHROUGH_STATUS_CONFIG.unvisited.label).toBe('Unvisited')
  })

  it('PLAYTHROUGH_STATUSES is ordered array', () => {
    expect(PLAYTHROUGH_STATUSES).toHaveLength(4)
    expect(PLAYTHROUGH_STATUSES).toContain('played_as_planned')
    expect(PLAYTHROUGH_STATUSES).toContain('modified')
    expect(PLAYTHROUGH_STATUSES).toContain('skipped')
    expect(PLAYTHROUGH_STATUSES).toContain('unvisited')
  })
})

describe('setNodePlaythroughStatus', () => {
  let node: StoryNode

  beforeEach(() => {
    node = createTestNode()
  })

  it('sets played_as_planned status', () => {
    const result = setNodePlaythroughStatus(node, 'played_as_planned')
    expect(result.playthroughStatus).toBe('played_as_planned')
    expect(result.playthroughNotes).toBeUndefined()
  })

  it('sets modified status with notes', () => {
    const result = setNodePlaythroughStatus(node, 'modified', 'Players diverged here')
    expect(result.playthroughStatus).toBe('modified')
    expect(result.playthroughNotes).toBe('Players diverged here')
  })

  it('preserves existing notes when setting modified without new notes', () => {
    const withNotes = setNodePlaythroughStatus(node, 'modified', 'Original note')
    const result = setNodePlaythroughStatus(withNotes, 'modified')
    expect(result.playthroughNotes).toBe('Original note')
  })

  it('clears notes when setting non-modified status', () => {
    const withNotes = setNodePlaythroughStatus(node, 'modified', 'Some note')
    const result = setNodePlaythroughStatus(withNotes, 'played_as_planned')
    expect(result.playthroughStatus).toBe('played_as_planned')
    expect(result.playthroughNotes).toBeUndefined()
  })

  it('sets skipped status', () => {
    const result = setNodePlaythroughStatus(node, 'skipped')
    expect(result.playthroughStatus).toBe('skipped')
    expect(result.playthroughNotes).toBeUndefined()
  })

  it('updates metadata.updatedAt', () => {
    const stale = createTestNode({
      metadata: { createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', tags: [] },
    })
    const result = setNodePlaythroughStatus(stale, 'played_as_planned')
    expect(result.metadata.updatedAt).not.toBe('2026-01-01T00:00:00Z')
  })

  it('does not mutate the original node', () => {
    const original = { ...node }
    setNodePlaythroughStatus(node, 'modified', 'Note')
    expect(node.playthroughStatus).toBe(original.playthroughStatus)
  })
})

describe('clearNodePlaythroughStatus', () => {
  it('resets status and notes to undefined', () => {
    const node = createTestNode({
      playthroughStatus: 'modified',
      playthroughNotes: 'Some note',
    })
    const result = clearNodePlaythroughStatus(node)
    expect(result.playthroughStatus).toBeUndefined()
    expect(result.playthroughNotes).toBeUndefined()
  })

  it('updates metadata.updatedAt', () => {
    const node = createTestNode({
      playthroughStatus: 'skipped',
      metadata: { createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', tags: [] },
    })
    const result = clearNodePlaythroughStatus(node)
    expect(result.metadata.updatedAt).not.toBe('2026-01-01T00:00:00Z')
  })
})

describe('createPlaythroughEntry', () => {
  it('creates entry with generated id and current date', () => {
    const entry = createPlaythroughEntry()
    expect(entry.id).toBeTruthy()
    expect(entry.sessionDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(entry.nodesVisited).toEqual([])
    expect(entry.sessionLabel).toBeUndefined()
  })

  it('uses provided session label', () => {
    const entry = createPlaythroughEntry('Session 1 — The Arrival')
    expect(entry.sessionLabel).toBe('Session 1 — The Arrival')
  })

  it('uses provided date', () => {
    const entry = createPlaythroughEntry(undefined, '2026-01-15')
    expect(entry.sessionDate).toBe('2026-01-15')
  })
})

describe('addNodeVisit', () => {
  it('appends a new visit', () => {
    const entry = createPlaythroughEntry()
    const result = addNodeVisit(entry, 'node-1', 'played_as_planned')
    expect(result.nodesVisited).toHaveLength(1)
    expect(result.nodesVisited[0].nodeId).toBe('node-1')
    expect(result.nodesVisited[0].status).toBe('played_as_planned')
    expect(result.nodesVisited[0].timestamp).toBeTruthy()
  })

  it('appends with notes', () => {
    const entry = createPlaythroughEntry()
    const result = addNodeVisit(entry, 'node-1', 'modified', 'Team split up')
    expect(result.nodesVisited[0].notes).toBe('Team split up')
  })

  it('replaces existing visit for same nodeId', () => {
    let entry = createPlaythroughEntry()
    entry = addNodeVisit(entry, 'node-1', 'played_as_planned')
    entry = addNodeVisit(entry, 'node-1', 'modified', 'Changed plan')
    expect(entry.nodesVisited).toHaveLength(1)
    expect(entry.nodesVisited[0].status).toBe('modified')
    expect(entry.nodesVisited[0].notes).toBe('Changed plan')
  })

  it('preserves other visits when replacing', () => {
    let entry = createPlaythroughEntry()
    entry = addNodeVisit(entry, 'node-1', 'played_as_planned')
    entry = addNodeVisit(entry, 'node-2', 'skipped')
    entry = addNodeVisit(entry, 'node-1', 'modified', 'Revised')
    expect(entry.nodesVisited).toHaveLength(2)
    expect(entry.nodesVisited[0].status).toBe('modified')
    expect(entry.nodesVisited[1].nodeId).toBe('node-2')
  })
})

describe('removeNodeVisit', () => {
  it('removes visit by nodeId', () => {
    let entry = createPlaythroughEntry()
    entry = addNodeVisit(entry, 'node-1', 'played_as_planned')
    entry = addNodeVisit(entry, 'node-2', 'skipped')
    const result = removeNodeVisit(entry, 'node-1')
    expect(result.nodesVisited).toHaveLength(1)
    expect(result.nodesVisited[0].nodeId).toBe('node-2')
  })

  it('is a no-op for missing nodeId', () => {
    const entry = createPlaythroughEntry()
    const result = removeNodeVisit(entry, 'nonexistent')
    expect(result.nodesVisited).toHaveLength(0)
  })
})

describe('updateSessionLabel', () => {
  it('updates the label', () => {
    const entry = createPlaythroughEntry('Original')
    const result = updateSessionLabel(entry, 'Session 5 — Ambush')
    expect(result.sessionLabel).toBe('Session 5 — Ambush')
  })
})

describe('buildDiffMap', () => {
  it('maps nodeId to status', () => {
    let entry = createPlaythroughEntry()
    entry = addNodeVisit(entry, 'n1', 'played_as_planned')
    entry = addNodeVisit(entry, 'n2', 'modified', 'Note')
    entry = addNodeVisit(entry, 'n3', 'skipped')

    const map = buildDiffMap(entry)
    expect(map['n1']).toBe('played_as_planned')
    expect(map['n2']).toBe('modified')
    expect(map['n3']).toBe('skipped')
  })

  it('returns empty map for empty entry', () => {
    const entry = createPlaythroughEntry()
    expect(buildDiffMap(entry)).toEqual({})
  })

  it('does not include unvisited nodes', () => {
    const entry = createPlaythroughEntry()
    const map = buildDiffMap(entry)
    expect(Object.keys(map)).toHaveLength(0)
  })
})

describe('buildCumulativeDiffMap', () => {
  it('merges multiple sessions', () => {
    let e1 = createPlaythroughEntry()
    e1 = addNodeVisit(e1, 'n1', 'played_as_planned')
    e1 = addNodeVisit(e1, 'n2', 'skipped')

    let e2 = createPlaythroughEntry()
    e2 = addNodeVisit(e2, 'n2', 'played_as_planned')
    e2 = addNodeVisit(e2, 'n3', 'modified', 'Note')

    const map = buildCumulativeDiffMap([e1, e2])
    expect(map['n1']).toBe('played_as_planned')
    expect(map['n2']).toBe('played_as_planned') // overridden by e2
    expect(map['n3']).toBe('modified')
  })

  it('later entries override earlier for same nodeId', () => {
    let e1 = createPlaythroughEntry()
    e1 = addNodeVisit(e1, 'n1', 'played_as_planned')

    let e2 = createPlaythroughEntry()
    e2 = addNodeVisit(e2, 'n1', 'skipped')

    const map = buildCumulativeDiffMap([e1, e2])
    expect(map['n1']).toBe('skipped')
  })

  it('returns empty map for empty array', () => {
    expect(buildCumulativeDiffMap([])).toEqual({})
  })
})

describe('exportSessionAsMarkdown', () => {
  it('includes header with label and date', () => {
    const entry = createPlaythroughEntry('Session 12 — The Breach', '2026-03-02')
    const md = exportSessionAsMarkdown(entry, {})
    expect(md).toContain('# Session: Session 12 — The Breach')
    expect(md).toContain('**Date:** 2026-03-02')
  })

  it('includes timeline with node labels and statuses', () => {
    const n1 = createTestNode({ id: 'n1', label: 'Briefing' })
    const n2 = createTestNode({ id: 'n2', label: 'Ambush' })
    const nodes = { n1, n2 }

    let entry = createPlaythroughEntry('Test Session')
    entry = addNodeVisit(entry, 'n1', 'played_as_planned')
    entry = addNodeVisit(entry, 'n2', 'modified', 'Team split up')

    const md = exportSessionAsMarkdown(entry, nodes)
    expect(md).toContain('1. **Briefing** — Played as Planned')
    expect(md).toContain('2. **Ambush** — Modified')
    expect(md).toContain('> Team split up')
  })

  it('includes statistics section', () => {
    let entry = createPlaythroughEntry('Stats Test')
    entry = addNodeVisit(entry, 'n1', 'played_as_planned')
    entry = addNodeVisit(entry, 'n2', 'played_as_planned')
    entry = addNodeVisit(entry, 'n3', 'modified', 'Changed')
    entry = addNodeVisit(entry, 'n4', 'skipped')

    const md = exportSessionAsMarkdown(entry, {})
    expect(md).toContain('- Played as planned: 2')
    expect(md).toContain('- Modified: 1')
    expect(md).toContain('- Skipped: 1')
  })

  it('handles empty session', () => {
    const entry = createPlaythroughEntry('Empty')
    const md = exportSessionAsMarkdown(entry, {})
    expect(md).toContain('# Session: Empty')
    expect(md).toContain('**Nodes visited:** 0')
    expect(md).not.toContain('## Timeline')
  })

  it('falls back to nodeId when node not found', () => {
    let entry = createPlaythroughEntry('Fallback')
    entry = addNodeVisit(entry, 'missing-node', 'played_as_planned')
    const md = exportSessionAsMarkdown(entry, {})
    expect(md).toContain('**missing-node**')
  })

  it('uses "Untitled Session" when no label', () => {
    const entry = createPlaythroughEntry()
    const md = exportSessionAsMarkdown(entry, {})
    expect(md).toContain('# Session: Untitled Session')
  })
})
