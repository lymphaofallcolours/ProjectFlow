import { useCallback } from 'react'
import type { StoryNode, FieldKey, NodeFields } from '@/domain/types'
import { useGraphStore } from '@/application/graph-store'
import { RichContentEditor } from './rich-content-editor'
import { DialogueListEditor } from './dialogue-list-editor'
import { SoundtrackListEditor } from './soundtrack-list-editor'
import { DiceRollListEditor } from './dice-roll-list-editor'
import { ConditionsListEditor } from './conditions-list-editor'
import { CustomFieldEditor } from './custom-field-editor'

type FieldEditorProps = {
  node: StoryNode
  fieldKey: FieldKey
}

/** Dispatches to the appropriate editor based on the field's data type. */
export function FieldEditor({ node, fieldKey }: FieldEditorProps) {
  const updateField = useGraphStore((s) => s.updateField)

  const handleChange = useCallback(
    (value: NodeFields[FieldKey]) => {
      updateField(node.id, fieldKey, value)
    },
    [updateField, node.id, fieldKey],
  )

  switch (fieldKey) {
    case 'script':
    case 'gmNotes':
    case 'vibe':
    case 'events':
    case 'combat':
    case 'characters':
    case 'secrets':
      return (
        <RichContentEditor
          value={node.fields[fieldKey]}
          onChange={handleChange}
          nodeId={node.id}
        />
      )
    case 'dialogues':
      return (
        <DialogueListEditor
          value={node.fields.dialogues}
          onChange={handleChange}
        />
      )
    case 'soundtrack':
      return (
        <SoundtrackListEditor
          value={node.fields.soundtrack}
          onChange={handleChange}
        />
      )
    case 'diceRolls':
      return (
        <DiceRollListEditor
          value={node.fields.diceRolls}
          onChange={handleChange}
        />
      )
    case 'conditions':
      return (
        <ConditionsListEditor
          value={node.fields.conditions}
          onChange={handleChange}
          nodeId={node.id}
        />
      )
    case 'custom':
      return (
        <CustomFieldEditor
          value={node.fields.custom}
          onChange={handleChange}
        />
      )
  }
}
