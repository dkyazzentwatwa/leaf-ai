import { test, expect } from '@playwright/test'

test.describe('Performance Benchmarks', () => {
  test.setTimeout(300000)

  test.beforeEach(async ({ page }) => {
    await page.goto('/')

    const hasWebGPU = await page.evaluate(() => 'gpu' in navigator)
    const hasSAB = await page.evaluate(() => typeof SharedArrayBuffer !== 'undefined')

    if (!hasWebGPU) {
      test.skip(true, 'WebGPU not available')
    }
    if (!hasSAB) {
      test.skip(true, 'SharedArrayBuffer not available (COOP/COEP headers missing)')
    }
  })

  test('measure first token latency for pre-downloaded model', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    const chatInput = page.locator('[data-testid="chat-input"]').first()
    if (!(await chatInput.isVisible().catch(() => false))) {
      test.skip(true, 'No model downloaded - please preload a model from the UI')
      return
    }

    const sendButton = page.locator('[data-testid="send-message"]').first()
    const results: number[] = []

    for (let i = 0; i < 3; i++) {
      await chatInput.fill('What is the capital of France?')

      const startTime = Date.now()
      await sendButton.click()

      await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 30000 })
      const firstTokenTime = Date.now()

      const ttft = firstTokenTime - startTime
      results.push(ttft)

      await expect(sendButton).toBeVisible({ timeout: 120000 })
      await expect(sendButton).toBeEnabled({ timeout: 120000 })

      const newConversation = page.locator('[data-testid="new-conversation"]').first()
      if (await newConversation.isVisible().catch(() => false)) {
        await newConversation.click()
        await page.waitForTimeout(1000)
      }
    }

    const avg = results.reduce((a, b) => a + b, 0) / results.length
    expect(avg).toBeLessThan(15000)
  })

  test('measure throughput for pre-downloaded model', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    const chatInput = page.locator('[data-testid="chat-input"]').first()
    if (!(await chatInput.isVisible().catch(() => false))) {
      test.skip(true, 'No model downloaded - please preload a model from the UI')
      return
    }

    const sendButton = page.locator('[data-testid="send-message"]').first()

    await chatInput.fill('Explain the concept of machine learning in simple terms with examples.')

    const startTime = Date.now()
    await sendButton.click()
    await expect(sendButton).toBeVisible({ timeout: 120000 })
    await expect(sendButton).toBeEnabled({ timeout: 120000 })
    const endTime = Date.now()

    const totalTime = endTime - startTime
    expect(totalTime).toBeLessThan(120000)
  })
})
