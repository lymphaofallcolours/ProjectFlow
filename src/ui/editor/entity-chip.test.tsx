import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EntityChip } from './entity-chip'

describe('EntityChip', () => {
  describe('present mode (@)', () => {
    it('renders PC chip with name', () => {
      render(<EntityChip name="Alfa" entityType="pc" mode="present" />)
      expect(screen.getByText('Alfa')).toBeDefined()
    })

    it('renders NPC chip', () => {
      render(<EntityChip name="Voss" entityType="npc" mode="present" />)
      expect(screen.getByText('Voss')).toBeDefined()
    })

    it('renders enemy chip', () => {
      render(<EntityChip name="Carnifex" entityType="enemy" mode="present" />)
      expect(screen.getByText('Carnifex')).toBeDefined()
    })

    it('renders object chip', () => {
      render(<EntityChip name="Rosarius" entityType="object" mode="present" />)
      expect(screen.getByText('Rosarius')).toBeDefined()
    })

    it('renders location chip', () => {
      render(<EntityChip name="Hive Primus" entityType="location" mode="present" />)
      expect(screen.getByText('Hive Primus')).toBeDefined()
    })

    it('renders secret chip', () => {
      render(<EntityChip name="Genestealer" entityType="secret" mode="present" />)
      expect(screen.getByText('Genestealer')).toBeDefined()
    })
  })

  describe('mentioned mode (#)', () => {
    it('renders mentioned chip with dashed border', () => {
      const { container } = render(
        <EntityChip name="Bravo" entityType="pc" mode="mentioned" />,
      )
      const chip = container.firstElementChild as HTMLElement
      expect(chip.style.border).toContain('dashed')
    })

    it('renders present chip with solid border', () => {
      const { container } = render(
        <EntityChip name="Alfa" entityType="pc" mode="present" />,
      )
      const chip = container.firstElementChild as HTMLElement
      expect(chip.style.border).toContain('solid')
    })
  })

  describe('status display', () => {
    it('shows status badge when present', () => {
      render(
        <EntityChip name="Alfa" entityType="pc" mode="present" status="wounded" />,
      )
      expect(screen.getByText('+wounded')).toBeDefined()
    })

    it('does not show status badge when absent', () => {
      render(<EntityChip name="Alfa" entityType="pc" mode="present" />)
      expect(screen.queryByText(/\+/)).toBeNull()
    })
  })

  describe('tooltip', () => {
    it('includes entity type and name in title', () => {
      const { container } = render(
        <EntityChip name="Voss" entityType="npc" mode="present" />,
      )
      const chip = container.firstElementChild as HTMLElement
      expect(chip.title).toContain('NPC')
      expect(chip.title).toContain('Voss')
    })

    it('includes status in title when present', () => {
      const { container } = render(
        <EntityChip name="Alfa" entityType="pc" mode="present" status="dead" />,
      )
      const chip = container.firstElementChild as HTMLElement
      expect(chip.title).toContain('+dead')
    })
  })
})
