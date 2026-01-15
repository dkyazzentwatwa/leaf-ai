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

    // Check if model downloader is visible (no model ready)
    const hasModelDownloader = await page.locator('text=/Select Model|Download an AI model/i').isVisible()

    if (hasModelDownloader) {
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

      // Find the textarea input
      const input = page.locator('textarea').first()
      await expect(input).toBeVisible({ timeout: 10000 })

      // Type a test prompt
      await input.fill('What is 2+2?')

      // Measure time to first token
      const startTime = Date.now()

      // Click send button
      const sendButton = page.locator('button[type="submit"]').first()
      await sendButton.click()

      // Wait for AI response to start appearing
      // Look for the assistant message container
      await page.waitForSelector('[data-message-role="assistant"]', { timeout: 30000 })

      const firstTokenTime = Date.now()
      const ttft = firstTokenTime - startTime

      results.push(ttft)
      console.log(`  TTFT: ${ttft}ms`)

      // Wait for generation to complete (send button re-enabled)
      await expect(sendButton).toBeEnabled({ timeout: 60000 })
      console.log(`  Generation complete`)

      // Wait a moment before next test
      await page.waitForTimeout(2000)

      // Start new conversation for next test
      const newChatButton = page.locator('button:has-text("New Chat")').first()
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

    // Check if model is ready
    const hasModelDownloader = await page.locator('text=/Select Model|Download an AI model/i').isVisible()
    if (hasModelDownloader) {
      test.skip(true, 'No model downloaded')
      return
    }

    console.log('✓ Model is ready')
    console.log('\n=== Throughput Test ===')

    // Find the textarea input
    const input = page.locator('textarea').first()
    await expect(input).toBeVisible({ timeout: 10000 })

    // Type a longer prompt
    await input.fill('Explain machine learning in 2-3 sentences.')

    // Click send and measure total generation time
    const startTime = Date.now()
    const sendButton = page.locator('button[type="submit"]').first()
    await sendButton.click()

    // Wait for generation to complete
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
