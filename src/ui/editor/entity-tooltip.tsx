import { createPortal } from 'react-dom'
import { Shield, User, Skull, Package, MapPin, EyeOff } from 'lucide-react'
import type { Entity } from '@/domain/entity-types'
import { ENTITY_TYPE_CONFIGS } from '@/domain/entity-types'

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  Shield,
  User,
  Skull,
  Package,
  MapPin,
  EyeOff,
}

type EntityTooltipProps = {
  entity: Entity
  position: { x: number; y: number }
  onMouseEnter: () => void
  onMouseLeave: () => void
}

export function EntityTooltip({ entity, position, onMouseEnter, onMouseLeave }: EntityTooltipProps) {
  const config = ENTITY_TYPE_CONFIGS.find((c) => c.type === entity.type)
  const Icon = config ? ICON_MAP[config.icon] : null
  const lastStatus = entity.statusHistory.length > 0
    ? entity.statusHistory[entity.statusHistory.length - 1]
    : null

  const descriptionPreview = entity.description
    ? entity.description.length > 80
      ? entity.description.slice(0, 80) + '...'
      : entity.description
    : null

  return createPortal(
    <div
      className="fixed z-50 pointer-events-auto"
      style={{
        left: position.x,
        top: position.y - 8,
        transform: 'translate(-50%, -100%)',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className="px-3 py-2 rounded-lg shadow-xl max-w-[220px]
          glass-panel border border-border"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {/* Header: icon + name + type */}
        <div className="flex items-center gap-1.5 mb-1">
          {Icon && (
            <Icon size={12} className="shrink-0" style={{ color: config?.color }} />
          )}
          <span
            className="text-xs font-semibold text-text-primary truncate"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {entity.name}
          </span>
          <span
            className="text-[9px] px-1 py-px rounded-full font-medium shrink-0"
            style={{
              backgroundColor: `${config?.color}22`,
              color: config?.color,
            }}
          >
            {config?.label}
          </span>
        </div>

        {/* Description preview */}
        {descriptionPreview && (
          <p className="text-[10px] text-text-muted leading-relaxed mb-1">
            {descriptionPreview}
          </p>
        )}

        {/* Current status */}
        {lastStatus && (
          <div className="flex items-center gap-1">
            <span
              className="text-[9px] px-1 py-px rounded font-medium"
              style={{
                backgroundColor: `${config?.color}18`,
                color: config?.color,
              }}
            >
              +{lastStatus.status}
            </span>
          </div>
        )}
      </div>

      {/* Arrow */}
      <div
        className="w-2 h-2 rotate-45 mx-auto -mt-1 border-r border-b border-border"
        style={{ backgroundColor: 'var(--color-surface-glass)' }}
      />
    </div>,
    document.body,
  )
}
