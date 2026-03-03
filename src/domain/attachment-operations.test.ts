import { describe, it, expect } from 'vitest'
import {
  createAttachment,
  validateAttachmentSize,
  addAttachment,
  removeAttachment,
  getAttachmentById,
  estimateCampaignSize,
  ATTACHMENT_SIZE_WARNING_BYTES,
  CAMPAIGN_SIZE_WARNING_BYTES,
} from './attachment-operations'
import { createTestAttachment, createTestRichContent } from '../../tests/fixtures/factories'

describe('createAttachment', () => {
  it('creates an attachment with unique id', () => {
    const att = createAttachment('map.png', 'image/png', 'data:image/png;base64,abc')
    expect(att.id).toBeTruthy()
    expect(att.filename).toBe('map.png')
    expect(att.mimeType).toBe('image/png')
    expect(att.dataUrl).toBe('data:image/png;base64,abc')
  })

  it('generates unique ids', () => {
    const a = createAttachment('a.png', 'image/png', 'data:')
    const b = createAttachment('b.png', 'image/png', 'data:')
    expect(a.id).not.toBe(b.id)
  })
})

describe('validateAttachmentSize', () => {
  it('reports no warning for small data URLs', () => {
    const result = validateAttachmentSize('data:image/png;base64,abc')
    expect(result.warning).toBe(false)
    expect(result.sizeBytes).toBeGreaterThan(0)
  })

  it('reports warning for data URLs exceeding threshold', () => {
    // Create a string larger than 2MB
    const bigData = 'x'.repeat(ATTACHMENT_SIZE_WARNING_BYTES + 100)
    const result = validateAttachmentSize(bigData)
    expect(result.warning).toBe(true)
  })
})

describe('addAttachment', () => {
  it('adds attachment to empty RichContent', () => {
    const content = createTestRichContent('some text')
    const att = createTestAttachment()
    const result = addAttachment(content, att)
    expect(result.attachments).toHaveLength(1)
    expect(result.attachments![0].id).toBe(att.id)
    expect(result.markdown).toBe('some text')
  })

  it('appends to existing attachments', () => {
    const existing = createTestAttachment({ id: 'existing' })
    const content = { markdown: '', attachments: [existing] }
    const newAtt = createTestAttachment({ id: 'new' })
    const result = addAttachment(content, newAtt)
    expect(result.attachments).toHaveLength(2)
  })
})

describe('removeAttachment', () => {
  it('removes the specified attachment', () => {
    const att1 = createTestAttachment({ id: 'a1' })
    const att2 = createTestAttachment({ id: 'a2' })
    const content = { markdown: '', attachments: [att1, att2] }
    const result = removeAttachment(content, 'a1')
    expect(result.attachments).toHaveLength(1)
    expect(result.attachments![0].id).toBe('a2')
  })

  it('clears attachments to undefined when last one removed', () => {
    const att = createTestAttachment({ id: 'a1' })
    const content = { markdown: '', attachments: [att] }
    const result = removeAttachment(content, 'a1')
    expect(result.attachments).toBeUndefined()
  })

  it('returns unchanged content when id not found', () => {
    const att = createTestAttachment({ id: 'a1' })
    const content = { markdown: '', attachments: [att] }
    const result = removeAttachment(content, 'missing')
    expect(result.attachments).toHaveLength(1)
  })
})

describe('getAttachmentById', () => {
  it('finds an attachment by id', () => {
    const att = createTestAttachment({ id: 'target' })
    const content = { markdown: '', attachments: [att] }
    expect(getAttachmentById(content, 'target')).toBe(att)
  })

  it('returns undefined when not found', () => {
    const content = createTestRichContent()
    expect(getAttachmentById(content, 'missing')).toBeUndefined()
  })
})

describe('estimateCampaignSize', () => {
  it('calculates size for small campaigns', () => {
    const json = JSON.stringify({ data: 'small' })
    const result = estimateCampaignSize(json)
    expect(result.sizeBytes).toBeGreaterThan(0)
    expect(result.sizeMB).toBeLessThan(1)
    expect(result.warning).toBe(false)
  })

  it('warns for large campaigns', () => {
    const bigJson = 'x'.repeat(CAMPAIGN_SIZE_WARNING_BYTES + 100)
    const result = estimateCampaignSize(bigJson)
    expect(result.warning).toBe(true)
    expect(result.sizeMB).toBeGreaterThan(49)
  })
})
