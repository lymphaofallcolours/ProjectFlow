import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import type { AnyExtension } from '@tiptap/react'
import { useEffect, useRef } from 'react'
import { EntityPresentMention, EntityMentionedMention, detectPrefixType } from './entity-mention-extension'
import { EntitySuggestionList } from './entity-suggestion'
import type { EntitySuggestionListRef } from './entity-suggestion'
import { buildSuggestionItems } from './suggestion-items'
import { useEntityStore } from '@/application/entity-store'
import { extractStatusTagsFromText } from '@/domain/entity-tag-parser'

type TipTapEditorProps = {
  content: string
  onUpdate: (text: string) => void
  placeholder?: string
  className?: string
  enableEntityMentions?: boolean
  nodeId?: string
}

function createSuggestionConfig(mode: 'present' | 'mentioned') {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: ({ query, editor }: any) => {
      const entities = useEntityStore.getState().getAllEntities()
      let prefixType = detectPrefixType('')
      try {
        const { from } = editor.view.state.selection
        if (from > 1) {
          const charBefore = editor.view.state.doc.textBetween(from - 2, from - 1)
          prefixType = detectPrefixType(charBefore)
        }
      } catch {
        // fallback to pc
      }
      return buildSuggestionItems(query, entities, prefixType)
    },
    render: () => {
      let component: ReactRenderer<EntitySuggestionListRef> | null = null
      let popup: { destroy: () => void; setProps: (props: Record<string, unknown>) => void; hide: () => void } | null = null

      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onStart: (props: any) => {
          component = new ReactRenderer(EntitySuggestionList, {
            props: {
              items: props.items,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              command: (item: any) => {
                if (item.isCreate) {
                  const id = useEntityStore.getState().addEntity(item.type, item.name)
                  const entity = useEntityStore.getState().getEntity(id)
                  if (entity) {
                    props.command({
                      id: entity.id,
                      name: entity.name,
                      entityType: entity.type,
                      mode,
                      prefix: '',
                    })
                  }
                } else {
                  props.command({
                    id: item.id,
                    name: item.name,
                    entityType: item.type,
                    mode,
                    prefix: '',
                  })
                }
              },
            },
            editor: props.editor,
          })

          if (!props.clientRect) return

          // Create a simple positioned popup
          const el = document.createElement('div')
          el.style.position = 'fixed'
          el.style.zIndex = '9999'
          el.appendChild(component.element)
          document.body.appendChild(el)

          const updatePosition = () => {
            const rect = props.clientRect?.()
            if (rect) {
              el.style.left = `${rect.left}px`
              el.style.top = `${rect.bottom + 4}px`
            }
          }
          updatePosition()

          popup = {
            destroy: () => el.remove(),
            setProps: () => updatePosition(),
            hide: () => el.remove(),
          }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onUpdate: (props: any) => {
          component?.updateProps({
            items: props.items,
          })
          if (popup && props.clientRect) {
            popup.setProps({})
          }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onKeyDown: (props: any) => {
          if (props.event.key === 'Escape') {
            popup?.hide()
            return true
          }
          return component?.ref?.onKeyDown({ event: props.event }) ?? false
        },
        onExit: () => {
          popup?.destroy()
          component?.destroy()
        },
      }
    },
  }
}

export function TipTapEditor({
  content,
  onUpdate,
  placeholder = 'Write here...',
  className = '',
  enableEntityMentions = true,
  nodeId,
}: TipTapEditorProps) {
  const onUpdateRef = useRef(onUpdate)
  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  // Track previous text for status auto-logging
  const prevTextRef = useRef(content)
  const nodeIdRef = useRef(nodeId)
  useEffect(() => {
    nodeIdRef.current = nodeId
  }, [nodeId])

  const extensions: AnyExtension[] = [
    StarterKit,
    Placeholder.configure({ placeholder }),
    Link.configure({
      autolink: true,
      openOnClick: true,
      HTMLAttributes: { class: 'entity-link' },
    }),
  ]

  if (enableEntityMentions) {
    extensions.push(
      EntityPresentMention.configure({
        suggestion: createSuggestionConfig('present'),
      }),
      EntityMentionedMention.configure({
        suggestion: createSuggestionConfig('mentioned'),
      }),
    )
  }

  const editor = useEditor({
    extensions,
    content,
    onUpdate: ({ editor: ed }) => {
      const newText = ed.getText()
      // Status auto-logging: diff old text vs new text for status markers
      if (nodeIdRef.current) {
        const oldTags = extractStatusTagsFromText(prevTextRef.current)
        const newTags = extractStatusTagsFromText(newText)
        const oldSet = new Set(oldTags.map((t) => `${t.name}:${t.status}`))
        for (const tag of newTags) {
          const key = `${tag.name}:${tag.status}`
          if (!oldSet.has(key)) {
            const entity = useEntityStore.getState().getByName(tag.name, tag.entityType)
            if (entity) {
              useEntityStore.getState().addStatus(entity.id, nodeIdRef.current, tag.status)
            }
          }
        }
      }
      prevTextRef.current = newText
      onUpdateRef.current(newText)
    },
    editorProps: {
      attributes: {
        class: `tiptap-editor outline-none min-h-[120px] text-sm leading-relaxed ${className}`,
      },
    },
  })

  // Sync external content changes (e.g. loading a different node)
  const prevContent = useRef(content)
  useEffect(() => {
    if (editor && content !== prevContent.current) {
      prevContent.current = content
      prevTextRef.current = content
      const currentText = editor.getText()
      if (currentText !== content) {
        editor.commands.setContent(content)
      }
    }
  }, [content, editor])

  return (
    <EditorContent
      editor={editor}
      className="w-full h-full text-text-primary"
      style={{ fontFamily: 'var(--font-body)' }}
    />
  )
}
