import { describe, it, expect, beforeEach } from 'vitest'
import { useCampaignStore } from './campaign-store'

beforeEach(() => {
  useCampaignStore.getState().reset()
})

describe('useCampaignStore — template CRUD', () => {
  it('starts with empty templates', () => {
    expect(useCampaignStore.getState().customFieldTemplates).toEqual([])
  })

  it('addTemplate creates and stores a template', () => {
    const id = useCampaignStore.getState().addTemplate('Combat Notes', 'Swords')
    const templates = useCampaignStore.getState().customFieldTemplates
    expect(templates).toHaveLength(1)
    expect(templates[0].id).toBe(id)
    expect(templates[0].label).toBe('Combat Notes')
    expect(templates[0].icon).toBe('Swords')
  })

  it('addTemplate with description', () => {
    useCampaignStore.getState().addTemplate('Lore', 'BookOpen', 'World-building')
    const t = useCampaignStore.getState().customFieldTemplates[0]
    expect(t.description).toBe('World-building')
  })

  it('updateTemplate modifies an existing template', () => {
    const id = useCampaignStore.getState().addTemplate('Old', 'Icon')
    useCampaignStore.getState().updateTemplate(id, { label: 'New' })
    expect(useCampaignStore.getState().customFieldTemplates[0].label).toBe('New')
  })

  it('removeTemplate deletes a template by id', () => {
    const id1 = useCampaignStore.getState().addTemplate('A', 'X')
    useCampaignStore.getState().addTemplate('B', 'Y')
    useCampaignStore.getState().removeTemplate(id1)
    const templates = useCampaignStore.getState().customFieldTemplates
    expect(templates).toHaveLength(1)
    expect(templates[0].label).toBe('B')
  })

  it('loadTemplates replaces all templates', () => {
    useCampaignStore.getState().addTemplate('Existing', 'X')
    useCampaignStore.getState().loadTemplates([
      { id: 't1', label: 'Loaded', icon: 'Star' },
    ])
    const templates = useCampaignStore.getState().customFieldTemplates
    expect(templates).toHaveLength(1)
    expect(templates[0].label).toBe('Loaded')
  })

  it('reset clears templates', () => {
    useCampaignStore.getState().addTemplate('A', 'X')
    useCampaignStore.getState().reset()
    expect(useCampaignStore.getState().customFieldTemplates).toEqual([])
  })

  it('loadCampaign loads templates from campaign', () => {
    const campaign = {
      id: 'c1',
      name: 'Test',
      description: '',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      schemaVersion: 1,
      customFieldTemplates: [{ id: 't1', label: 'Tpl', icon: 'Star' }],
      graph: { nodes: {}, edges: {}, viewport: { x: 0, y: 0, zoom: 1 }, scrollDirection: 'horizontal' as const },
      entityRegistry: { entities: {} },
      settings: { theme: 'dark' as const, scrollDirection: 'horizontal' as const, autoSaveEnabled: false, autoSaveIntervalMs: 60000 },
      playthroughLog: [],
    }
    useCampaignStore.getState().loadCampaign(campaign)
    expect(useCampaignStore.getState().customFieldTemplates).toHaveLength(1)
    expect(useCampaignStore.getState().customFieldTemplates[0].label).toBe('Tpl')
  })
})
