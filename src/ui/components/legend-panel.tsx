import { X } from 'lucide-react'
import { ENTITY_TYPE_CONFIGS } from '@/domain/entity-types'
import { useUIStore } from '@/application/ui-store'

export function LegendPanel() {
  const isOpen = useUIStore((s) => s.legendPanelOpen)
  const toggle = useUIStore((s) => s.toggleLegendPanel)

  if (!isOpen) return null

  return (
    <div
      className="absolute bottom-12 right-4 z-30 glass-panel rounded-xl shadow-2xl
        w-72 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span
          className="text-xs font-semibold text-text-primary tracking-wide"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Entity Tag Syntax
        </span>
        <button
          onClick={toggle}
          className="p-0.5 rounded text-text-muted hover:text-text-primary
            transition-colors cursor-pointer"
        >
          <X size={12} />
        </button>
      </div>

      {/* Table */}
      <div className="px-3 py-2">
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
                <td className="py-1.5 pr-2">
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
                <td className="py-1.5 text-text-secondary">
                  {cfg.prefix}@Name
                </td>
                <td className="py-1.5 text-text-secondary">
                  {cfg.prefix}#Name
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status marker hint */}
      <div className="px-3 py-2 border-t border-border/40">
        <p className="text-[10px] text-text-muted">
          <span className="text-text-secondary font-medium" style={{ fontFamily: 'var(--font-mono)' }}>
            +status
          </span>
          {' '}suffix marks state changes:{' '}
          <span style={{ fontFamily: 'var(--font-mono)' }}>@Alfa+wounded</span>
        </p>
      </div>

      {/* Keyboard shortcut hint */}
      <div className="px-3 py-1.5 border-t border-border/40 text-[9px] text-text-muted text-center">
        <kbd className="px-1 py-0.5 rounded bg-surface-glass border border-border text-text-secondary">
          Ctrl+/
        </kbd>
        {' '}to toggle
      </div>
    </div>
  )
}
