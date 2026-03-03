// Pure attachment operations — ZERO framework imports, ZERO side effects
import type { Attachment, RichContent } from './types'

export const ATTACHMENT_SIZE_WARNING_BYTES = 2 * 1024 * 1024 // 2 MB
export const CAMPAIGN_SIZE_WARNING_BYTES = 50 * 1024 * 1024 // 50 MB

export function createAttachment(
  filename: string,
  mimeType: string,
  dataUrl: string,
): Attachment {
  return {
    id: crypto.randomUUID(),
    filename,
    mimeType,
    dataUrl,
  }
}

export function validateAttachmentSize(dataUrl: string): {
  sizeBytes: number
  warning: boolean
} {
  const sizeBytes = new Blob([dataUrl]).size
  return {
    sizeBytes,
    warning: sizeBytes > ATTACHMENT_SIZE_WARNING_BYTES,
  }
}

export function addAttachment(
  richContent: RichContent,
  attachment: Attachment,
): RichContent {
  const existing = richContent.attachments ?? []
  return { ...richContent, attachments: [...existing, attachment] }
}

export function removeAttachment(
  richContent: RichContent,
  attachmentId: string,
): RichContent {
  const existing = richContent.attachments ?? []
  const filtered = existing.filter((a) => a.id !== attachmentId)
  return {
    ...richContent,
    attachments: filtered.length > 0 ? filtered : undefined,
  }
}

export function getAttachmentById(
  richContent: RichContent,
  attachmentId: string,
): Attachment | undefined {
  return richContent.attachments?.find((a) => a.id === attachmentId)
}

export function estimateCampaignSize(json: string): {
  sizeBytes: number
  sizeMB: number
  warning: boolean
} {
  const sizeBytes = new Blob([json]).size
  const sizeMB = Math.round((sizeBytes / (1024 * 1024)) * 100) / 100
  return {
    sizeBytes,
    sizeMB,
    warning: sizeBytes > CAMPAIGN_SIZE_WARNING_BYTES,
  }
}
