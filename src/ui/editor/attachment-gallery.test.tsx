import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AttachmentGallery } from './attachment-gallery'
import { createTestAttachment, createTestRichContent } from '../../../tests/fixtures/factories'

describe('AttachmentGallery', () => {
  it('renders empty state with add button', () => {
    const value = createTestRichContent('some text')
    render(<AttachmentGallery value={value} onChange={() => {}} />)
    expect(screen.getByTestId('attachment-drop-zone')).toBeTruthy()
    expect(screen.getByText('Add image')).toBeTruthy()
  })

  it('renders existing attachments as thumbnails', () => {
    const att1 = createTestAttachment({ id: 'a1', filename: 'map.png' })
    const att2 = createTestAttachment({ id: 'a2', filename: 'token.png' })
    const value = { markdown: '', attachments: [att1, att2] }

    render(<AttachmentGallery value={value} onChange={() => {}} />)
    expect(screen.getByText('map.png')).toBeTruthy()
    expect(screen.getByText('token.png')).toBeTruthy()
    expect(screen.getByTestId('attachment-grid')).toBeTruthy()
  })

  it('calls onChange with attachment removed when remove button clicked', () => {
    const att = createTestAttachment({ id: 'to-remove', filename: 'old.png' })
    const value = { markdown: 'text', attachments: [att] }
    const onChange = vi.fn()

    render(<AttachmentGallery value={value} onChange={onChange} />)
    const removeBtn = screen.getByTestId('remove-attachment')
    fireEvent.click(removeBtn)

    expect(onChange).toHaveBeenCalledOnce()
    const result = onChange.mock.calls[0][0]
    expect(result.markdown).toBe('text')
    expect(result.attachments).toBeUndefined()
  })

  it('shows drop zone text change on drag over', () => {
    const value = createTestRichContent()
    render(<AttachmentGallery value={value} onChange={() => {}} />)
    const dropZone = screen.getByTestId('attachment-drop-zone')

    fireEvent.dragOver(dropZone, { dataTransfer: { files: [] } })
    expect(screen.getByText('Drop image here')).toBeTruthy()
  })
})
