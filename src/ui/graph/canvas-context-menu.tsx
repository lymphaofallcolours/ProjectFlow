import type { ReactNode } from 'react'
import { useState, useCallback, useEffect, useRef } from 'react'
import { LayoutGrid } from 'lucide-react'
import type { SceneType } from '@/domain/types'
import { SCENE_TYPES, SCENE_TYPE_CONFIG } from '@/domain/types'
import { useGraphStore } from '@/application/graph-store'
import { useEscapeKey } from '@/ui/hooks/use-escape-key'
import { useMenuPosition } from '@/ui/hooks/use-menu-position'
import { ConfirmDialog } from '@/ui/components/confirm-dialog'

type CanvasContextMenuProps = {
  position: { x: number; y: number }
  flowPosition: { x: number; y: number }
  onClose: () => void
}

function BannerIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="9" viewBox="0 0 14 9" className="inline-block">
      <path d="M2,0 L12,0 L14,4.5 L12,9 L2,9 L0,4.5 Z" fill={color} opacity="0.8" />
    </svg>
  )
}

const SHAPE_ICONS: Record<SceneType, ReactNode> = {
  event: '○',
  narration: '□',
  combat: '△',
  social: '◇',
  investigation: '⬡',
  divider: null,
  group: null,
}

export function CanvasContextMenu({ position, flowPosition, onClose }: CanvasContextMenuProps) {
  const addNode = useGraphStore((s) => s.addNode)
  const autoArrange = useGraphStore((s) => s.autoArrange)
  const ref = useRef<HTMLDivElement>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleCreate = useCallback(
    (sceneType: SceneType) => {
      addNode(sceneType, flowPosition)
      onClose()
    },
    [addNode, flowPosition, onClose],
  )

  const handleAutoArrangeAll = useCallback(() => {
    setShowConfirm(true)
  }, [])

  const handleConfirmArrange = useCallback(() => {
    autoArrange()
    onClose()
  }, [autoArrange, onClose])

  useEscapeKey(onClose)
  useMenuPosition(ref, position)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        if (!showConfirm) onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose, showConfirm])

  return (
    <>
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
          const accentColor = `var(--color-${config.color})`
          return (
            <div key={type}>
              {type === 'divider' && <div className="h-px bg-border my-1 mx-2" />}
              <button
                onClick={() => handleCreate(type)}
                className="flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-left text-xs
                  text-text-secondary hover:text-text-primary hover:bg-surface-glass
                  transition-colors duration-100 cursor-pointer"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <span
                  className="text-sm w-4 text-center"
                  style={{ color: accentColor }}
                >
                  {type === 'divider' ? <BannerIcon color={accentColor} /> : SHAPE_ICONS[type]}
                </span>
                {config.label}
              </button>
            </div>
          )
        })}

        <div className="h-px bg-border my-1 mx-2" />

        <button
          onClick={handleAutoArrangeAll}
          className="flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-left text-xs
            text-text-secondary hover:text-text-primary hover:bg-surface-glass
            transition-colors duration-100 cursor-pointer"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <LayoutGrid size={14} className="text-text-muted" />
          Auto-Arrange All
        </button>
      </div>

      {showConfirm && (
        <ConfirmDialog
          message="Rearrange all nodes? This will reposition every node using automatic layout."
          onConfirm={handleConfirmArrange}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  )
}
