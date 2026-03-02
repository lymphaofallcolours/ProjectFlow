// Playthrough domain operations — ZERO framework imports
import type { StoryNode, PlaythroughStatus, PlaythroughEntry } from './types'

// --- Status config ---

export type PlaythroughStatusConfig = {
  label: string
  color: string
  icon: string
}

export const PLAYTHROUGH_STATUS_CONFIG: Record<PlaythroughStatus, PlaythroughStatusConfig> = {
  played_as_planned: { label: 'Played as Planned', color: 'status-played', icon: 'CheckCircle' },
  modified: { label: 'Modified', color: 'status-modified', icon: 'Edit3' },
  skipped: { label: 'Skipped', color: 'status-skipped', icon: 'XCircle' },
  unvisited: { label: 'Unvisited', color: 'status-unvisited', icon: 'Circle' },
}

export const PLAYTHROUGH_STATUSES: PlaythroughStatus[] = [
  'played_as_planned',
  'modified',
  'skipped',
  'unvisited',
]

// --- Node status mutations ---

export function setNodePlaythroughStatus(
  node: StoryNode,
  status: PlaythroughStatus,
  notes?: string,
): StoryNode {
  return {
    ...node,
    playthroughStatus: status,
    playthroughNotes: status === 'modified' ? (notes ?? node.playthroughNotes) : undefined,
    metadata: { ...node.metadata, updatedAt: new Date().toISOString() },
  }
}

export function clearNodePlaythroughStatus(node: StoryNode): StoryNode {
  return {
    ...node,
    playthroughStatus: undefined,
    playthroughNotes: undefined,
    metadata: { ...node.metadata, updatedAt: new Date().toISOString() },
  }
}

// --- Session lifecycle ---

export function createPlaythroughEntry(
  sessionLabel?: string,
  sessionDate?: string,
): PlaythroughEntry {
  return {
    id: crypto.randomUUID(),
    sessionDate: sessionDate ?? new Date().toISOString().split('T')[0],
    sessionLabel,
    nodesVisited: [],
  }
}

export function addNodeVisit(
  entry: PlaythroughEntry,
  nodeId: string,
  status: PlaythroughStatus,
  notes?: string,
): PlaythroughEntry {
  const visit = {
    nodeId,
    status,
    notes,
    timestamp: new Date().toISOString(),
  }
  const existing = entry.nodesVisited.findIndex((v) => v.nodeId === nodeId)
  if (existing >= 0) {
    const updated = [...entry.nodesVisited]
    updated[existing] = visit
    return { ...entry, nodesVisited: updated }
  }
  return { ...entry, nodesVisited: [...entry.nodesVisited, visit] }
}

export function removeNodeVisit(
  entry: PlaythroughEntry,
  nodeId: string,
): PlaythroughEntry {
  return {
    ...entry,
    nodesVisited: entry.nodesVisited.filter((v) => v.nodeId !== nodeId),
  }
}

export function updateSessionLabel(
  entry: PlaythroughEntry,
  label: string,
): PlaythroughEntry {
  return { ...entry, sessionLabel: label }
}

// --- Diff computation ---

export type DiffMap = Record<string, PlaythroughStatus>

export function buildDiffMap(entry: PlaythroughEntry): DiffMap {
  const map: DiffMap = {}
  for (const visit of entry.nodesVisited) {
    map[visit.nodeId] = visit.status
  }
  return map
}

export function buildCumulativeDiffMap(entries: PlaythroughEntry[]): DiffMap {
  const map: DiffMap = {}
  for (const entry of entries) {
    for (const visit of entry.nodesVisited) {
      map[visit.nodeId] = visit.status
    }
  }
  return map
}

// --- Markdown export ---

export function exportSessionAsMarkdown(
  entry: PlaythroughEntry,
  nodes: Record<string, StoryNode>,
): string {
  const lines: string[] = []

  const title = entry.sessionLabel ?? 'Untitled Session'
  lines.push(`# Session: ${title}`)
  lines.push('')
  lines.push(`**Date:** ${entry.sessionDate}`)
  lines.push(`**Nodes visited:** ${entry.nodesVisited.length}`)
  lines.push('')

  if (entry.nodesVisited.length > 0) {
    lines.push('## Timeline')
    lines.push('')
    entry.nodesVisited.forEach((visit, i) => {
      const node = nodes[visit.nodeId]
      const label = node?.label ?? visit.nodeId
      const statusLabel = PLAYTHROUGH_STATUS_CONFIG[visit.status].label
      const line = `${i + 1}. **${label}** — ${statusLabel}`
      lines.push(line)
      if (visit.notes) {
        lines.push(`   > ${visit.notes}`)
      }
    })
    lines.push('')
  }

  // Statistics
  const stats = {
    played_as_planned: 0,
    modified: 0,
    skipped: 0,
    unvisited: 0,
  }
  for (const visit of entry.nodesVisited) {
    stats[visit.status]++
  }

  lines.push('## Statistics')
  lines.push('')
  lines.push(`- Played as planned: ${stats.played_as_planned}`)
  lines.push(`- Modified: ${stats.modified}`)
  lines.push(`- Skipped: ${stats.skipped}`)
  lines.push('')

  return lines.join('\n')
}
