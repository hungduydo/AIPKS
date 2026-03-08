import { test, expect } from '@playwright/test'

test.describe('Ask Page', () => {
  test('renders heading and empty state', async ({ page }) => {
    await page.goto('/ask')
    await expect(page.locator('main h2')).toContainText('Ask')
    await expect(page.getByText('Ask anything about your notes')).toBeVisible()
  })

  test('renders input field and send button', async ({ page }) => {
    await page.goto('/ask')
    const input = page.getByPlaceholder('Ask a question...')
    await expect(input).toBeVisible()

    const sendBtn = page.getByRole('button', { name: '' }).or(page.locator('button[type="submit"]'))
    await expect(sendBtn.first()).toBeVisible()
  })

  test('send button is disabled when input is empty', async ({ page }) => {
    await page.goto('/ask')
    const sendBtn = page.locator('button[type="submit"]')
    await expect(sendBtn).toBeDisabled()
  })

  test('send button enables when text is entered', async ({ page }) => {
    await page.goto('/ask')
    const input = page.getByPlaceholder('Ask a question...')
    const sendBtn = page.locator('button[type="submit"]')

    await input.fill('What is RAG?')
    await expect(sendBtn).toBeEnabled()
  })

  test('submitting adds user message to chat', async ({ page }) => {
    await page.goto('/ask')
    const input = page.getByPlaceholder('Ask a question...')
    await input.fill('Hello world')
    await input.press('Enter')

    // User message should appear
    await expect(page.getByText('Hello world')).toBeVisible()
    // Input should be cleared
    await expect(input).toHaveValue('')
  })
})
