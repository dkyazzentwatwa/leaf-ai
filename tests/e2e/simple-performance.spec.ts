import { test, expect } from '@playwright/test'

/**
 * Simple Performance Test
 *
 * This test assumes you already have a model downloaded.
 * Manual setup: Visit http://localhost:5173, download a model, then run this test.
 */

test.describe('Simple Performance Test', () => {
  test.setTimeout(300000) // 5 minutes

  test.beforeEach(async ({ page }) => {
    // Check for WebGPU and SharedArrayBuffer support
    const hasWebGPU = await page.evaluate(() => 'gpu' in navigator)
    const hasSAB = await page.evaluate(() => typeof SharedArrayBuffer !== 'undefined')

    if (!hasWebGPU) {
      test.skip(true, 'WebGPU not available')
    }
    if (!hasSAB) {
      test.skip(true, 'SharedArrayBuffer not available')
    }
  })

  test('measure TTFT for pre-downloaded model', async ({ page }) => {
    await page.goto('/')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    const chatInput = page.locator('[data-testid="chat-input"]').first()
    if (!(await chatInput.isVisible().catch(() => false))) {
      console.log('❌ No model is downloaded. Please:')
      console.log('   1. Visit http://localhost:5173')
      console.log('   2. Download a model (e.g., Llama 3.2 1B)')
      console.log('   3. Run this test again')
      test.skip(true, 'No model downloaded - manual setup required')
      return
    }

    // Model is ready, chat interface should be visible
    console.log('✓ Model is ready')

    // Run 3 TTFT measurements
    const results: number[] = []

    for (let i = 0; i < 3; i++) {
      console.log(`\nMeasurement ${i + 1}/3`)

      // Type a test prompt
      await expect(chatInput).toBeVisible({ timeout: 10000 })
      await chatInput.fill('What is 2+2?')

      // Measure time to first token
      const startTime = Date.now()

      // Click send button
      const sendButton = page.locator('[data-testid="send-message"]').first()
      await sendButton.click()

      // Wait for AI response to start appearing
      await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 30000 })

      const firstTokenTime = Date.now()
      const ttft = firstTokenTime - startTime

      results.push(ttft)
      console.log(`  TTFT: ${ttft}ms`)

      // Wait for generation to complete (send button re-enabled)
      await expect(sendButton).toBeVisible({ timeout: 60000 })
      await expect(sendButton).toBeEnabled({ timeout: 60000 })
      console.log(`  Generation complete`)

      // Wait a moment before next test
      await page.waitForTimeout(2000)

      // Start new conversation for next test
      const newChatButton = page.locator('[data-testid="new-conversation"]').first()
      if (await newChatButton.isVisible()) {
        await newChatButton.click()
        await page.waitForTimeout(1000)
      }
    }

    // Calculate statistics
    const avg = results.reduce((a, b) => a + b, 0) / results.length
    const median = [...results].sort((a, b) => a - b)[Math.floor(results.length / 2)]
    const min = Math.min(...results)
    const max = Math.max(...results)

    console.log('\n=== Performance Summary ===')
    console.log(`Average TTFT: ${avg.toFixed(0)}ms`)
    console.log(`Median TTFT:  ${median.toFixed(0)}ms`)
    console.log(`Min TTFT:     ${min.toFixed(0)}ms`)
    console.log(`Max TTFT:     ${max.toFixed(0)}ms`)

    // Assert reasonable performance (< 15 seconds for first token)
    expect(avg).toBeLessThan(15000)
  })

  test('measure throughput for pre-downloaded model', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const chatInput = page.locator('[data-testid="chat-input"]').first()
    if (!(await chatInput.isVisible().catch(() => false))) {
      test.skip(true, 'No model downloaded')
      return
    }

    console.log('✓ Model is ready')
    console.log('\n=== Throughput Test ===')

    // Type a longer prompt
    await expect(chatInput).toBeVisible({ timeout: 10000 })
    await chatInput.fill('Explain machine learning in 2-3 sentences.')

    // Click send and measure total generation time
    const startTime = Date.now()
    const sendButton = page.locator('[data-testid="send-message"]').first()
    await sendButton.click()

    // Wait for generation to complete
    await expect(sendButton).toBeVisible({ timeout: 120000 })
    await expect(sendButton).toBeEnabled({ timeout: 120000 })
    const endTime = Date.now()

    const totalTime = endTime - startTime
    console.log(`Total generation time: ${(totalTime / 1000).toFixed(2)}s`)

    // Try to extract tokens/sec from stats display
    const statsElement = await page.locator('text=/\\d+\\.\\d+\\s*tok[\\s/]*s/i').first().textContent().catch(() => null)
    if (statsElement) {
      const match = statsElement.match(/([\d.]+)\s*tok/)
      if (match) {
        const tokensPerSec = parseFloat(match[1])
        console.log(`Throughput: ${tokensPerSec.toFixed(2)} tok/s`)

        // Assert reasonable throughput (> 0.5 tok/s)
        expect(tokensPerSec).toBeGreaterThan(0.5)
      }
    }

    // Assert generation completed in reasonable time (< 2 minutes)
    expect(totalTime).toBeLessThan(120000)
  })
})
