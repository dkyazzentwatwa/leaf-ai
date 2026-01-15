import type { InferenceMetrics } from './metrics-collector'

export class PerformanceReporter {
  generateComparisonReport(results: InferenceMetrics[]): string {
    const byModel = results.reduce((acc, result) => {
      if (!acc[result.modelId]) {
        acc[result.modelId] = []
      }
      acc[result.modelId].push(result)
      return acc
    }, {} as Record<string, InferenceMetrics[]>)

    let report = '\n=== Model Performance Comparison ===\n\n'
    report += '| Model | Avg Tok/s | Avg TTFT (ms) | Avg Total Time (ms) |\n'
    report += '|-------|-----------|---------------|---------------------|\n'

    for (const [modelId, metrics] of Object.entries(byModel)) {
      const avgTokPerSec = metrics.reduce((sum, m) => sum + m.tokensPerSecond, 0) / metrics.length
      const avgTTFT = metrics.reduce((sum, m) => sum + m.firstTokenLatency, 0) / metrics.length
      const avgTotalTime = metrics.reduce((sum, m) => sum + m.totalGenerationTime, 0) / metrics.length

      report += `| ${modelId} | ${avgTokPerSec.toFixed(2)} | ${avgTTFT.toFixed(0)} | ${avgTotalTime.toFixed(0)} |\n`
    }

    return report + '\n'
  }
}
