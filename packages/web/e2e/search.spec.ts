import { test, expect } from '@playwright/test'

test.describe('Search Page', () => {
  test('renders heading and search input', async ({ page }) => {
    await page.goto('/search')
    await expect(page.locator('main h2')).toContainText('Search')
    const input = page.getByPlaceholder('Search your notes...')
    await expect(input).toBeVisible()
    await expect(input).toBeFocused()
  })

  test('renders PARA folder filters', async ({ page }) => {
    await page.goto('/search')
    const filters = ['All', 'inbox', 'projects', 'areas', 'resources', 'archive']
    for (const f of filters) {
      await expect(page.getByRole('button', { name: f, exact: true })).toBeVisible()
    }
  })

  test('filter buttons toggle active state', async ({ page }) => {
    await page.goto('/search')
    const projectsBtn = page.getByRole('button', { name: 'projects', exact: true })
    await projectsBtn.click()

    // After clicking, the button should have accent background
    const bg = await projectsBtn.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(bg).not.toBe('rgba(0, 0, 0, 0)')
  })

  test('search input accepts text', async ({ page }) => {
    await page.goto('/search')
    const input = page.getByPlaceholder('Search your notes...')
    await input.fill('RAG chunking')
    await expect(input).toHaveValue('RAG chunking')
  })
})
