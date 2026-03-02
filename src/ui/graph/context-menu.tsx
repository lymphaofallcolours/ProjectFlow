import { useCallback, useEffect, useRef } from 'react'
import { Trash2, Copy } from 'lucide-react'
import type { SceneType } from '@/domain/types'
import { SCENE_TYPES, SCENE_TYPE_CONFIG } from '@/domain/types'
import { useGraphStore } from '@/application/graph-store'

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

export function NodeContextMenu({ nodeId, position, onClose }: ContextMenuProps) {
  const deleteNode = useGraphStore((s) => s.deleteNode)
  const duplicateNode = useGraphStore((s) => s.duplicateNode)
  const changeSceneType = useGraphStore((s) => s.changeSceneType)
  const currentType = useGraphStore((s) => s.nodes[nodeId]?.sceneType)
  const ref = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
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
