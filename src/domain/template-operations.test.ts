import { describe, it, expect } from 'vitest'
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  instantiateTemplate,
} from './template-operations'

describe('template-operations', () => {
  describe('createTemplate', () => {
    it('creates a template with label and icon', () => {
      const t = createTemplate('Combat Notes', 'Swords')
      expect(t.id).toBeDefined()
      expect(t.label).toBe('Combat Notes')
      expect(t.icon).toBe('Swords')
      expect(t.description).toBeUndefined()
    })

    it('creates a template with optional description', () => {
      const t = createTemplate('Lore', 'BookOpen', 'World-building notes')
      expect(t.description).toBe('World-building notes')
    })

    it('generates unique IDs', () => {
      const t1 = createTemplate('A', 'X')
      const t2 = createTemplate('B', 'Y')
      expect(t1.id).not.toBe(t2.id)
    })
  })

  describe('updateTemplate', () => {
    it('updates the label', () => {
      const t = createTemplate('Old', 'Icon')
      const updated = updateTemplate(t, { label: 'New' })
      expect(updated.label).toBe('New')
      expect(updated.icon).toBe('Icon')
      expect(updated.id).toBe(t.id)
    })

    it('updates the icon', () => {
      const t = createTemplate('Label', 'OldIcon')
      const updated = updateTemplate(t, { icon: 'NewIcon' })
      expect(updated.icon).toBe('NewIcon')
    })

    it('updates the description', () => {
      const t = createTemplate('Label', 'Icon', 'Old desc')
      const updated = updateTemplate(t, { description: 'New desc' })
      expect(updated.description).toBe('New desc')
    })

    it('does not mutate the original template', () => {
      const t = createTemplate('Label', 'Icon')
      updateTemplate(t, { label: 'Changed' })
      expect(t.label).toBe('Label')
    })
  })

  describe('deleteTemplate', () => {
    it('removes the template by id', () => {
      const t1 = createTemplate('A', 'X')
      const t2 = createTemplate('B', 'Y')
      const result = deleteTemplate([t1, t2], t1.id)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(t2.id)
    })

    it('returns same array when id not found', () => {
      const t1 = createTemplate('A', 'X')
      const result = deleteTemplate([t1], 'nonexistent')
      expect(result).toHaveLength(1)
    })

    it('handles empty array', () => {
      const result = deleteTemplate([], 'any')
      expect(result).toHaveLength(0)
    })
  })

  describe('instantiateTemplate', () => {
    it('creates a CustomField from template', () => {
      const t = createTemplate('Combat Notes', 'Swords')
      const field = instantiateTemplate(t)
      expect(field.label).toBe('Combat Notes')
      expect(field.templateId).toBe(t.id)
      expect(field.content.markdown).toBe('')
    })

    it('creates independent content for each instantiation', () => {
      const t = createTemplate('Notes', 'Edit')
      const f1 = instantiateTemplate(t)
      const f2 = instantiateTemplate(t)
      expect(f1.content).not.toBe(f2.content)
    })
  })
})
