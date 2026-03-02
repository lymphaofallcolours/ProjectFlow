import { useMemo, useState, useCallback } from 'react'
import { X, Download, Square, CheckCircle, Edit3, XCircle, Circle } from 'lucide-react'
import { useSessionStore } from '@/application/session-store'
import { useGraphStore } from '@/application/graph-store'
import { PLAYTHROUGH_STATUS_CONFIG, exportSessionAsMarkdown } from '@/domain/playthrough-operations'
import type { PlaythroughStatus } from '@/domain/types'
import { downloadMarkdown } from '@/infrastructure/markdown-export'

const STATUS_ICONS: Record<PlaythroughStatus, React.ReactNode> = {
  played_as_planned: <CheckCircle size={12} />,
  modified: <Edit3 size={12} />,
  skipped: <XCircle size={12} />,
  unvisited: <Circle size={12} />,
}

export function SessionTimeline() {
  const sessionTimelineOpen = useSessionStore((s) => s.sessionTimelineOpen)
  const toggleSessionTimeline = useSessionStore((s) => s.toggleSessionTimeline)
  const activeSessionId = useSessionStore((s) => s.activeSessionId)
  const playthroughLog = useSessionStore((s) => s.playthroughLog)
  const updateSessionLabel = useSessionStore((s) => s.updateSessionLabel)
  const endSession = useSessionStore((s) => s.endSession)
  const nodes = useGraphStore((s) => s.nodes)
  const selectNodes = useGraphStore((s) => s.selectNodes)

  const session = useMemo(
    () => playthroughLog.find((e) => e.id === activeSessionId),
    [playthroughLog, activeSessionId],
  )

  const [editingLabel, setEditingLabel] = useState(false)
  const [labelDraft, setLabelDraft] = useState('')

  const handleStartEditLabel = useCallback(() => {
    setLabelDraft(session?.sessionLabel ?? '')
    setEditingLabel(true)
  }, [session])

  const handleConfirmLabel = useCallback(() => {
    if (session && labelDraft.trim()) {
      updateSessionLabel(session.id, labelDraft.trim())
    }
    setEditingLabel(false)
  }, [session, labelDraft, updateSessionLabel])

  const handleExport = useCallback(() => {
    if (!session) return
    const md = exportSessionAsMarkdown(session, nodes)
    const filename = `${(session.sessionLabel ?? 'session').replace(/[^a-zA-Z0-9-_ ]/g, '')}-${session.sessionDate}.md`
    downloadMarkdown(md, filename)
  }, [session, nodes])

  const handleEndSession = useCallback(() => {
    endSession()
  }, [endSession])

  if (!sessionTimelineOpen) return null

  return (
    <div
      className="absolute right-0 top-0 bottom-0 w-80 z-30 glass-panel border-l border-border
        flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2
          className="text-sm font-semibold text-text-primary"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Session Timeline
        </h2>
        <button
          onClick={toggleSessionTimeline}
          className="text-text-muted hover:text-text-primary cursor-pointer transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Session info */}
      {session ? (
        <>
          <div className="px-4 py-3 border-b border-border">
            {editingLabel ? (
              <input
                autoFocus
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmLabel()
                  if (e.key === 'Escape') setEditingLabel(false)
                }}
                onBlur={handleConfirmLabel}
                className="w-full px-2 py-1 rounded-md text-xs bg-surface-glass border border-border
                  text-text-primary outline-none focus:border-status-played"
                style={{ fontFamily: 'var(--font-display)' }}
              />
            ) : (
              <button
                onClick={handleStartEditLabel}
                className="text-xs font-medium text-text-primary hover:text-status-played
                  cursor-pointer transition-colors"
                style={{ fontFamily: 'var(--font-display)' }}
                title="Click to edit label"
              >
                {session.sessionLabel ?? 'Untitled Session'}
              </button>
            )}
            <div className="text-[10px] text-text-muted mt-1">
              {session.sessionDate} · {session.nodesVisited.length} node{session.nodesVisited.length !== 1 ? 's' : ''} visited
            </div>
          </div>

          {/* Node visits */}
          <div className="flex-1 overflow-y-auto">
            {session.nodesVisited.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-text-muted">
                No nodes visited yet.
                <br />
                Right-click a node to mark its status.
              </div>
            ) : (
              <div className="py-2">
                {session.nodesVisited.map((visit, i) => {
                  const node = nodes[visit.nodeId]
                  const label = node?.label ?? visit.nodeId
                  const statusConfig = PLAYTHROUGH_STATUS_CONFIG[visit.status]
                  const statusColor = `var(--color-${statusConfig.color})`

                  return (
                    <button
                      key={visit.nodeId}
                      onClick={() => selectNodes([visit.nodeId])}
                      className="flex items-start gap-2.5 w-full px-4 py-2 text-left
                        hover:bg-surface-glass cursor-pointer transition-colors"
                    >
                      {/* Index number */}
                      <span className="text-[10px] text-text-muted w-4 text-right shrink-0 mt-0.5">
                        {i + 1}
                      </span>

                      {/* Status icon */}
                      <span className="shrink-0 mt-0.5" style={{ color: statusColor }}>
                        {STATUS_ICONS[visit.status]}
                      </span>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-xs font-medium text-text-primary truncate"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          {label}
                        </div>
                        <div className="text-[10px] text-text-muted">
                          {statusConfig.label}
                        </div>
                        {visit.notes && (
                          <div
                            className="text-[10px] mt-1 pl-2 border-l-2 text-text-secondary"
                            style={{ borderColor: statusColor }}
                          >
                            {visit.notes}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="px-4 py-3 border-t border-border flex gap-2">
            <button
              onClick={handleExport}
              disabled={session.nodesVisited.length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                font-medium text-text-secondary hover:text-text-primary hover:bg-surface-glass
                cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Download size={13} />
              Export MD
            </button>
            {activeSessionId === session.id && (
              <button
                onClick={handleEndSession}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                  font-medium text-status-skipped hover:bg-status-skipped/10
                  cursor-pointer transition-colors"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <Square size={13} />
                End
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center text-xs text-text-muted">
            No session selected.
            <br />
            Start or select a session from the toolbar.
          </div>
        </div>
      )}
    </div>
  )
}
