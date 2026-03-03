import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useEntityStore } from '@/application/entity-store'
import { createTestAttachment } from '../../../tests/fixtures/factories'
import { EntityProfile } from './entity-profile'

describe('EntityProfile', () => {
  let entityId: string

  beforeEach(() => {
    useEntityStore.getState().reset()
    entityId = useEntityStore.getState().addEntity('pc', 'Alfa', 'A battle-brother')
  })

  it('renders entity name and description', () => {
    render(<EntityProfile entityId={entityId} />)
    const nameInput = screen.getByDisplayValue('Alfa')
    expect(nameInput).toBeDefined()
  })

  it('renders not found for missing entity', () => {
    render(<EntityProfile entityId="nonexistent" />)
    expect(screen.getByText('Entity not found')).toBeDefined()
  })

  it('shows portrait initial when no portrait set', () => {
    render(<EntityProfile entityId={entityId} />)
    expect(screen.getByText('A')).toBeDefined()
  })

  it('shows portrait image when portrait is set', () => {
    const portrait = createTestAttachment({ filename: 'portrait.png' })
    useEntityStore.getState().setPortrait(entityId, portrait)
    render(<EntityProfile entityId={entityId} />)
    const img = document.querySelector('img')
    expect(img).toBeDefined()
    expect(img?.alt).toBe('Alfa')
  })

  it('shows collapsible section headers', () => {
    render(<EntityProfile entityId={entityId} />)
    // Use getAllByText since labels may appear in both header and child component
    const historyHeaders = screen.getAllByText('Status History')
    expect(historyHeaders.length).toBeGreaterThanOrEqual(1)
    const relHeaders = screen.getAllByText('Relationships')
    expect(relHeaders.length).toBeGreaterThanOrEqual(1)
    const customHeaders = screen.getAllByText('Custom Fields')
    expect(customHeaders.length).toBeGreaterThanOrEqual(1)
  })

  it('shows status history count in section header', () => {
    useEntityStore.getState().addStatus(entityId, 'node-1', 'wounded')
    useEntityStore.getState().addStatus(entityId, 'node-2', 'healed')
    render(<EntityProfile entityId={entityId} />)
    expect(screen.getByText('2')).toBeDefined()
  })

  it('toggles custom fields section on header click', () => {
    render(<EntityProfile entityId={entityId} />)
    // Custom section starts collapsed
    expect(screen.queryByText('No custom fields')).toBeNull()
    // Click to expand custom section
    const customHeaders = screen.getAllByText('Custom Fields')
    fireEvent.click(customHeaders[0])
    expect(screen.getByText('No custom fields')).toBeDefined()
  })

  it('shows empty status history message in expanded section', () => {
    render(<EntityProfile entityId={entityId} />)
    expect(screen.getByText('No status entries yet')).toBeDefined()
  })
})
