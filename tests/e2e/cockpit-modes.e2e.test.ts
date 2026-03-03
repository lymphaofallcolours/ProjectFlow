import { test, expect } from '@playwright/test'
import { createNode } from './helpers'

test.describe('Cockpit Modes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.react-flow')
    await createNode(page)
  })

  test('double-click opens cockpit, scrollable toggle changes panel layout', async ({ page }) => {
    const node = page.locator('.react-flow__node').first()
    await expect(node).toBeVisible({ timeout: 5000 })

    // Double-click to open cockpit
    await node.dblclick()
    await page.waitForTimeout(500)

    // Cockpit should be visible (overlay backdrop with grid of panels)
    const cockpit = page.locator('[data-testid="cockpit-scroll-toggle"]')
    await expect(cockpit).toBeVisible({ timeout: 3000 })

    // Initially in auto-expand mode — button shows current state "Auto-expand"
    await expect(cockpit).toContainText('Auto-expand')

    // Click to switch to scrollable mode
    await cockpit.click()
    await page.waitForTimeout(200)

    // Button should now show current state "Scrollable"
    await expect(cockpit).toContainText('Scrollable')

    // Field panels should have max-height constraint
    const panel = page.locator('.glass-panel.rounded-xl .border-t.border-border').first()
    if (await panel.isVisible()) {
      const maxHeight = await panel.evaluate((el) => getComputedStyle(el).maxHeight)
      expect(maxHeight).toBe('300px')
    }

    // Click again to go back to auto-expand
    await cockpit.click()
    await page.waitForTimeout(200)
    await expect(cockpit).toContainText('Auto-expand')
  })
})
