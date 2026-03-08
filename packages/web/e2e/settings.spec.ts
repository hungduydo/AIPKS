import { test, expect } from '@playwright/test'

test.describe('Settings Page', () => {
  test('renders heading and all sections', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.locator('main h2')).toContainText('Settings')

    await expect(page.getByRole('heading', { name: 'API Server' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Storage' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Index' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Configuration' })).toBeVisible()
  })

  test('shows API URL and test button', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByText('http://localhost:3001')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Test' })).toBeVisible()
  })

  test('shows environment variable config', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByText('OPENAI_API_KEY')).toBeVisible()
    await expect(page.getByText('BRAIN_FOLDER')).toBeVisible()
  })

  test('shows rebuild CLI command', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByText('aipks add ./brain --force')).toBeVisible()
  })
})
