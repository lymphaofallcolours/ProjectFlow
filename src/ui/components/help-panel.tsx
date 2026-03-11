import { useState } from 'react'
import { X, ChevronDown, ChevronRight } from 'lucide-react'
import { ENTITY_TYPE_CONFIGS } from '@/domain/entity-types'
import { FIELD_DEFINITIONS } from '@/domain/types'
import { useUIStore } from '@/application/ui-store'

const SHORTCUTS = [
  ['Ctrl+S', 'Save'],
  ['Ctrl+A', 'Select all'],
  ['Ctrl+F', 'Search'],
  ['Ctrl+E', 'Entities'],
  ['Ctrl+/', 'Help'],
  ['Ctrl+T', 'Timeline'],
  ['Ctrl+D', 'Diff overlay'],
  ['Ctrl+Z', 'Undo'],
  ['Ctrl+Shift+Z', 'Redo'],
  ['Ctrl+Shift+R', 'Relationships'],
  ['Ctrl+C/X/V', 'Clipboard'],
  ['Delete', 'Delete selected'],
  ['Escape', 'Dismiss'],
  ['Shift', 'Subnodes'],
] as const

const INTERACTIONS = [
  ['Click node', 'Select'],
  ['Shift+Click', 'Subnodes'],
  ['Double-click', 'Open cockpit'],
  ['Long-press', 'Subnodes'],
  ['Right-click', 'Context menu'],
  ['Ctrl+Click', 'Multi-select'],
  ['Drag canvas', 'Box-select'],
  ['Scroll', 'Pan'],
] as const

function Section({
  title,
  defaultOpen,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen ?? false)

  return (
    <div className="border-b border-border/40 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 w-full px-3 py-2 text-xs font-semibold
          text-text-primary hover:bg-surface-glass/50 transition-colors cursor-pointer"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {title}
      </button>
      {open && <div className="px-3 pb-2.5">{children}</div>}
    </div>
  )
}

export function HelpPanel() {
  const isOpen = useUIStore((s) => s.legendPanelOpen)
  const toggle = useUIStore((s) => s.toggleLegendPanel)

  if (!isOpen) return null

  return (
    <div
      className="absolute bottom-12 right-4 z-30 glass-panel rounded-xl shadow-2xl
        w-80 max-h-[70vh] flex flex-col overflow-hidden"
    >
      {/* Sticky header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <span
          className="text-xs font-semibold text-text-primary tracking-wide"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Help & Reference
        </span>
        <button
          onClick={toggle}
          className="p-0.5 rounded text-text-muted hover:text-text-primary
            transition-colors cursor-pointer"
        >
          <X size={12} />
        </button>
      </div>

      {/* Scrollable sections */}
      <div className="overflow-y-auto">
        {/* Entity Tags */}
        <Section title="Entity Tags" defaultOpen>
          <table className="w-full text-[10px]" style={{ fontFamily: 'var(--font-mono)' }}>
            <thead>
              <tr className="text-text-muted text-left">
                <th className="pb-1.5 font-medium">Type</th>
                <th className="pb-1.5 font-medium">Present</th>
                <th className="pb-1.5 font-medium">Mentioned</th>
              </tr>
            </thead>
            <tbody>
              {ENTITY_TYPE_CONFIGS.map((cfg) => (
                <tr key={cfg.type} className="border-t border-border/40">
                  <td className="py-1 pr-2">
                    <span
                      className="inline-flex items-center gap-1 font-medium"
                      style={{ color: cfg.color }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: cfg.color }}
                      />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="py-1 text-text-secondary">
                    {cfg.prefix}@Name
                  </td>
                  <td className="py-1 text-text-secondary">
                    {cfg.prefix}#Name
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1.5 text-[10px] text-text-muted">
            <span className="text-text-secondary font-medium" style={{ fontFamily: 'var(--font-mono)' }}>
              +status
            </span>
            {' '}suffix marks state changes:{' '}
            <span style={{ fontFamily: 'var(--font-mono)' }}>@Alfa+wounded</span>
          </p>
        </Section>

        {/* Field References */}
        <Section title="Field References">
          <p className="text-[10px] text-text-muted mb-1.5">
            Type{' '}
            <span className="text-text-secondary font-medium" style={{ fontFamily: 'var(--font-mono)' }}>
              /?
            </span>
            {' '}in any rich-text field to link to another field on the same node.
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            {FIELD_DEFINITIONS.map((f) => (
              <div key={f.key} className="flex items-center gap-1.5 text-[10px]">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: f.color }}
                />
                <span style={{ fontFamily: 'var(--font-mono)' }} className="text-text-secondary">
                  /?{f.label}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* Keyboard Shortcuts */}
        <Section title="Keyboard Shortcuts">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {SHORTCUTS.map(([key, action]) => (
              <div key={key} className="flex items-center gap-1.5 text-[10px]">
                <kbd className="px-1 py-0.5 rounded bg-surface-glass border border-border
                  text-text-secondary text-[9px] shrink-0"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {key}
                </kbd>
                <span className="text-text-muted truncate">{action}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Interactions */}
        <Section title="Interactions">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {INTERACTIONS.map(([input, result]) => (
              <div key={input} className="flex items-center gap-1.5 text-[10px]">
                <span className="text-text-secondary font-medium shrink-0">{input}</span>
                <span className="text-text-muted">→ {result}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Workflow */}
        <Section title="Workflow">
          <div className="text-[10px] text-text-muted space-y-1.5 leading-relaxed">
            <p>
              <span className="text-text-secondary font-medium">Save</span> writes the entire campaign
              (nodes, edges, entities, sessions) to a single JSON file. Uses the File System Access API
              when available — re-saves to the same file without prompting.
            </p>
            <p>
              <span className="text-text-secondary font-medium">Load</span> replaces the current campaign
              with data from a previously saved file. All unsaved changes are lost.
            </p>
            <p>
              <span className="text-text-secondary font-medium">Import Subgraph</span> merges nodes and
              edges from another file into the current campaign without replacing existing data.
            </p>
            <p>
              <span className="text-text-secondary font-medium">Auto-save</span> periodically saves
              to the last-used file handle. Enable via the timer icon in the toolbar.
            </p>
          </div>
        </Section>

        {/* Sessions & Diff */}
        <Section title="Sessions & Diff">
          <div className="text-[10px] text-text-muted space-y-1.5 leading-relaxed">
            <p>
              <span className="text-text-secondary font-medium">Sessions</span> represent individual
              play sessions. Each session captures a snapshot of node playthrough statuses. Use the
              session selector in the toolbar to switch between sessions or create new ones.
            </p>
            <p>
              <span className="text-text-secondary font-medium">Playthrough status</span> tracks which
              nodes have been played, skipped, or are pending in the current session. Right-click a
              node to change its status.
            </p>
            <p>
              <span className="text-text-secondary font-medium">Diff overlay</span> highlights changes
              between the current session and the previous one. New nodes glow green, modified nodes
              glow amber, and removed nodes glow red. Toggle with Ctrl+D or the eye icon.
            </p>
          </div>
        </Section>
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-border/40 text-[9px] text-text-muted text-center shrink-0">
        <kbd className="px-1 py-0.5 rounded bg-surface-glass border border-border text-text-secondary">
          Ctrl+/
        </kbd>
        {' '}to toggle
      </div>
    </div>
  )
}
