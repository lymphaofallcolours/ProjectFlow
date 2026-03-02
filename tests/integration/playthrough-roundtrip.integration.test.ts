import { describe, it, expect, beforeEach } from 'vitest'
import { useGraphStore } from '@/application/graph-store'
import { useSessionStore } from '@/application/session-store'
import { useCampaignStore } from '@/application/campaign-store'
import { useEntityStore } from '@/application/entity-store'
import { assembleCampaign, hydrateCampaign, newCampaignAction } from '@/application/campaign-actions'
import { serializeCampaign, deserializeCampaign } from '@/infrastructure/serialization'
import { buildDiffMap, exportSessionAsMarkdown } from '@/domain/playthrough-operations'

describe('Playthrough roundtrip (integration)', () => {
  beforeEach(() => {
    useGraphStore.getState().reset()
    useSessionStore.getState().reset()
    useCampaignStore.getState().reset()
    useEntityStore.getState().reset()
  })

  it('creates a session, records visits, and computes diff map', () => {
    const n1 = useGraphStore.getState().addNode('narration', { x: 0, y: 0 }, 'Briefing')
    const n2 = useGraphStore.getState().addNode('combat', { x: 200, y: 0 }, 'Ambush')
    useGraphStore.getState().addNode('social', { x: 400, y: 0 }, 'Diplomacy')

    useSessionStore.getState().startSession('Session 1')
    useSessionStore.getState().recordNodeVisit(n1, 'played_as_planned')
    useSessionStore.getState().recordNodeVisit(n2, 'modified', 'Team split up')

    const session = useSessionStore.getState().getActiveSession()
    expect(session).toBeDefined()
    expect(session!.nodesVisited).toHaveLength(2)

    const diffMap = buildDiffMap(session!)
    expect(diffMap[n1]).toBe('played_as_planned')
    expect(diffMap[n2]).toBe('modified')
  })

  it('persists session through campaign save/load roundtrip', () => {
    const n1 = useGraphStore.getState().addNode('narration', { x: 0, y: 0 }, 'Scene 1')
    useCampaignStore.getState().setName('Test Campaign')

    const sessionId = useSessionStore.getState().startSession('Session 1')
    useSessionStore.getState().recordNodeVisit(n1, 'played_as_planned')
    useSessionStore.getState().endSession()

    // Assemble and serialize
    const campaign = assembleCampaign()
    expect(campaign.playthroughLog).toHaveLength(1)
    expect(campaign.playthroughLog[0].nodesVisited).toHaveLength(1)

    const json = serializeCampaign(campaign)
    const restored = deserializeCampaign(json)

    // Reset and hydrate
    newCampaignAction('New')
    expect(useSessionStore.getState().playthroughLog).toHaveLength(0)

    hydrateCampaign(restored)
    const log = useSessionStore.getState().playthroughLog
    expect(log).toHaveLength(1)
    expect(log[0].id).toBe(sessionId)
    expect(log[0].nodesVisited[0].status).toBe('played_as_planned')
  })

  it('preserves node playthrough status through save/load', () => {
    const n1 = useGraphStore.getState().addNode('combat', { x: 0, y: 0 }, 'Battle')
    useGraphStore.getState().setPlaythroughStatus(n1, 'modified', 'Boss fight changed')

    const campaign = assembleCampaign()
    const json = serializeCampaign(campaign)

    useGraphStore.getState().reset()
    hydrateCampaign(deserializeCampaign(json))

    const node = useGraphStore.getState().nodes[n1]
    expect(node.playthroughStatus).toBe('modified')
    expect(node.playthroughNotes).toBe('Boss fight changed')
  })

  it('handles multiple sessions with cumulative diff', () => {
    const n1 = useGraphStore.getState().addNode('narration', { x: 0, y: 0 }, 'Act 1')
    const n2 = useGraphStore.getState().addNode('combat', { x: 200, y: 0 }, 'Act 2')

    // Session 1
    useSessionStore.getState().startSession('Session 1')
    useSessionStore.getState().recordNodeVisit(n1, 'played_as_planned')
    useSessionStore.getState().recordNodeVisit(n2, 'skipped')
    useSessionStore.getState().endSession()

    // Session 2
    useSessionStore.getState().startSession('Session 2')
    useSessionStore.getState().recordNodeVisit(n2, 'played_as_planned')
    useSessionStore.getState().endSession()

    expect(useSessionStore.getState().playthroughLog).toHaveLength(2)
  })

  it('exports session as markdown with correct format', () => {
    const n1 = useGraphStore.getState().addNode('narration', { x: 0, y: 0 }, 'Briefing')
    const n2 = useGraphStore.getState().addNode('combat', { x: 200, y: 0 }, 'Ambush')

    useSessionStore.getState().startSession('Session 12')
    useSessionStore.getState().recordNodeVisit(n1, 'played_as_planned')
    useSessionStore.getState().recordNodeVisit(n2, 'modified', 'Players flanked')

    const session = useSessionStore.getState().getActiveSession()!
    const nodes = useGraphStore.getState().nodes
    const md = exportSessionAsMarkdown(session, nodes)

    expect(md).toContain('# Session: Session 12')
    expect(md).toContain('**Briefing** — Played as Planned')
    expect(md).toContain('**Ambush** — Modified')
    expect(md).toContain('> Players flanked')
    expect(md).toContain('- Played as planned: 1')
    expect(md).toContain('- Modified: 1')
  })

  it('graph store and session store coordinate on status marking', () => {
    const n1 = useGraphStore.getState().addNode('event', { x: 0, y: 0 }, 'Trigger')

    useSessionStore.getState().startSession('Test')

    // Simulate context menu action: set both stores
    useGraphStore.getState().setPlaythroughStatus(n1, 'played_as_planned')
    useSessionStore.getState().recordNodeVisit(n1, 'played_as_planned')

    // Node has status
    expect(useGraphStore.getState().nodes[n1].playthroughStatus).toBe('played_as_planned')

    // Session has visit
    const session = useSessionStore.getState().getActiveSession()
    expect(session!.nodesVisited).toHaveLength(1)
    expect(session!.nodesVisited[0].status).toBe('played_as_planned')
  })

  it('delete session removes from log and clears selection', () => {
    const id = useSessionStore.getState().startSession('To Delete')
    expect(useSessionStore.getState().playthroughLog).toHaveLength(1)
    expect(useSessionStore.getState().activeSessionId).toBe(id)

    useSessionStore.getState().deleteSession(id)
    expect(useSessionStore.getState().playthroughLog).toHaveLength(0)
    expect(useSessionStore.getState().activeSessionId).toBeNull()
  })

  it('backward compatible: loads campaign without playthroughLog', () => {
    const n1 = useGraphStore.getState().addNode('narration', { x: 0, y: 0 }, 'Old')
    useCampaignStore.getState().setName('Old Campaign')

    const campaign = assembleCampaign()
    const json = serializeCampaign(campaign)
    const parsed = JSON.parse(json)
    delete parsed.playthroughLog
    const oldJson = JSON.stringify(parsed)

    // Should load without error
    const restored = deserializeCampaign(oldJson)
    hydrateCampaign(restored)

    expect(useSessionStore.getState().playthroughLog).toHaveLength(0)
    expect(useGraphStore.getState().nodes[n1]).toBeDefined()
  })
})
