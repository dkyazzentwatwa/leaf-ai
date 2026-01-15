import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { unifiedEngine } from '@/features/ai/services/unifiedEngine'
import { AVAILABLE_MODELS, type ModelId } from '@/features/ai/services/webllm/engine'
import { TEST_PROMPTS } from '../fixtures/test-prompts'
import { MetricsCollector } from '../utils/metrics-collector'
import { PerformanceReporter } from '../utils/performance-reporter'
import { detectPlatform } from '../utils/platform-detector'

describe('Model Comparison Benchmarks', () => {
  const collector = new MetricsCollector()
  const reporter = new PerformanceReporter()
  const platform = detectPlatform()

  const testModels = Object.keys(AVAILABLE_MODELS).filter((modelId) => {
    const model = AVAILABLE_MODELS[modelId as ModelId]
    return platform === 'ios' ? model.iosOnly : !model.iosOnly
  }) as ModelId[]

  afterAll(() => {
    const report = reporter.generateComparisonReport(collector.getResults())
    console.log('\n' + report)
  })

  for (const modelId of testModels) {
    describe(`${modelId}`, () => {
      beforeAll(async () => {
        await unifiedEngine.loadModel(modelId)
      }, 300000)

      it('short prompt (50 tokens)', async () => {
        const result = await collector.measureInference({
          modelId,
          prompt: TEST_PROMPTS.short,
          expectedOutputTokens: 50,
        })

        expect(result.tokensPerSecond).toBeGreaterThan(0)
        expect(result.firstTokenLatency).toBeLessThan(10000)
      }, 60000)

      it('medium prompt (200 tokens)', async () => {
        const result = await collector.measureInference({
          modelId,
          prompt: TEST_PROMPTS.medium,
          expectedOutputTokens: 200,
        })

        expect(result.tokensPerSecond).toBeGreaterThan(0)
      }, 120000)
    })
  }
})
