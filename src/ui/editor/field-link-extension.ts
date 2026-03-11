import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'
import { FieldLinkNodeView } from './field-link-node-view'
import type { FieldKey } from '@/domain/types'
import { FIELD_DEFINITIONS } from '@/domain/types'

const FIELD_LINK_PATTERN = /\/\?([A-Za-z][A-Za-z ]*)/g

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Convert plain text content to HTML with field link spans and paragraph breaks.
 * Call this before passing content to TipTap so /?FieldName roundtrips as chips.
 */
export function contentToHtml(text: string): string {
  if (!text.trim()) return ''

  const paragraphs = text.split('\n')
  const htmlParagraphs = paragraphs.map((line) => {
    let result = ''
    let lastIdx = 0
    const regex = new RegExp(FIELD_LINK_PATTERN.source, FIELD_LINK_PATTERN.flags)
    let match: RegExpExecArray | null

    while ((match = regex.exec(line)) !== null) {
      const label = match[1].trim()
      const fieldDef = FIELD_DEFINITIONS.find(
        (f) => f.label.toLowerCase() === label.toLowerCase(),
      )
      if (!fieldDef) continue

      result += escapeHtml(line.slice(lastIdx, match.index))
      result += `<span data-field-link="" data-field-key="${fieldDef.key}" data-field-label="${escapeHtml(fieldDef.label)}" data-field-color="${escapeHtml(fieldDef.color)}" data-field-icon="${escapeHtml(fieldDef.icon)}"></span>`
      lastIdx = match.index + match[0].length
    }

    result += escapeHtml(line.slice(lastIdx))
    return `<p>${result || '<br>'}</p>`
  })

  return htmlParagraphs.join('')
}

export type FieldLinkAttributes = {
  fieldKey: FieldKey
  fieldLabel: string
  fieldColor: string
  fieldIcon: string
}

const fieldLinkPluginKey = new PluginKey('fieldLinkSuggestion')

