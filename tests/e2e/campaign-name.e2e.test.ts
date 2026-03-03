import { test, expect } from '@playwright/test'

test.describe('Campaign Name Editing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.react-flow')
  })

  test('click campaign name opens editor, Enter confirms', async ({ page }) => {
    // Click the campaign name in the status bar
    const nameButton = page.locator('[data-testid="campaign-name"]')
    await expect(nameButton).toBeVisible()
    await expect(nameButton).toHaveText('Untitled Campaign')

    await nameButton.click()

    // Input should appear
    const nameInput = page.locator('[data-testid="campaign-name-input"]')
    await expect(nameInput).toBeVisible()

    // Clear and type new name
    await nameInput.fill('Dark Heresy Campaign')
    await nameInput.press('Enter')

    // Should show the new name
    const updatedName = page.locator('[data-testid="campaign-name"]')
    await expect(updatedName).toHaveText('Dark Heresy Campaign')
  })

  test('Escape cancels the edit', async ({ page }) => {
    const nameButton = page.locator('[data-testid="campaign-name"]')
    await nameButton.click()

    const nameInput = page.locator('[data-testid="campaign-name-input"]')
    await nameInput.fill('Should Not Persist')
    await nameInput.press('Escape')

    // Name should remain unchanged
    const updatedName = page.locator('[data-testid="campaign-name"]')
    await expect(updatedName).toHaveText('Untitled Campaign')
  })
})
