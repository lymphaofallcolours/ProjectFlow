import { useGraphStore } from '@/application/graph-store'
import { useUIStore } from '@/application/ui-store'
import { FIELD_DEFINITIONS } from '@/domain/types'
import type { FieldKey } from '@/domain/types'
import { OverlayBackdrop } from './overlay-backdrop'
import { FieldIcon } from './field-icon'
import { FieldEditor } from './field-editors/field-editor'

type FieldPanelProps = {
  nodeId: string
  fieldKey: FieldKey
}

export function FieldPanel({ nodeId, fieldKey }: FieldPanelProps) {
  const node = useGraphStore((s) => s.nodes[nodeId])
  const closeOverlay = useUIStore((s) => s.closeOverlay)
  const scrollDirection = useGraphStore((s) => s.scrollDirection)

  const fieldDef = FIELD_DEFINITIONS.find((f) => f.key === fieldKey)

  if (!node || !fieldDef) return null

  const isHorizontal = scrollDirection === 'horizontal'

  return (
    <OverlayBackdrop onDismiss={closeOverlay}>
      <div
        className={`h-full flex ${isHorizontal ? 'justify-start' : 'justify-center items-start pt-4'}`}
      >
        <div
          className={`glass-panel overflow-y-auto shadow-2xl
            ${isHorizontal
              ? 'w-[420px] h-full rounded-r-2xl'
              : 'w-[90%] max-w-[600px] max-h-[60vh] rounded-2xl'
            }`}
        >
          {/* Header */}
          <div
            className="sticky top-0 z-10 flex items-center gap-2.5 px-5 py-3.5 border-b border-border glass-panel"
          >
            <FieldIcon
              name={fieldDef.icon}
              size={18}
              style={{ color: fieldDef.color }}
            />
            <span
              className="text-sm font-semibold text-text-primary"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {fieldDef.label}
            </span>
            <span className="text-xs text-text-muted ml-auto">
              {node.label}
            </span>
          </div>

          {/* Editor */}
          <div className="p-5">
            <FieldEditor node={node} fieldKey={fieldKey} />
          </div>
        </div>
      </div>
    </OverlayBackdrop>
  )
}