export const FieldLinkExtension = Node.create({
  name: 'fieldLink',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      fieldKey: { default: null },
      fieldLabel: { default: null },
      fieldColor: { default: null },
      fieldIcon: { default: null },
    }
  },

  parseHTML() {
    return [{
      tag: 'span[data-field-link]',
      getAttrs: (el) => {
        const element = el as HTMLElement
        return {
          fieldKey: element.getAttribute('data-field-key'),
          fieldLabel: element.getAttribute('data-field-label'),
          fieldColor: element.getAttribute('data-field-color'),
          fieldIcon: element.getAttribute('data-field-icon'),
        }
      },
    }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({
      'data-field-link': '',
      'data-field-key': HTMLAttributes.fieldKey,
      'data-field-label': HTMLAttributes.fieldLabel,
      'data-field-color': HTMLAttributes.fieldColor,
      'data-field-icon': HTMLAttributes.fieldIcon,
    }, HTMLAttributes)]
  },

  renderText({ node }) {
    return `/?${node.attrs.fieldLabel}`
  },

  addNodeView() {
    return ReactNodeViewRenderer(FieldLinkNodeView, {
      as: 'span',
      className: 'inline',
    })
  },

  addProseMirrorPlugins() {
    const editor = this.editor
    let popup: HTMLDivElement | null = null
    let selectedIndex = 0
    let filteredItems: typeof FIELD_DEFINITIONS = []
    let queryStart = -1

    function destroyPopup() {
      popup?.remove()
      popup = null
      queryStart = -1
      selectedIndex = 0
      filteredItems = []
    }

    function insertFieldLink(item: (typeof FIELD_DEFINITIONS)[0]) {
      const { from } = editor.view.state.selection
      // Delete the /?query text
      const deleteFrom = queryStart - 2 // before /?
      editor.chain()
        .deleteRange({ from: deleteFrom, to: from })
        .insertContent([
          {
            type: 'fieldLink',
            attrs: {
              fieldKey: item.key,
              fieldLabel: item.label,
              fieldColor: item.color,
              fieldIcon: item.icon,
            },
          },
          { type: 'text', text: ' ' },
        ])
        .run()
      destroyPopup()
    }

    function renderPopup(view: EditorView, query: string) {
      const lowerQuery = query.toLowerCase()
      filteredItems = FIELD_DEFINITIONS.filter((f) =>
        f.label.toLowerCase().includes(lowerQuery),
      )
      selectedIndex = Math.min(selectedIndex, Math.max(0, filteredItems.length - 1))

      if (filteredItems.length === 0) {
        destroyPopup()
        return
      }

      if (!popup) {
        popup = document.createElement('div')
        popup.style.position = 'fixed'
        popup.style.zIndex = '9999'
        document.body.appendChild(popup)
      }

      // Position
      const coords = view.coordsAtPos(view.state.selection.from)
      popup.style.left = `${coords.left}px`
      popup.style.top = `${coords.bottom + 4}px`

      popup.innerHTML = ''
      const container = document.createElement('div')
      container.className = 'glass-panel rounded-lg shadow-lg overflow-hidden min-w-[180px] max-h-[240px] overflow-y-auto text-xs'

      filteredItems.forEach((item, index) => {
        const btn = document.createElement('button')
        btn.className = `w-full flex items-center gap-2 px-3 py-1.5 text-left cursor-pointer transition-colors duration-75 ${
          index === selectedIndex
            ? 'bg-surface-overlay text-text-primary'
            : 'text-text-secondary hover:bg-surface-glass'
        }`

        const dot = document.createElement('span')
        dot.className = 'w-2 h-2 rounded-full shrink-0'
        dot.style.backgroundColor = item.color

        const label = document.createElement('span')
        label.className = 'truncate'
        label.textContent = item.label

        btn.appendChild(dot)
        btn.appendChild(label)
        btn.addEventListener('mousedown', (e) => {
          e.preventDefault()
          insertFieldLink(item)
        })
        container.appendChild(btn)
      })

      popup.appendChild(container)
    }

    return [
      new Plugin({
        key: fieldLinkPluginKey,
        props: {
          handleKeyDown(_view, event) {
            if (!popup) return false

            if (event.key === 'ArrowDown') {
              selectedIndex = (selectedIndex + 1) % filteredItems.length
              renderPopup(editor.view, '')
              // Re-render with current query
              const { from } = editor.view.state.selection
              const text = editor.view.state.doc.textBetween(queryStart, from)
              renderPopup(editor.view, text)
              return true
            }
            if (event.key === 'ArrowUp') {
              selectedIndex = (selectedIndex + filteredItems.length - 1) % filteredItems.length
              const { from } = editor.view.state.selection
              const text = editor.view.state.doc.textBetween(queryStart, from)
              renderPopup(editor.view, text)
              return true
            }
            if (event.key === 'Enter') {
              if (filteredItems[selectedIndex]) {
                insertFieldLink(filteredItems[selectedIndex])
              }
              return true
            }
            if (event.key === 'Escape') {
              destroyPopup()
              return true
            }
            return false
          },
        },
        view() {
          return {
            update(view) {
              const { from } = view.state.selection
              if (from < 2) {
                destroyPopup()
                return
              }

              // Resolve position to find the current block's text only
              const $pos = view.state.doc.resolve(from)
              const parentStart = $pos.start($pos.depth)
              const textInBlock = view.state.doc.textBetween(parentStart, from)

              const triggerIdx = textInBlock.lastIndexOf('/?')
              if (triggerIdx === -1) {
                destroyPopup()
                return
              }

              const queryText = textInBlock.slice(triggerIdx + 2)
              const absoluteStart = parentStart + triggerIdx + 2
              queryStart = absoluteStart
              selectedIndex = Math.min(selectedIndex, Math.max(0, filteredItems.length - 1))
              renderPopup(view, queryText)
            },
            destroy() {
              destroyPopup()
            },
          }
        },
      }),
    ]
  },
})
