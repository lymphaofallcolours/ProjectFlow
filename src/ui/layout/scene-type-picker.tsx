import { useCallback, useEffect, useRef } from 'react'
import type { SceneType } from '@/domain/types'
import { SCENE_TYPES, SCENE_TYPE_CONFIG } from '@/domain/types'
import { useGraphStore } from '@/application/graph-store'

const SHAPE_ICONS: Record<SceneType, string> = {
  event: '○',
  narration: '□',
  combat: '△',
  social: '◇',
  investigation: '⬡',
  divider: '▬',
}

export function SceneTypePicker({ onClose }: { onClose: () => void }) {
  const addNode = useGraphStore((s) => s.addNode)
  const viewport = useGraphStore((s) => s.viewport)
  const ref = useRef<HTMLDivElement>(null)

  const handleSelect = useCallback(
    (sceneType: SceneType) => {
      const centerX = -viewport.x + window.innerWidth / 2 / viewport.zoom
      const centerY = -viewport.y + window.innerHeight / 2 / viewport.zoom
      addNode(sceneType, { x: centerX - 60, y: centerY - 50 })
      onClose()
    },
    [addNode, viewport, onClose],
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 glass-panel rounded-xl p-1 min-w-[180px] shadow-lg z-50"
    >
      {SCENE_TYPES.map((type) => {
        const config = SCENE_TYPE_CONFIG[type]
        return (
          <div key={type}>
            {type === 'divider' && <div className="h-px bg-border my-1 mx-2" />}
            <button
              onClick={() => handleSelect(type)}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-left
                text-text-secondary hover:text-text-primary hover:bg-surface-glass
                transition-colors duration-100 cursor-pointer"
            >
              <span
                className="text-base font-light w-5 text-center"
                style={{ color: `var(--color-${config.color})` }}
              >
                {SHAPE_ICONS[type]}
              </span>
              <span className="text-xs font-medium" style={{ fontFamily: 'var(--font-display)' }}>
                {config.label}
              </span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
