import { test, expect } from '@playwright/test'
import { createNode } from './helpers'

test.describe('Node Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.react-flow')
  })

  test('single click selects a node immediately', async ({ page }) => {
    await createNode(page)

    const node = page.locator('.react-flow__node').first()
    await expect(node).toBeVisible({ timeout: 5000 })

    // Single click the node
    await node.click()

    // Assert it is selected (React Flow adds 'selected' class)
    await expect(node).toHaveClass(/selected/, { timeout: 2000 })
  })

  test('clicking canvas deselects all nodes', async ({ page }) => {
    await createNode(page)

    const node = page.locator('.react-flow__node').first()
    await expect(node).toBeVisible({ timeout: 5000 })

    // Select it
    await node.click()
    await expect(node).toHaveClass(/selected/, { timeout: 2000 })

    // Click the canvas pane
    await page.locator('.react-flow__pane').click({ position: { x: 50, y: 50 } })

    // Node should no longer be selected
    await expect(node).not.toHaveClass(/selected/, { timeout: 2000 })
  })

  // Firefox: React Flow's pane overlay intercepts Ctrl+Click events on nodes,
  // preventing Playwright from dispatching to the node element. Chromium works fine.
  test('Ctrl+Click adds node to multi-selection', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'React Flow pane intercepts Ctrl+Click in Firefox Playwright')

    await createNode(page)
    await createNode(page)

    const nodes = page.locator('.react-flow__node')
    await expect(nodes).toHaveCount(2, { timeout: 5000 })

    // Click first node
    await nodes.first().click()
    await expect(nodes.first()).toHaveClass(/selected/, { timeout: 2000 })

    // Ctrl+Click second node to add to selection
    await nodes.nth(1).click({ modifiers: ['Control'] })
    await expect(nodes.nth(1)).toHaveClass(/selected/, { timeout: 2000 })
  })
})
