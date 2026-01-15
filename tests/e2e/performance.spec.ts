import { test, expect, type Page } from '@playwright/test'

const MODELS = {
  desktop: [
    'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    'gemma-2-2b-it-q4f16_1-MLC',
    'Llama-3.2-1B-Instruct-q4f16_1-MLC',
  ],
  ios: [
    'SmolLM2-135M-Instruct-q0f16-MLC',
    'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC',
  ],
}

// Detect platform
const getPlatformModels = async (page: Page): Promise<string[]> => {
  const isIOS = await page.evaluate(() => {
    const ua = navigator.userAgent
    return /iPad|iPhone|iPod/.test(ua) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  })
  return isIOS ? MODELS.ios : MODELS.desktop
}

test.describe('Performance Benchmarks', () => {
  test.setTimeout(600000) // 10 minutes for model downloads

  test.beforeEach(async ({ page }) => {
    await page.goto('/')

    // Check for WebGPU and SharedArrayBuffer support
    const hasWebGPU = await page.evaluate(() => 'gpu' in navigator)
    const hasSAB = await page.evaluate(() => typeof SharedArrayBuffer !== 'undefined')

    if (!hasWebGPU) {
      test.skip(true, 'WebGPU not available')
    }
    if (!hasSAB) {
      test.skip(true, 'SharedArrayBuffer not available (COOP/COEP headers missing)')
    }
  })

  test('measure first token latency for available models', async ({ page }) => {
    const models = await getPlatformModels(page)
    const results: Record<string, number[]> = {}

    // Navigate to settings (where model downloader is available)
    await page.click('[href="/settings"]')
    await expect(page).toHaveURL('/settings')

    for (const modelId of models) {
      console.log(`\n=== Testing ${modelId} ===`)

      // Download model if not already downloaded
      const downloadButton = page.locator(`button:has-text("Download"):near(:text("${modelId.split('-')[0]}"))`).first()
      if (await downloadButton.isVisible()) {
        console.log('Downloading model...')
        await downloadButton.click()

        // Wait for download to complete (check for "Set as Active" button)
        await expect(page.locator(`button:has-text("Set as Active"):near(:text("${modelId.split('-')[0]}"))`).first())
          .toBeVisible({ timeout: 300000 }) // 5 minutes
        console.log('Model downloaded')
      }

      // Set as active model
      const setActiveButton = page.locator(`button:has-text("Set as Active"):near(:text("${modelId.split('-')[0]}"))`).first()
      if (await setActiveButton.isVisible()) {
        await setActiveButton.click()
        await page.waitForTimeout(2000) // Wait for model to load
      }

      // Navigate to chat (root route)
      await page.click('[href="/"]')
      await expect(page).toHaveURL('/')

      // Run 3 measurements
      results[modelId] = []
      for (let i = 0; i < 3; i++) {
        console.log(`Measurement ${i + 1}/3`)

        // Type a test prompt
        const input = page.locator('textarea[placeholder*="Message"]')
        await input.fill('What is the capital of France?')

        // Measure time to first token
        const startTime = Date.now()
        await page.locator('button[type="submit"]').click()

        // Wait for first message chunk to appear
        await expect(page.locator('.prose').last()).toBeVisible({ timeout: 30000 })
        const firstTokenTime = Date.now()

        const ttft = firstTokenTime - startTime
        results[modelId].push(ttft)
        console.log(`TTFT: ${ttft}ms`)

        // Wait for generation to complete
        await page.waitForTimeout(5000)

        // Clear conversation for next test
        await page.click('[data-testid="new-conversation"]')
        await page.waitForTimeout(1000)
      }

      // Calculate stats
      const avg = results[modelId].reduce((a, b) => a + b, 0) / results[modelId].length
      const median = results[modelId].sort((a, b) => a - b)[Math.floor(results[modelId].length / 2)]
      console.log(`Average TTFT: ${avg.toFixed(0)}ms`)
      console.log(`Median TTFT: ${median.toFixed(0)}ms`)

      // Assert reasonable performance (< 15 seconds for first token)
      expect(avg).toBeLessThan(15000)
    }

    // Print final report
    console.log('\n=== Performance Report ===')
    for (const [modelId, latencies] of Object.entries(results)) {
      const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length
      const median = latencies.sort((a, b) => a - b)[Math.floor(latencies.length / 2)]
      console.log(`${modelId}:`)
      console.log(`  Average TTFT: ${avg.toFixed(0)}ms`)
      console.log(`  Median TTFT:  ${median.toFixed(0)}ms`)
    }
  })

  test('measure throughput for one model', async ({ page }) => {
    const models = await getPlatformModels(page)
    const modelId = models[0] // Test first available model

    console.log(`\n=== Throughput Test for ${modelId} ===`)

    // Navigate to settings and ensure model is active
    await page.click('[href="/settings"]')
    await expect(page).toHaveURL('/settings')

    const downloadButton = page.locator(`button:has-text("Download"):near(:text("${modelId.split('-')[0]}"))`).first()
    if (await downloadButton.isVisible()) {
      await downloadButton.click()
      await expect(page.locator(`button:has-text("Set as Active"):near(:text("${modelId.split('-')[0]}"))`).first())
        .toBeVisible({ timeout: 300000 })
    }

    const setActiveButton = page.locator(`button:has-text("Set as Active"):near(:text("${modelId.split('-')[0]}"))`).first()
    if (await setActiveButton.isVisible()) {
      await setActiveButton.click()
      await page.waitForTimeout(2000)
    }

    // Navigate to chat (root route)
    await page.click('[href="/"]')
    await expect(page).toHaveURL('/')

    // Send a longer prompt
    const input = page.locator('textarea[placeholder*="Message"]')
    await input.fill('Explain the concept of machine learning in simple terms with examples.')

    const startTime = Date.now()
    await page.locator('button[type="submit"]').click()

    // Wait for generation to complete (when send button is enabled again)
    await expect(page.locator('button[type="submit"]')).toBeEnabled({ timeout: 120000 })
    const endTime = Date.now()

    const totalTime = endTime - startTime
    console.log(`Total generation time: ${totalTime}ms`)

    // Try to get tokens/sec from the UI if available
    const statsText = await page.locator('text=/\\d+\\.\\d+ tok\\/s/i').textContent().catch(() => null)
    if (statsText) {
      console.log(`Throughput: ${statsText}`)
    }

    // Assert generation completed in reasonable time (< 2 minutes)
    expect(totalTime).toBeLessThan(120000)
  })
})
