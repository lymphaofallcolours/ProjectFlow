import { useState, useCallback, useEffect, useRef } from 'react'
import { Play, Square, ChevronDown, Trash2, Clock } from 'lucide-react'
import { useSessionStore } from '@/application/session-store'

export function SessionSelector() {
  const [open, setOpen] = useState(false)
  const [labelInput, setLabelInput] = useState('')
  const [showNewInput, setShowNewInput] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const playthroughLog = useSessionStore((s) => s.playthroughLog)
  const activeSessionId = useSessionStore((s) => s.activeSessionId)
  const startSession = useSessionStore((s) => s.startSession)
  const endSession = useSessionStore((s) => s.endSession)
  const selectSession = useSessionStore((s) => s.selectSession)
  const deleteSession = useSessionStore((s) => s.deleteSession)

  const activeSession = playthroughLog.find((e) => e.id === activeSessionId)
  const hasActiveSession = !!activeSessionId

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setShowNewInput(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    if (showNewInput) inputRef.current?.focus()
  }, [showNewInput])

  const handleStartSession = useCallback(() => {
    const label = labelInput.trim() || undefined
    const id = startSession(label)
    selectSession(id)
    setLabelInput('')
    setShowNewInput(false)
    setOpen(false)
  }, [labelInput, startSession, selectSession])

  const handleEndSession = useCallback(() => {
    endSession()
    setOpen(false)
  }, [endSession])

  const handleSelectSession = useCallback(
    (id: string) => {
      selectSession(id)
      setOpen(false)
    },
    [selectSession],
  )

  const handleDeleteSession = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation()
      deleteSession(id)
    },
    [deleteSession],
  )

  const displayLabel = activeSession?.sessionLabel ?? (hasActiveSession ? 'Active Session' : 'No Session')

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
          transition-all duration-100 cursor-pointer
          ${hasActiveSession
            ? 'text-status-played bg-status-played/10 hover:bg-status-played/15'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-glass'}`}
        style={{ fontFamily: 'var(--font-display)' }}
        title="Session"
      >
        {hasActiveSession ? <Play size={14} fill="currentColor" /> : <Clock size={14} />}
        <span className="hidden sm:inline max-w-[140px] truncate">{displayLabel}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 min-w-[240px] glass-panel rounded-xl p-1 shadow-xl z-[80]">
          {/* New session controls */}
          {!hasActiveSession && !showNewInput && (
            <button
              onClick={() => setShowNewInput(true)}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs
                text-status-played hover:bg-status-played/10 cursor-pointer transition-colors"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Play size={13} />
              Start New Session
            </button>
          )}

          {!hasActiveSession && showNewInput && (
            <div className="px-2 py-2">
              <input
                ref={inputRef}
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === 'Enter') handleStartSession()
                  if (e.key === 'Escape') setShowNewInput(false)
                }}
                placeholder="Session label (optional)"
                className="w-full px-2 py-1.5 rounded-md text-xs bg-surface-glass border border-border
                  text-text-primary placeholder:text-text-muted outline-none focus:border-status-played"
                style={{ fontFamily: 'var(--font-body)' }}
              />
              <div className="flex gap-1 mt-1.5">
                <button
                  onClick={handleStartSession}
                  className="flex-1 px-2 py-1 rounded-md text-[10px] font-medium
                    bg-status-played/15 text-status-played hover:bg-status-played/25
                    cursor-pointer transition-colors"
                >
                  Start
                </button>
                <button
                  onClick={() => setShowNewInput(false)}
                  className="px-2 py-1 rounded-md text-[10px] text-text-muted
                    hover:text-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {hasActiveSession && (
            <button
              onClick={handleEndSession}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs
                text-status-skipped hover:bg-status-skipped/10 cursor-pointer transition-colors"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Square size={13} />
              End Session
            </button>
          )}

          {/* Session list */}
          {playthroughLog.length > 0 && (
            <>
              <div className="h-px bg-border my-1 mx-2" />
              <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-text-muted font-medium">
                Sessions
              </div>
              <div className="max-h-[200px] overflow-y-auto">
                {[...playthroughLog].reverse().map((session) => {
                  const isActive = session.id === activeSessionId
                  return (
                    <button
                      key={session.id}
                      onClick={() => handleSelectSession(session.id)}
                      className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs text-left
                        cursor-pointer transition-colors group
                        ${isActive
                          ? 'bg-surface-glass text-text-primary font-medium'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-glass'}`}
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: isActive ? 'var(--color-status-played)' : 'var(--color-status-unvisited)' }}
                      />
                      <span className="truncate flex-1">
                        {session.sessionLabel ?? `Session ${session.sessionDate}`}
                      </span>
                      <span className="text-[10px] text-text-muted shrink-0">
                        {session.nodesVisited.length}n
                      </span>
                      {!isActive && (
                        <span
                          onClick={(e) => handleDeleteSession(e, session.id)}
                          className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-status-skipped
                            transition-opacity shrink-0"
                        >
                          <Trash2 size={11} />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
