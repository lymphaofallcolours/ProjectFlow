import { test, expect } from '@playwright/test'
import { createNode } from './helpers'

test.describe('Subnode Trigger', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.react-flow')
    await createNode(page)
  })

  test('Shift+Click on a node shows subnodes with scrim', async ({ page }) => {
    const node = page.locator('.react-flow__node').first()
    await expect(node).toBeVisible({ timeout: 5000 })

    // Shift+Click the node to trigger subnodes
    await node.click({ modifiers: ['Shift'] })
    await page.waitForTimeout(300)

    // Subnodes should be visible (radial buttons in a fixed overlay)
    const subnodeButtons = page.locator('.fixed.inset-0.z-40 button')
    await expect(subnodeButtons.first()).toBeVisible({ timeout: 3000 })

    // Scrim overlay should be visible
    const scrim = page.locator('.fixed.inset-0.z-40 > div').first()
    await expect(scrim).toBeVisible()
  })

  test('clicking canvas dismisses subnodes', async ({ page }) => {
    const node = page.locator('.react-flow__node').first()
    await node.click({ modifiers: ['Shift'] })
    await page.waitForTimeout(300)

    // Subnodes visible
    const subnodeButtons = page.locator('.fixed.inset-0.z-40 button')
    await expect(subnodeButtons.first()).toBeVisible({ timeout: 3000 })

    // Click canvas pane
    await page.locator('.react-flow__pane').click({ position: { x: 50, y: 50 } })
    await page.waitForTimeout(300)

    // Subnodes should be dismissed
    await expect(subnodeButtons.first()).not.toBeVisible({ timeout: 2000 })
  })

  test('select node then press Shift toggles subnodes', async ({ page }) => {
    const node = page.locator('.react-flow__node').first()

    // Select the node
    await node.click()
    await expect(node).toHaveClass(/selected/, { timeout: 2000 })

    // Press Shift key alone
    await page.keyboard.press('Shift')
    await page.waitForTimeout(300)

    // Subnodes should appear
    const subnodeButtons = page.locator('.fixed.inset-0.z-40 button')
    await expect(subnodeButtons.first()).toBeVisible({ timeout: 3000 })

    // Press Shift again to dismiss
    await page.keyboard.press('Shift')
    await page.waitForTimeout(300)
    await expect(subnodeButtons.first()).not.toBeVisible({ timeout: 2000 })
  })
})
