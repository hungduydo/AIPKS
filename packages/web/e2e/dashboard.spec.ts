import { test, expect } from '@playwright/test'

test.describe('Dashboard Page', () => {
  test('renders page heading and description', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('main h2')).toContainText('Dashboard')
    await expect(page.getByText('Your knowledge base at a glance')).toBeVisible()
  })

  test('renders stat cards', async ({ page }) => {
    await page.goto('/')
    const labels = ['Notes', 'Chunks', 'Vectors', 'Last Report']
    for (const label of labels) {
      await expect(page.getByText(label, { exact: true })).toBeVisible()
    }
  })

  test('renders quick action buttons', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('main').getByRole('link', { name: /Ask a Question/i })).toBeVisible()
    await expect(page.locator('main').getByRole('link', { name: /Search/i })).toBeVisible()
    await expect(page.locator('main').getByRole('link', { name: /Add Content/i })).toBeVisible()
  })

  test('quick action links navigate correctly', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: /Ask a Question/i }).click()
    await expect(page).toHaveURL('/ask')

    await page.goto('/')
    await page.getByRole('link', { name: /Search/i }).first().click()
    await expect(page).toHaveURL('/search')
  })

  test('renders recent notes section', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Recent Notes')).toBeVisible()
  })

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Filter out expected API connection errors (API server not running in test)
    const unexpectedErrors = errors.filter(
      (e) => !e.includes('fetch') && !e.includes('Failed to load') && !e.includes('ERR_CONNECTION')
    )
    expect(unexpectedErrors).toHaveLength(0)
  })
})
