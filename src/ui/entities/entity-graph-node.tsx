import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps, Node } from '@xyflow/react'
import type { EntityType } from '@/domain/entity-types'
import { ENTITY_TYPE_CONFIGS } from '@/domain/entity-types'

export type EntityGraphNodeData = {
  entityId: string
  name: string
  entityType: EntityType
}

export type EntityFlowNode = Node<EntityGraphNodeData, 'entity'>

const ABBREVIATIONS: Record<EntityType, string> = {
  pc: 'PC',
  npc: 'NP',
  enemy: 'EN',
  object: 'OB',
  location: 'LO',
  secret: 'SE',
}

export const EntityGraphNodeComponent = memo(function EntityGraphNodeComponent({
  data,
}: NodeProps<EntityFlowNode>) {
  const cfg = ENTITY_TYPE_CONFIGS.find((c) => c.type === data.entityType)
  const color = cfg?.color ?? '#888'
  const abbr = ABBREVIATIONS[data.entityType]

  return (
    <div className="flex flex-col items-center" style={{ width: 72 }}>
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-[11px]
          font-bold text-white/90 border-2 shadow-md"
        style={{ backgroundColor: color, borderColor: `${color}80` }}
      >
        {abbr}
      </div>
      <span
        className="mt-1 text-[10px] font-medium text-text-primary text-center leading-tight
          max-w-[72px] truncate"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {data.name}
      </span>
      <span className="text-[8px] text-text-muted">{cfg?.label}</span>
      <Handle type="target" position={Position.Top} className="!w-0 !h-0 !opacity-0" />
      <Handle type="source" position={Position.Bottom} className="!w-0 !h-0 !opacity-0" />
    </div>
  )
})
