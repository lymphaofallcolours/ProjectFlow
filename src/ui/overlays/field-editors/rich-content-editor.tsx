import { useCallback } from 'react'
import type { RichContent } from '@/domain/types'

type RichContentEditorProps = {
  value: RichContent
  onChange: (value: RichContent) => void
}

export function RichContentEditor({ value, onChange }: RichContentEditorProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange({ ...value, markdown: e.target.value })
    },
    [value, onChange],
  )

  return (
    <textarea
      value={value.markdown}
      onChange={handleChange}
      placeholder="Write here..."
      className="w-full h-full min-h-[120px] bg-transparent text-text-primary text-sm
        placeholder:text-text-muted resize-none outline-none p-0
        leading-relaxed"
      style={{ fontFamily: 'var(--font-body)' }}
    />
  )
}
