import { useState, useCallback } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { StoryNode, FieldDefinition } from '@/domain/types'
import { isFieldPopulated } from '@/domain/graph-operations'
import { FieldIcon } from './field-icon'
import { FieldEditor } from './field-editors/field-editor'

type CockpitFieldPanelProps = {
  node: StoryNode
  fieldDef: FieldDefinition
  forceExpanded?: boolean
  scrollableMode?: boolean
}

/**
 * A single field panel within the cockpit grid. Shows the field icon,
 * label, and editor. All panels start expanded by default.
 * Click header to collapse/expand individually.
 */
export function CockpitFieldPanel({ node, fieldDef, forceExpanded, scrollableMode }: CockpitFieldPanelProps) {
  const populated = isFieldPopulated(node.fields, fieldDef.key)
  const [expanded, setExpanded] = useState(forceExpanded ?? true)

  const toggle = useCallback(() => setExpanded((v) => !v), [])

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      {/* Header — always visible, clickable to expand/collapse */}
      <button
        onClick={toggle}
        className="w-full flex items-center gap-2 px-3.5 py-2.5 cursor-pointer
          hover:bg-white/5 transition-colors"
      >
        <FieldIcon
          name={fieldDef.icon}
          size={15}
          style={{ color: fieldDef.color }}
        />
        <span
          className="text-xs font-semibold text-text-primary tracking-wide"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {fieldDef.label}
        </span>

        {/* Populated indicator dot */}
        {populated && (
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: fieldDef.color }}
          />
        )}

        <span className="ml-auto text-text-muted">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      {/* Editor body — collapsible, optionally scrollable */}
      {expanded && (
        <div className={`px-3.5 pb-3.5 border-t border-border ${scrollableMode ? 'max-h-[300px] overflow-y-auto' : ''}`}>
          <div className="pt-3">
            <FieldEditor node={node} fieldKey={fieldDef.key} />
          </div>
        </div>
      )}
    </div>
  )
}
