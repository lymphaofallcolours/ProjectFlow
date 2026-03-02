import Mention from '@tiptap/extension-mention'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { EntityChipNodeView } from './entity-chip-node-view'
import type { EntityType } from '@/domain/entity-types'

// Detect entity type prefix from character preceding the trigger
function detectPrefixType(char: string): EntityType {
  switch (char) {
    case '!': return 'npc'
    case '%': return 'enemy'
    case '$': return 'object'
    case '~': return 'location'
    case '&': return 'secret'
    default: return 'pc'
  }
}

function createEntityMention(
  name: string,
  triggerChar: '@' | '#',
  mode: 'present' | 'mentioned',
) {
  return Mention.extend({
    name,

    addAttributes() {
      return {
        id: { default: null },
        name: { default: null },
        entityType: { default: 'pc' },
        mode: { default: mode },
        prefix: { default: '' },
        status: { default: null },
      }
    },

    addNodeView() {
      return ReactNodeViewRenderer(EntityChipNodeView, {
        as: 'span',
        className: 'inline',
      })
    },

    renderText({ node }) {
      const { prefix, status, name: entityName } = node.attrs
      const statusSuffix = status ? `+${status}` : ''
      return `${prefix}${triggerChar}${entityName}${statusSuffix}`
    },
  }).configure({
    suggestion: {
      char: triggerChar,
      allowSpaces: true,
      decorationClass: 'entity-suggestion-active',
    },
    HTMLAttributes: {
      class: 'entity-mention-node',
    },
  })
}

export const EntityPresentMention = createEntityMention(
  'entityPresent',
  '@',
  'present',
)

export const EntityMentionedMention = createEntityMention(
  'entityMentioned',
  '#',
  'mentioned',
)

export { detectPrefixType }
