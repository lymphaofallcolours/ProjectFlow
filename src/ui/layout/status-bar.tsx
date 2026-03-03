import { useState, useEffect, useCallback } from 'react'
import { useGraphStore } from '@/application/graph-store'
import { useCampaignStore } from '@/application/campaign-store'
import { useEntityStore } from '@/application/entity-store'
import { useSessionStore } from '@/application/session-store'
import { useUIStore } from '@/application/ui-store'

export function StatusBar() {
  const nodeCount = useGraphStore((s) => Object.keys(s.nodes).length)
  const edgeCount = useGraphStore((s) => Object.keys(s.edges).length)
  const groupCount = useGraphStore((s) => Object.values(s.nodes).filter((n) => n.isGroup).length)
  const selectionCount = useGraphStore((s) => s.selectedNodeIds.size)
  const entityCount = useEntityStore((s) => Object.keys(s.entities).length)
  const name = useCampaignStore((s) => s.name)
  const setName = useCampaignStore((s) => s.setName)
  const activeSessionId = useSessionStore((s) => s.activeSessionId)
  const playthroughLog = useSessionStore((s) => s.playthroughLog)
  const diffOverlayActive = useSessionStore((s) => s.diffOverlayActive)
  const autoSaveStatus = useUIStore((s) => s.autoSaveStatus)

  const isOnline = useOnlineStatus()
  const activeSession = playthroughLog.find((e) => e.id === activeSessionId)

  return (
    <div
      className="relative z-10 flex items-center gap-4 px-4 py-1.5 glass-panel border-t border-border
        text-[11px] text-text-muted"
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      <EditableCampaignName name={name} onRename={setName} />
      <span className="opacity-30">|</span>
      <span>{nodeCount} node{nodeCount !== 1 ? 's' : ''}</span>
      <span className="opacity-30">|</span>
      <span>{edgeCount} edge{edgeCount !== 1 ? 's' : ''}</span>
      <span className="opacity-30">|</span>
      <span>{entityCount} entit{entityCount !== 1 ? 'ies' : 'y'}</span>
      {groupCount > 0 && (
        <>
          <span className="opacity-30">|</span>
          <span>{groupCount} group{groupCount !== 1 ? 's' : ''}</span>
        </>
      )}
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

      {/* Right-aligned online/offline indicator */}
      <span className="ml-auto flex items-center gap-1.5">
        <span
          className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-status-played' : 'bg-status-skipped'}`}
        />
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  )
}

function EditableCampaignName({ name, onRename }: { name: string; onRename: (name: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)

  const startEdit = useCallback(() => {
    setDraft(name)
    setEditing(true)
  }, [name])

  const confirmEdit = useCallback(() => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== name) {
      onRename(trimmed)
    }
    setEditing(false)
  }, [draft, name, onRename])

  if (editing) {
    return (
      <input
        data-testid="campaign-name-input"
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') confirmEdit()
          if (e.key === 'Escape') setEditing(false)
        }}
        onBlur={confirmEdit}
        className="bg-transparent text-[11px] text-text-muted outline-none border-b border-border
          focus:border-text-secondary w-36"
        style={{ fontFamily: 'var(--font-mono)' }}
      />
    )
  }

  return (
    <button
      data-testid="campaign-name"
      onClick={startEdit}
      className="hover:text-text-secondary transition-colors cursor-pointer"
      title="Click to rename campaign"
    >
      {name}
    </button>
  )
}

function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
