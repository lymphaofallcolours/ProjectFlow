import type { Page } from '@playwright/test'

/**
 * Creates a new node on the canvas by clicking "New Node" and selecting "Event" scene type.
 * Returns after the node is visible on the canvas.
 */
export async function createNode(page: Page): Promise<void> {
  await page.click('button[title="New Node"]')
  // Wait for the scene type picker to appear, then click the first option (Event)
  const picker = page.locator('.absolute.top-full.glass-panel button, .absolute.top-full button').first()
  await picker.waitFor({ state: 'visible', timeout: 3000 })
  await picker.click()
  // Wait for node to appear on canvas
  await page.locator('.react-flow__node').first().waitFor({ state: 'visible', timeout: 5000 })
}
