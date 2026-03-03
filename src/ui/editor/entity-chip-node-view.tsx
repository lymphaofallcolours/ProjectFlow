import { useCallback, useState, useRef } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { EntityChip } from './entity-chip'
import { EntityTooltip } from './entity-tooltip'
import { useUIStore } from '@/application/ui-store'
import { useEntityStore } from '@/application/entity-store'

export function EntityChipNodeView({ node }: NodeViewProps) {
  const { name, entityType, mode, status } = node.attrs
  const openEntitySidebar = useUIStore((s) => s.openEntitySidebar)
  const selectEntity = useUIStore((s) => s.selectEntity)
  const getByName = useEntityStore((s) => s.getByName)

  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const chipRef = useRef<HTMLSpanElement>(null)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleClick = useCallback(() => {
    const entity = getByName(name, entityType)
    if (entity) {
      openEntitySidebar()
      selectEntity(entity.id)
    }
  }, [name, entityType, getByName, openEntitySidebar, selectEntity])

  const handleMouseEnter = useCallback(() => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current)
      hideTimeout.current = null
    }
    hoverTimeout.current = setTimeout(() => {
      if (chipRef.current) {
        const rect = chipRef.current.getBoundingClientRect()
        setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top })
      }
      setShowTooltip(true)
    }, 300)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current)
      hoverTimeout.current = null
    }
    hideTimeout.current = setTimeout(() => {
      setShowTooltip(false)
    }, 150)
  }, [])

  const entity = getByName(name, entityType)

  return (
    <NodeViewWrapper as="span" className="inline">
      <span
        ref={chipRef}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="cursor-pointer"
      >
        <EntityChip
          name={name}
          entityType={entityType}
          mode={mode}
          status={status}
        />
      </span>
      {showTooltip && entity && (
        <EntityTooltip
          entity={entity}
          position={tooltipPos}
          onMouseEnter={() => {
            if (hideTimeout.current) {
              clearTimeout(hideTimeout.current)
              hideTimeout.current = null
            }
          }}
          onMouseLeave={handleMouseLeave}
        />
      )}
    </NodeViewWrapper>
  )
}
