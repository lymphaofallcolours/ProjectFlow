import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useRef } from 'react'

type TipTapEditorProps = {
  content: string
  onUpdate: (text: string) => void
  placeholder?: string
  className?: string
}

export function TipTapEditor({
  content,
  onUpdate,
  placeholder = 'Write here...',
  className = '',
}: TipTapEditorProps) {
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor: ed }) => {
      onUpdateRef.current(ed.getText())
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
