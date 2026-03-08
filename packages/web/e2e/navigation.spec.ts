import { test, expect } from '@playwright/test'

test.describe('Navigation & Layout', () => {
  test('sidebar renders with all nav links', async ({ page }) => {
    await page.goto('/')
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()

    // Logo
    await expect(sidebar.getByText('AIPKS')).toBeVisible()

    // Nav links
    const links = ['Dashboard', 'Ask', 'Search', 'Knowledge', 'Sources', 'Reports', 'Settings']
    for (const label of links) {
      await expect(sidebar.getByText(label, { exact: true })).toBeVisible()
    }
  })

  test('sidebar highlights active route', async ({ page }) => {
    await page.goto('/search')
    const searchLink = page.locator('aside a[href="/search"]')
    const bgColor = await searchLink.evaluate((el) => getComputedStyle(el).backgroundColor)
    // Active link should have non-transparent background
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)')
  })

  test('navigates between pages via sidebar', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('main h2')).toContainText('Dashboard')

    await page.locator('aside').getByText('Search', { exact: true }).click()
    await expect(page).toHaveURL('/search')
    await expect(page.locator('main h2')).toContainText('Search')

    await page.locator('aside').getByText('Ask', { exact: true }).click()
    await expect(page).toHaveURL('/ask')
    await expect(page.locator('main h2')).toContainText('Ask')

    await page.locator('aside').getByText('Knowledge', { exact: true }).click()
    await expect(page).toHaveURL('/knowledge')
    await expect(page.locator('main h2')).toContainText('Knowledge Base')

    await page.locator('aside').getByText('Sources', { exact: true }).click()
    await expect(page).toHaveURL('/sources')
    await expect(page.locator('main h2')).toContainText('Sources')

    await page.locator('aside').getByText('Reports', { exact: true }).click()
    await expect(page).toHaveURL('/reports')
    await expect(page.locator('main h2')).toContainText('Reports')

    await page.locator('aside').getByText('Settings', { exact: true }).click()
    await expect(page).toHaveURL('/settings')
    await expect(page.locator('main h2')).toContainText('Settings')
  })

  test('main content area has correct offset from sidebar', async ({ page }) => {
    await page.goto('/')
    const main = page.locator('main')
    // ml-60 = 15rem = 240px; check computed margin-left on main
    // Note: Playwright headless may report 0 for margin-left on flex children,
    // so we check the inner content container position instead
    const contentBox = await page.locator('main > div').evaluate((el) => el.getBoundingClientRect())
    // Content should start after the sidebar area (at least 200px from left)
    expect(contentBox.x).toBeGreaterThanOrEqual(200)
  })
})
