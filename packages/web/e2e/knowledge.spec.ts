import { test, expect } from '@playwright/test'

test.describe('Knowledge Page', () => {
  test('renders heading and add content button', async ({ page }) => {
    await page.goto('/knowledge')
    await expect(page.locator('main h2')).toContainText('Knowledge Base')
    await expect(page.getByRole('link', { name: /Add Content/i })).toBeVisible()
  })

  test('renders PARA folder filters', async ({ page }) => {
    await page.goto('/knowledge')
    const filters = ['All', 'inbox', 'projects', 'areas', 'resources', 'archive']
    for (const f of filters) {
      await expect(page.getByRole('button', { name: f, exact: true })).toBeVisible()
    }
  })

  test('renders table headers', async ({ page }) => {
    await page.goto('/knowledge')
    // Wait for table to load (may show loading state first)
    await page.waitForSelector('table', { timeout: 10_000 })
    const headers = ['Title', 'Folder', 'Domain', 'Tags', 'Indexed']
    for (const h of headers) {
      await expect(page.locator('th').getByText(h, { exact: true })).toBeVisible()
    }
  })

  test('add content button links to sources', async ({ page }) => {
    await page.goto('/knowledge')
    await page.getByRole('link', { name: /Add Content/i }).click()
    await expect(page).toHaveURL('/sources')
  })
})
