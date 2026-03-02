import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { EntityChip } from './entity-chip'

export function EntityChipNodeView({ node }: NodeViewProps) {
  const { name, entityType, mode, status } = node.attrs

  return (
    <NodeViewWrapper as="span" className="inline">
      <EntityChip
        name={name}
        entityType={entityType}
        mode={mode}
        status={status}
      />
    </NodeViewWrapper>
  )
}
