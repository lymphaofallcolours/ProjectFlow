import { useCallback } from 'react'
import type { RichContent } from '@/domain/types'
import { TipTapEditor } from '@/ui/editor/tiptap-editor'
import { AttachmentGallery } from '@/ui/editor/attachment-gallery'

type RichContentEditorProps = {
  value: RichContent
  onChange: (value: RichContent) => void
}

export function RichContentEditor({ value, onChange }: RichContentEditorProps) {
  const handleUpdate = useCallback(
    (text: string) => {
      onChange({ ...value, markdown: text })
    },
    [value, onChange],
  )

  return (
    <div>
      <TipTapEditor
        content={value.markdown}
        onUpdate={handleUpdate}
        placeholder="Write here..."
      />
      <AttachmentGallery value={value} onChange={onChange} />
    </div>
  )
}
