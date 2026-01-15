import { describe, it, beforeAll, afterAll } from 'vitest'
import { unifiedEngine } from '@/features/ai/services/unifiedEngine'
import { AVAILABLE_MODELS, type ModelId } from '@/features/ai/services/webllm/engine'
import { TEST_PROMPTS } from '../fixtures/test-prompts'
import { measureFirstTokenLatency } from '../utils/metrics-collector'
import { detectPlatform } from '../utils/platform-detector'

describe('First Token Latency (TTFT)', () => {
  const platform = detectPlatform()
  const results: Record<string, number[]> = {}

  const testModels = Object.keys(AVAILABLE_MODELS).filter((modelId) => {
    const model = AVAILABLE_MODELS[modelId as ModelId]
    return platform === 'ios' ? model.iosOnly : !model.iosOnly
  }) as ModelId[]

  afterAll(() => {
    for (const [modelId, latencies] of Object.entries(results)) {
      const avg = latencies.reduce((a, b) => a + b) / latencies.length
      const median = latencies.sort()[Math.floor(latencies.length / 2)]

      console.log(`\n${modelId}:`)
      console.log(`  Average TTFT: ${avg.toFixed(0)}ms`)
      console.log(`  Median TTFT:  ${median.toFixed(0)}ms`)
    }
  })

  for (const modelId of testModels) {
    describe(`${modelId}`, () => {
      beforeAll(async () => {
        await unifiedEngine.loadModel(modelId)
        results[modelId] = []
      }, 300000)

      for (let i = 0; i < 5; i++) {
        it(`TTFT measurement ${i + 1}/5`, async () => {
          const ttft = await measureFirstTokenLatency(
            unifiedEngine,
            TEST_PROMPTS.short
          )
          results[modelId].push(ttft)
        }, 30000)
      }
    })
  }
})
