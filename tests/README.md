# Performance Testing Guide

This directory contains performance tests for Leaf AI's WebLLM inference engine.

## Test Types

### 1. Simple Performance Tests (Recommended)
**File**: `e2e/simple-performance.spec.ts`

Fast, pragmatic tests that assume you already have a model downloaded.

**Commands**:
```bash
# Run performance tests (headless)
npm run test:perf

# Run with visible browser to watch the test
npm run test:perf:headed
```

**Setup Required**:
1. Start the dev server: `npm run dev`
2. Visit http://localhost:5173
3. Download a small model (e.g., Llama 3.2 1B ~1.1GB)
4. Wait for download to complete
5. Run the performance tests

**What It Measures**:
- **First Token Latency (TTFT)**: Time from sending prompt to first response
  - Runs 3 measurements per session
  - Calculates average, median, min, max
  - Asserts TTFT < 15 seconds
- **Throughput**: Tokens generated per second
  - Longer prompt to measure sustained generation
  - Extracts tok/s from UI stats
  - Asserts generation completes < 2 minutes

**Expected Performance** (Desktop, Llama 3.2 1B):
- TTFT: 2-5 seconds
- Throughput: 5-15 tok/s

### 2. Full Performance Tests (Experimental)
**File**: `e2e/performance.spec.ts`

Comprehensive tests that attempt to download models automatically.

**Commands**:
```bash
# Run full test suite (may take 30+ minutes on first run)
npm run test:perf:full
```

**Note**: This test downloads models automatically, which takes significant time:
- First run: 5-10 minutes per model download
- Subsequent runs: Much faster (models cached in IndexedDB)

## Running Tests

### Prerequisites
- Node.js and npm installed
- Playwright browsers installed: `npx playwright install chromium`
- Dev server running on http://localhost:5173

### Quick Start
```bash
# 1. Start dev server in one terminal
npm run dev

# 2. In another terminal, download a model manually
# Visit http://localhost:5173 and download Llama 3.2 1B

# 3. Run performance tests
npm run test:perf
```

### Viewing Results

**Console Output**:
Tests print results to console:
```
=== Performance Summary ===
Average TTFT: 3245ms
Median TTFT:  3180ms
Min TTFT:     2890ms
Max TTFT:     3750ms

Throughput: 8.42 tok/s
```

**HTML Report**:
```bash
# View detailed test report
npx playwright show-report
```

**Screenshots**:
Failed tests automatically capture screenshots in `test-results/`

## Configuration

### Timeouts
- Overall test timeout: 5 minutes (300000ms)
- TTFT wait: 30 seconds
- Generation completion: 2 minutes

Adjust in test file if needed:
```typescript
test.setTimeout(300000) // 5 minutes
```

### Browser Settings
Configure in `playwright.config.ts`:
- Browser: Chromium (required for WebGPU)
- Headless: Yes (use `--headed` flag to show browser)
- Workers: 1 (sequential execution)

## Platform-Specific Notes

### Desktop
- Runs tests against Desktop models (1-3GB)
- Expected TTFT: 2-5 seconds
- Expected throughput: 5-15 tok/s

### iOS (Unsupported)
- E2E tests do not support iOS Safari
- Use manual testing on iOS devices
- iOS models: <400MB, optimized for mobile

## Troubleshooting

### "WebGPU not available"
- Ensure you're using Chrome/Chromium (not Firefox/Safari)
- Update browser to latest version

### "SharedArrayBuffer not available"
- COOP/COEP headers not set
- Restart dev server: `npm run dev`
- Check headers are present in browser DevTools

### "No model downloaded"
- Visit http://localhost:5173
- Download a model from the UI
- Wait for download to complete
- Run tests again

### Tests timeout during generation
- Increase timeout in test file
- Try a smaller model (Llama 3.2 1B instead of 3B)
- Check system resources (CPU/RAM/GPU)

### Model downloads are slow
- Normal on first run (models are 1-3GB)
- Subsequent runs use cached models
- Use `simple-performance.spec.ts` which skips downloads

## Adding New Tests

### Example: Custom Prompt Test
```typescript
test('custom prompt performance', async ({ page }) => {
  await page.goto('/')

  const input = page.locator('textarea').first()
  await input.fill('Your custom prompt here')

  const startTime = Date.now()
  await page.locator('button[type="submit"]').click()

  await page.waitForSelector('[data-message-role="assistant"]')
  const ttft = Date.now() - startTime

  console.log(`TTFT: ${ttft}ms`)
  expect(ttft).toBeLessThan(10000) // 10 seconds
})
```

## CI/CD Integration

Tests can run in CI with these steps:

```yaml
# .github/workflows/performance.yml
- name: Install dependencies
  run: npm ci

- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Build application
  run: npm run build

- name: Start server & run tests
  run: |
    npm run preview &
    npm run test:perf
```

**Note**: CI tests require pre-downloaded models or skip the download tests.

## Performance Baselines

Track these metrics over time to detect regressions:

| Model | TTFT (target) | Throughput (target) |
|-------|---------------|---------------------|
| Llama 3.2 1B | < 5s | > 5 tok/s |
| Llama 3.2 3B | < 8s | > 3 tok/s |
| Gemma 2 2B | < 6s | > 4 tok/s |
| SmolLM2 135M (iOS) | < 8s | > 1.5 tok/s |

## Further Reading

- [Playwright Documentation](https://playwright.dev/)
- [WebLLM Documentation](https://github.com/mlc-ai/web-llm)
- [WebGPU Specification](https://gpuweb.github.io/gpuweb/)
