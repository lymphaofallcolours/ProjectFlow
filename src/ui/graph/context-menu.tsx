import { useCallback, useEffect, useRef, useState } from 'react'
import { Trash2, Copy, CheckCircle, Edit3, XCircle, Circle } from 'lucide-react'
import type { SceneType, PlaythroughStatus } from '@/domain/types'
import { SCENE_TYPES, SCENE_TYPE_CONFIG } from '@/domain/types'
import { PLAYTHROUGH_STATUSES, PLAYTHROUGH_STATUS_CONFIG } from '@/domain/playthrough-operations'
import { useGraphStore } from '@/application/graph-store'
import { useSessionStore } from '@/application/session-store'
import { PlaythroughNotesInput } from './playthrough-notes-input'

type ContextMenuProps = {
  nodeId: string
  position: { x: number; y: number }
  onClose: () => void
}

const SHAPE_ICONS: Record<SceneType, string> = {
  event: '○',
  narration: '□',
  combat: '△',
  social: '◇',
  investigation: '⬡',
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  played_as_planned: <CheckCircle size={13} />,
  modified: <Edit3 size={13} />,
  skipped: <XCircle size={13} />,
  unvisited: <Circle size={13} />,
}

export function NodeContextMenu({ nodeId, position, onClose }: ContextMenuProps) {
  const deleteNode = useGraphStore((s) => s.deleteNode)
  const duplicateNode = useGraphStore((s) => s.duplicateNode)
  const changeSceneType = useGraphStore((s) => s.changeSceneType)
  const setPlaythroughStatus = useGraphStore((s) => s.setPlaythroughStatus)
  const currentType = useGraphStore((s) => s.nodes[nodeId]?.sceneType)
  const currentPlaythroughStatus = useGraphStore((s) => s.nodes[nodeId]?.playthroughStatus)
  const recordNodeVisit = useSessionStore((s) => s.recordNodeVisit)
  const activeSessionId = useSessionStore((s) => s.activeSessionId)
  const ref = useRef<HTMLDivElement>(null)

  const [awaitingNotes, setAwaitingNotes] = useState(false)

  const handleDelete = useCallback(() => {
    deleteNode(nodeId)
    onClose()
  }, [deleteNode, nodeId, onClose])

  const handleDuplicate = useCallback(() => {
    duplicateNode(nodeId)
    onClose()
  }, [duplicateNode, nodeId, onClose])

  const handleChangeType = useCallback(
    (sceneType: SceneType) => {
      changeSceneType(nodeId, sceneType)
      onClose()
    },
    [changeSceneType, nodeId, onClose],
  )

  const handleSetStatus = useCallback(
    (status: PlaythroughStatus, notes?: string) => {
      setPlaythroughStatus(nodeId, status, notes)
      if (activeSessionId) {
        recordNodeVisit(nodeId, status, notes)
      }
      onClose()
    },
    [setPlaythroughStatus, recordNodeVisit, nodeId, activeSessionId, onClose],
  )

  const handleStatusClick = useCallback(
    (status: PlaythroughStatus) => {
      if (status === 'modified') {
        setAwaitingNotes(true)
      } else {
        handleSetStatus(status)
      }
    },
    [handleSetStatus],
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="fixed glass-panel rounded-xl p-1 min-w-[180px] shadow-xl z-[100]"
      style={{ top: position.y, left: position.x }}
    >
      {/* Scene type submenu */}
      <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-text-muted font-medium">
        Scene Type
      </div>
      {SCENE_TYPES.map((type) => {
        const config = SCENE_TYPE_CONFIG[type]
        const isActive = type === currentType
        return (
          <MenuItem
            key={type}
            icon={
              <span
                className="text-sm w-4 text-center"
                style={{ color: `var(--color-${config.color})` }}
              >
                {SHAPE_ICONS[type]}
              </span>
            }
            label={config.label}
            active={isActive}
            onClick={() => handleChangeType(type)}
          />
        )
      })}

      <div className="h-px bg-border my-1 mx-2" />

      {/* Playthrough status submenu */}
      <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-text-muted font-medium">
        Playthrough
      </div>
      {PLAYTHROUGH_STATUSES.map((status) => {
        const config = PLAYTHROUGH_STATUS_CONFIG[status]
        const isActive = status === currentPlaythroughStatus
        return (
          <MenuItem
            key={status}
            icon={
              <span style={{ color: `var(--color-${config.color})` }}>
                {STATUS_ICONS[status]}
              </span>
            }
            label={config.label}
            active={isActive}
            onClick={() => handleStatusClick(status)}
          />
        )
      })}

      {awaitingNotes && (
        <PlaythroughNotesInput
          onConfirm={(notes) => handleSetStatus('modified', notes)}
          onCancel={onClose}
        />
      )}

      <div className="h-px bg-border my-1 mx-2" />

      <MenuItem
        icon={<Copy size={14} className="text-text-muted" />}
        label="Duplicate"
        onClick={handleDuplicate}
      />
      <MenuItem
        icon={<Trash2 size={14} className="text-status-skipped" />}
        label="Delete"
        onClick={handleDelete}
        destructive
      />
    </div>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
  active,
  destructive,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
  destructive?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-left text-xs
        transition-colors duration-100 cursor-pointer
        ${active ? 'bg-surface-glass text-text-primary font-medium' : ''}
        ${destructive ? 'text-status-skipped hover:bg-status-skipped/10' : 'text-text-secondary hover:text-text-primary hover:bg-surface-glass'}`}
      style={{ fontFamily: 'var(--font-display)' }}
    >
      {icon}
      {label}
    </button>
  )
}
