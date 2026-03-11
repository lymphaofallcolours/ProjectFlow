import { useCallback, useState, useRef } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { createPortal } from 'react-dom'
import { FieldIcon } from '@/ui/overlays/field-icon'
import { useUIStore } from '@/application/ui-store'
import { useGraphStore } from '@/application/graph-store'
import type { FieldKey, NodeFields, RichContent, ConditionEntry } from '@/domain/types'

function getFieldPreview(fields: NodeFields, fieldKey: FieldKey): string {
  const value = fields[fieldKey]

  if (Array.isArray(value)) {
    if (fieldKey === 'dialogues') {
      return (value as NodeFields['dialogues'])
        .slice(0, 3)
        .map((d) => `${d.entityRef}: ${d.line}`)
        .join('\n')
    }
    if (fieldKey === 'soundtrack') {
      return (value as NodeFields['soundtrack'])
        .slice(0, 3)
        .map((s) => s.trackName)
        .join(', ')
    }
    if (fieldKey === 'diceRolls') {
      return (value as NodeFields['diceRolls'])
        .slice(0, 3)
        .map((d) => `${d.description}${d.formula ? ` (${d.formula})` : ''}`)
        .join('\n')
    }
    if (fieldKey === 'conditions') {
      return (value as ConditionEntry[])
        .slice(0, 3)
        .map((c) => `${c.status === 'met' ? '●' : c.status === 'unmet' ? '○' : '?'} ${c.description}`)
        .join('\n')
    }
    if (fieldKey === 'custom') {
      return (value as NodeFields['custom'])
        .slice(0, 3)
        .map((c) => `${c.label}: ${c.content.markdown.slice(0, 50)}`)
        .join('\n')
    }
    return value.length === 0 ? '(empty)' : `${value.length} entries`
  }

  const md = (value as RichContent).markdown
  return md ? md.slice(0, 200) : '(empty)'
}

export function FieldLinkNodeView({ node }: NodeViewProps) {
  const { fieldKey, fieldLabel, fieldColor, fieldIcon } = node.attrs
  const openFieldPanel = useUIStore((s) => s.openFieldPanel)

  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const chipRef = useRef<HTMLSpanElement>(null)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Get the nodeId from the active overlay context
  const activeOverlay = useUIStore((s) => s.activeOverlay)
  const nodeId = activeOverlay?.type === 'field-panel' ? activeOverlay.nodeId
    : activeOverlay?.type === 'cockpit' ? activeOverlay.nodeId
    : null
  const nodeFields = useGraphStore((s) => {
    if (!nodeId) return null
    return s.nodes[nodeId]?.fields ?? null
  })

  const handleClick = useCallback(() => {
    if (nodeId && fieldKey) {
      openFieldPanel(nodeId, fieldKey as FieldKey)
    }
  }, [nodeId, fieldKey, openFieldPanel])

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

  const preview = nodeFields ? getFieldPreview(nodeFields, fieldKey as FieldKey) : null

  return (
    <NodeViewWrapper as="span" className="inline">
      <span
        ref={chipRef}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md
          cursor-pointer transition-all duration-100
          hover:brightness-110"
        style={{
          background: `color-mix(in srgb, ${fieldColor} 15%, transparent)`,
          color: fieldColor,
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          verticalAlign: 'baseline',
        }}
      >
        <FieldIcon name={fieldIcon} size={11} />
        <span>{fieldLabel}</span>
      </span>
      {showTooltip && preview && createPortal(
        <div
          className="fixed z-[9999] glass-panel rounded-lg shadow-lg px-3 py-2
            max-w-[240px] text-[11px] text-text-secondary whitespace-pre-wrap
            leading-relaxed pointer-events-none"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y - 8}px`,
            transform: 'translate(-50%, -100%)',
            borderTop: `2px solid ${fieldColor}`,
          }}
          onMouseEnter={() => {
            if (hideTimeout.current) {
              clearTimeout(hideTimeout.current)
              hideTimeout.current = null
            }
          }}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className="text-[10px] font-semibold uppercase tracking-wider mb-1"
            style={{ color: fieldColor, fontFamily: 'var(--font-display)' }}
          >
            {fieldLabel}
          </div>
          {preview}
        </div>,
        document.body,
      )}
    </NodeViewWrapper>
  )
}
