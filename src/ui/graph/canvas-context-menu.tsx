import { useCallback, useEffect, useRef } from 'react'
import type { SceneType } from '@/domain/types'
import { SCENE_TYPES, SCENE_TYPE_CONFIG } from '@/domain/types'
import { useGraphStore } from '@/application/graph-store'

type CanvasContextMenuProps = {
  position: { x: number; y: number }
  flowPosition: { x: number; y: number }
  onClose: () => void
}

const SHAPE_ICONS: Record<SceneType, string> = {
  event: '○',
  narration: '□',
  combat: '△',
  social: '◇',
  investigation: '⬡',
}

export function CanvasContextMenu({ position, flowPosition, onClose }: CanvasContextMenuProps) {
  const addNode = useGraphStore((s) => s.addNode)
  const ref = useRef<HTMLDivElement>(null)

  const handleCreate = useCallback(
    (sceneType: SceneType) => {
      addNode(sceneType, flowPosition)
      onClose()
    },
    [addNode, flowPosition, onClose],
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
      <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-text-muted font-medium">
        New Node
      </div>
      {SCENE_TYPES.map((type) => {
        const config = SCENE_TYPE_CONFIG[type]
        return (
          <button
            key={type}
            onClick={() => handleCreate(type)}
            className="flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-left text-xs
              text-text-secondary hover:text-text-primary hover:bg-surface-glass
              transition-colors duration-100 cursor-pointer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span
              className="text-sm w-4 text-center"
              style={{ color: `var(--color-${config.color})` }}
            >
              {SHAPE_ICONS[type]}
            </span>
            {config.label}
          </button>
        )
      })}
    </div>
  )
}
