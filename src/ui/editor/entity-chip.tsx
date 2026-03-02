import { memo } from 'react'
import { Shield, User, Skull, Package, MapPin, EyeOff } from 'lucide-react'
import type { EntityType } from '@/domain/entity-types'
import { ENTITY_TYPE_CONFIGS } from '@/domain/entity-types'
import type { EntityTagMode } from '@/domain/entity-tag-parser'

type EntityChipProps = {
  name: string
  entityType: EntityType
  mode: EntityTagMode
  status?: string
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Shield,
  User,
  Skull,
  Package,
  MapPin,
  EyeOff,
}

function getConfig(entityType: EntityType) {
  return ENTITY_TYPE_CONFIGS.find((c) => c.type === entityType) ?? ENTITY_TYPE_CONFIGS[0]
}

export const EntityChip = memo(function EntityChip({
  name,
  entityType,
  mode,
  status,
}: EntityChipProps) {
  const config = getConfig(entityType)
  const IconComponent = ICON_MAP[config.icon]
  const isPresent = mode === 'present'

  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs
        font-medium align-baseline whitespace-nowrap cursor-default select-none
        transition-colors duration-100"
      style={{
        backgroundColor: isPresent ? `${config.color}22` : 'transparent',
        color: config.color,
        border: isPresent ? `1px solid ${config.color}44` : `1px dashed ${config.color}66`,
      }}
      title={`${config.label}: ${name}${status ? ` (+${status})` : ''}`}
    >
      {IconComponent && <IconComponent size={11} className="shrink-0" />}
      <span>{name}</span>
      {status && (
        <span
          className="ml-0.5 px-1 py-px rounded text-[10px] opacity-80"
          style={{ backgroundColor: `${config.color}18` }}
        >
          +{status}
        </span>
      )}
    </span>
  )
})
