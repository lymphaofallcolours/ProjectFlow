import { useCallback, useRef, useState } from 'react'
import { ImagePlus, X, AlertTriangle } from 'lucide-react'
import type { Attachment, RichContent } from '@/domain/types'
import {
  createAttachment,
  validateAttachmentSize,
  addAttachment,
  removeAttachment,
} from '@/domain/attachment-operations'
import { readFileAsDataUrl } from '@/infrastructure/file-io'

type AttachmentGalleryProps = {
  value: RichContent
  onChange: (value: RichContent) => void
}

export function AttachmentGallery({ value, onChange }: AttachmentGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [sizeWarning, setSizeWarning] = useState<string | null>(null)

  const handleAddFiles = useCallback(
    async (files: FileList | File[]) => {
      let current = value
      for (const file of Array.from(files)) {
        const dataUrl = await readFileAsDataUrl(file)
        const validation = validateAttachmentSize(dataUrl)
        if (validation.warning) {
          const sizeMB = (validation.sizeBytes / (1024 * 1024)).toFixed(1)
          setSizeWarning(`${file.name} is ${sizeMB} MB — large files increase save size`)
        }
        const att = createAttachment(file.name, file.type, dataUrl)
        current = addAttachment(current, att)
      }
      onChange(current)
    },
    [value, onChange],
  )

  const handleRemove = useCallback(
    (attachmentId: string) => {
      onChange(removeAttachment(value, attachmentId))
    },
    [value, onChange],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) handleAddFiles(e.target.files)
      e.target.value = ''
    },
    [handleAddFiles],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/'),
      )
      if (files.length > 0) handleAddFiles(files)
    },
    [handleAddFiles],
  )

  const attachments = value.attachments ?? []

  return (
    <div className="mt-2 space-y-2">
      {/* Gallery grid */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-3 gap-2" data-testid="attachment-grid">
          {attachments.map((att) => (
            <AttachmentThumb key={att.id} attachment={att} onRemove={handleRemove} />
          ))}
        </div>
      )}

      {/* Size warning */}
      {sizeWarning && (
        <div
          className="flex items-center gap-1.5 text-[10px] text-status-modified"
          data-testid="size-warning"
        >
          <AlertTriangle size={11} />
          {sizeWarning}
          <button
            onClick={() => setSizeWarning(null)}
            className="ml-auto text-text-muted hover:text-text-secondary cursor-pointer"
          >
            <X size={10} />
          </button>
        </div>
      )}

      {/* Drop zone + add button */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed
          text-[11px] transition-colors duration-100 cursor-pointer
          ${dragOver
            ? 'border-node-event bg-node-event/5 text-node-event'
            : 'border-border text-text-muted hover:text-text-secondary hover:border-surface-glass-border'}`}
        onClick={() => fileInputRef.current?.click()}
        data-testid="attachment-drop-zone"
      >
        <ImagePlus size={13} />
        {dragOver ? 'Drop image here' : 'Add image'}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  )
}

function AttachmentThumb({
  attachment,
  onRemove,
}: {
  attachment: Attachment
  onRemove: (id: string) => void
}) {
  const sizeMB = (attachment.dataUrl.length / (1024 * 1024)).toFixed(1)

  return (
    <div className="relative group rounded-lg overflow-hidden border border-border bg-surface-glass">
      <img
        src={attachment.dataUrl}
        alt={attachment.filename}
        className="w-full h-20 object-cover"
        draggable={false}
      />
      <div className="px-1.5 py-1 flex items-center gap-1">
        <span className="text-[9px] text-text-muted truncate flex-1">
          {attachment.filename}
        </span>
        <span className="text-[8px] text-text-muted opacity-60 shrink-0">
          {sizeMB} MB
        </span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove(attachment.id)
        }}
        className="absolute top-1 right-1 w-4 h-4 rounded-full bg-surface-overlay/80
          flex items-center justify-center opacity-0 group-hover:opacity-100
          transition-opacity cursor-pointer hover:bg-status-skipped/80"
        data-testid="remove-attachment"
      >
        <X size={10} className="text-white" />
      </button>
    </div>
  )
}
