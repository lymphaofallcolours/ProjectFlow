import { useRef, useCallback, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { ENTITY_TYPE_CONFIGS } from '@/domain/entity-types'
import type { Entity } from '@/domain/entity-types'
import { useEntityStore } from '@/application/entity-store'
import { readFileAsDataUrl } from '@/infrastructure/file-io'
import { createAttachment, validateAttachmentSize } from '@/domain/attachment-operations'

const MAX_PORTRAIT_DISPLAY = 96

type EntityPortraitProps = {
  entityId: string
  entity: Entity
}

export function EntityPortrait({ entityId, entity }: EntityPortraitProps) {
  const setPortrait = useEntityStore((s) => s.setPortrait)
  const fileRef = useRef<HTMLInputElement>(null)
  const [sizeWarning, setSizeWarning] = useState<string | null>(null)
  const config = ENTITY_TYPE_CONFIGS.find((c) => c.type === entity.type)

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      setSizeWarning(null)
      const dataUrl = await readFileAsDataUrl(file)
      const { warning } = validateAttachmentSize(dataUrl)
      if (warning) setSizeWarning('File size exceeds recommended limit')
      const attachment = createAttachment(file.name, file.type, dataUrl)
      setPortrait(entityId, attachment)
      if (fileRef.current) fileRef.current.value = ''
    },
    [entityId, setPortrait],
  )

  const handleRemove = useCallback(() => {
    setPortrait(entityId, null)
    setSizeWarning(null)
  }, [entityId, setPortrait])

  return (
    <div className="flex flex-col items-center gap-2 py-3">
      <div
        className="relative group"
        style={{ width: MAX_PORTRAIT_DISPLAY, height: MAX_PORTRAIT_DISPLAY }}
      >
        {entity.portrait ? (
          <img
            src={entity.portrait.dataUrl}
            alt={entity.name}
            className="w-full h-full rounded-full object-cover border-2"
            style={{ borderColor: `${config?.color}66` }}
          />
        ) : (
          <div
            className="w-full h-full rounded-full flex items-center justify-center text-2xl font-bold border-2 border-dashed"
            style={{
              borderColor: `${config?.color}44`,
              color: config?.color,
              backgroundColor: `${config?.color}0a`,
            }}
          >
            {entity.name.charAt(0).toUpperCase()}
          </div>
        )}

        <button
          onClick={() => fileRef.current?.click()}
          className="absolute inset-0 rounded-full flex items-center justify-center
            bg-black/0 group-hover:bg-black/40 transition-all cursor-pointer"
        >
          <Camera
            size={20}
            className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </button>

        {entity.portrait && (
          <button
            onClick={handleRemove}
            className="absolute -top-1 -right-1 p-0.5 rounded-full bg-surface-glass border border-border
              text-text-muted hover:text-status-skipped transition-colors cursor-pointer
              opacity-0 group-hover:opacity-100"
          >
            <X size={10} />
          </button>
        )}
      </div>

      {sizeWarning && (
        <span className="text-[10px] text-status-modified">{sizeWarning}</span>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
