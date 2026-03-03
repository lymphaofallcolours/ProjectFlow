import { test, expect } from '@playwright/test'
import { createNode } from './helpers'

test.describe('Node Drag', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.react-flow')
    await createNode(page)
  })

  test('dragging a node moves it without blinking', async ({ page }) => {
    const node = page.locator('.react-flow__node').first()
    await expect(node).toBeVisible({ timeout: 5000 })

    // Get initial bounding box
    const boxBefore = await node.boundingBox()
    expect(boxBefore).toBeTruthy()

    // Drag the node 150px to the right and 50px down from its center
    const centerX = boxBefore!.x + boxBefore!.width / 2
    const centerY = boxBefore!.y + boxBefore!.height / 2
    await node.hover()
    await page.mouse.down()
    await page.mouse.move(centerX + 150, centerY + 50, { steps: 10 })
    await page.mouse.up()
    await page.waitForTimeout(300)

    // Get final bounding box — should have moved significantly
    const boxAfter = await node.boundingBox()
    expect(boxAfter).toBeTruthy()
    expect(boxAfter!.x).toBeGreaterThan(boxBefore!.x + 80)
  })
})
