import { test, expect } from '@playwright/test'

test.describe('Sources Page', () => {
  test('renders heading and tabs', async ({ page }) => {
    await page.goto('/sources')
    await expect(page.locator('main h2')).toContainText('Sources')

    await expect(page.getByText('Folder / File')).toBeVisible()
    await expect(page.getByText('Web URL')).toBeVisible()
    await expect(page.getByText('Notion')).toBeVisible()
    await expect(page.getByText('GitHub')).toBeVisible()
  })

  test('folder tab shows path input and index button', async ({ page }) => {
    await page.goto('/sources')
    const input = page.getByPlaceholder(/Users\/you\/notes/)
    await expect(input).toBeVisible()
    await expect(page.getByRole('button', { name: /Index Content/i })).toBeVisible()
  })

  test('web tab shows URL input', async ({ page }) => {
    await page.goto('/sources')
    await page.getByText('Web URL').click()
    await expect(page.getByPlaceholder(/https:\/\/example/)).toBeVisible()
  })

  test('notion tab shows coming soon', async ({ page }) => {
    await page.goto('/sources')
    await page.getByText('Notion').click()
    await expect(page.getByText('Coming soon.')).toBeVisible()
  })

  test('github tab shows coming soon', async ({ page }) => {
    await page.goto('/sources')
    await page.getByText('GitHub').click()
    await expect(page.getByText('Coming soon.')).toBeVisible()
  })

  test('index button is disabled when input is empty', async ({ page }) => {
    await page.goto('/sources')
    const btn = page.getByRole('button', { name: /Index Content/i })
    await expect(btn).toBeDisabled()
  })

  test('CLI tips section is visible', async ({ page }) => {
    await page.goto('/sources')
    await expect(page.getByText('CLI commands')).toBeVisible()
    await expect(page.getByText('aipks add ./brain')).toBeVisible()
  })
})
