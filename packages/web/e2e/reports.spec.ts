import { test, expect } from '@playwright/test'

test.describe('Reports Page', () => {
  test('renders heading and generate button', async ({ page }) => {
    await page.goto('/reports')
    await expect(page.locator('main h2')).toContainText('Reports')
    await expect(page.getByRole('button', { name: /Generate Report/i })).toBeVisible()
  })

  test('shows empty state for report content', async ({ page }) => {
    await page.goto('/reports')
    await expect(page.getByText('Select a report to view')).toBeVisible()
  })
})
