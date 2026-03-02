import { memo } from 'react'
import { Shield, User, Skull, Package, MapPin, EyeOff } from 'lucide-react'
import type { Entity } from '@/domain/entity-types'
import { ENTITY_TYPE_CONFIGS } from '@/domain/entity-types'

type EntityListProps = {
  entities: Entity[]
  onSelect: (id: string) => void
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Shield, User, Skull, Package, MapPin, EyeOff,
}

export const EntityList = memo(function EntityList({ entities, onSelect }: EntityListProps) {
  if (entities.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-xs text-text-muted">
        No entities found
      </div>
    )
  }

  return (
    <div className="py-1">
      {entities.map((entity) => {
        const config = ENTITY_TYPE_CONFIGS.find((c) => c.type === entity.type)
        const IconComponent = config ? ICON_MAP[config.icon] : null
        const latestStatus = entity.statusHistory.length > 0
          ? entity.statusHistory[entity.statusHistory.length - 1]
          : null

        return (
          <button
            key={entity.id}
            onClick={() => onSelect(entity.id)}
            className="w-full flex items-start gap-2.5 px-4 py-2 text-left
              hover:bg-surface-glass transition-colors cursor-pointer group"
          >
            {/* Type icon */}
            <div
              className="mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${config?.color}22`, color: config?.color }}
            >
              {IconComponent && <IconComponent size={11} />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-text-primary truncate">
                  {entity.name}
                </span>
                {latestStatus && (
                  <span
                    className="text-[10px] px-1 py-px rounded shrink-0"
                    style={{
                      backgroundColor: `${config?.color}18`,
                      color: config?.color,
                    }}
                  >
                    +{latestStatus.status}
                  </span>
                )}
              </div>
              {entity.description && (
                <p className="text-[11px] text-text-muted truncate mt-0.5">
                  {entity.description}
                </p>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
})
