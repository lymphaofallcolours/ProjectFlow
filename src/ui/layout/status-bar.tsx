import { useGraphStore } from '@/application/graph-store'
import { useCampaignStore } from '@/application/campaign-store'
import { useEntityStore } from '@/application/entity-store'
import { useSessionStore } from '@/application/session-store'
import { useUIStore } from '@/application/ui-store'

export function StatusBar() {
  const nodeCount = useGraphStore((s) => Object.keys(s.nodes).length)
  const edgeCount = useGraphStore((s) => Object.keys(s.edges).length)
  const selectionCount = useGraphStore((s) => s.selectedNodeIds.size)
  const entityCount = useEntityStore((s) => Object.keys(s.entities).length)
  const name = useCampaignStore((s) => s.name)
  const activeSessionId = useSessionStore((s) => s.activeSessionId)
  const playthroughLog = useSessionStore((s) => s.playthroughLog)
  const diffOverlayActive = useSessionStore((s) => s.diffOverlayActive)
  const autoSaveStatus = useUIStore((s) => s.autoSaveStatus)

  const activeSession = playthroughLog.find((e) => e.id === activeSessionId)

  return (
    <div
      className="relative z-10 flex items-center gap-4 px-4 py-1.5 glass-panel border-t border-border
        text-[11px] text-text-muted"
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      <span>{name}</span>
      <span className="opacity-30">|</span>
      <span>{nodeCount} node{nodeCount !== 1 ? 's' : ''}</span>
      <span className="opacity-30">|</span>
      <span>{edgeCount} edge{edgeCount !== 1 ? 's' : ''}</span>
      <span className="opacity-30">|</span>
      <span>{entityCount} entit{entityCount !== 1 ? 'ies' : 'y'}</span>
      {selectionCount > 1 && (
        <>
          <span className="opacity-30">|</span>
          <span className="text-node-event">{selectionCount} selected</span>
        </>
      )}
      {activeSession && (
        <>
          <span className="opacity-30">|</span>
          <span className="text-status-played">
            ● {activeSession.sessionLabel ?? 'Session'} ({activeSession.nodesVisited.length} visited)
          </span>
        </>
      )}
      {diffOverlayActive && (
        <>
          <span className="opacity-30">|</span>
          <span className="text-status-modified">◉ Diff</span>
        </>
      )}
      {autoSaveStatus && (
        <>
          <span className="opacity-30">|</span>
          <span className={autoSaveStatus === 'saving' ? 'text-text-muted' : 'text-status-played'}>
            {autoSaveStatus === 'saving' ? 'Saving...' : 'Saved ✓'}
          </span>
        </>
      )}
    </div>
  )
}
