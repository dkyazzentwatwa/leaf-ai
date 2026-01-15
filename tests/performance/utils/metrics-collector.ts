import type { ModelId } from '@/features/ai/services/webllm/engine'

export interface InferenceMetrics {
  modelId: ModelId
  prompt: string
  tokensPerSecond: number
  firstTokenLatency: number
  totalGenerationTime: number
  outputTokens: number
  promptTokens: number
  memoryUsedMB?: number
}

export class MetricsCollector {
  private results: InferenceMetrics[] = []

  async measureInference(params: {
    modelId: ModelId
    prompt: string
    expectedOutputTokens?: number
  }): Promise<InferenceMetrics> {
    const { modelId, prompt, expectedOutputTokens = 100 } = params
    const { unifiedEngine } = await import('@/features/ai/services/unifiedEngine')

    let firstTokenTime: number | null = null
    let outputTokens = 0
    const startTime = performance.now()

    await unifiedEngine.generate(
      [{ role: 'user', content: prompt }],
      {
        maxTokens: expectedOutputTokens,
        temperature: 0.7,
        onToken: (token) => {
          if (firstTokenTime === null) {
            firstTokenTime = performance.now()
          }
          outputTokens++
        }
      }
    )

    const endTime = performance.now()
    const totalTime = endTime - startTime
    const firstTokenLatency = firstTokenTime ? (firstTokenTime - startTime) : totalTime
    const tokensPerSecond = (outputTokens / (totalTime / 1000))

    const metrics: InferenceMetrics = {
      modelId,
      prompt,
      tokensPerSecond,
      firstTokenLatency,
      totalGenerationTime: totalTime,
      outputTokens,
      promptTokens: Math.ceil(prompt.split(/\s+/).length * 1.3),
    }

    this.results.push(metrics)
    return metrics
  }

  getResults(): InferenceMetrics[] {
    return this.results
  }

  clear(): void {
    this.results = []
  }
}

export async function measureFirstTokenLatency(
  engine: any,
  prompt: string
): Promise<number> {
  let firstTokenTime: number | null = null
  const startTime = performance.now()

  await engine.generate(
    [{ role: 'user', content: prompt }],
    {
      maxTokens: 10,
      onToken: () => {
        if (firstTokenTime === null) {
          firstTokenTime = performance.now()
        }
      }
    }
  )

  return firstTokenTime ? (firstTokenTime - startTime) : 0
}
