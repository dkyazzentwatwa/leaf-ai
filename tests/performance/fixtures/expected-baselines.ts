import type { ModelId } from '@/features/ai/services/webllm/engine'

export interface PerformanceBaseline {
  tokensPerSecond: { min: number; target: number }
  firstTokenLatency: { max: number; target: number }
  modelLoadTime: { max: number }
}

export const BASELINES: Record<ModelId, PerformanceBaseline> = {
  // iOS Models
  'SmolLM2-135M-Instruct-q0f16-MLC': {
    tokensPerSecond: { min: 1.5, target: 2.5 },
    firstTokenLatency: { max: 8000, target: 5000 },
    modelLoadTime: { max: 60000 },
  },
  'SmolLM2-360M-Instruct-q4f16_1-MLC': {
    tokensPerSecond: { min: 1.5, target: 2.5 },
    firstTokenLatency: { max: 8000, target: 5000 },
    modelLoadTime: { max: 90000 },
  },
  'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC': {
    tokensPerSecond: { min: 1.0, target: 1.5 },
    firstTokenLatency: { max: 10000, target: 7000 },
    modelLoadTime: { max: 120000 },
  },
  'Qwen2.5-0.5B-Instruct-q4f16_1-MLC': {
    tokensPerSecond: { min: 1.0, target: 1.5 },
    firstTokenLatency: { max: 10000, target: 7000 },
    modelLoadTime: { max: 150000 },
  },

  // Desktop Models
  'Llama-3.2-3B-Instruct-q4f16_1-MLC': {
    tokensPerSecond: { min: 3.0, target: 5.0 },
    firstTokenLatency: { max: 5000, target: 3000 },
    modelLoadTime: { max: 180000 },
  },
  'gemma-2-2b-it-q4f16_1-MLC': {
    tokensPerSecond: { min: 3.0, target: 5.0 },
    firstTokenLatency: { max: 5000, target: 3000 },
    modelLoadTime: { max: 150000 },
  },
  'Llama-3.2-1B-Instruct-q4f32_1-MLC': {
    tokensPerSecond: { min: 4.0, target: 6.0 },
    firstTokenLatency: { max: 4000, target: 2500 },
    modelLoadTime: { max: 120000 },
  },
  'Phi-3.5-mini-instruct-q4f16_1-MLC': {
    tokensPerSecond: { min: 3.5, target: 5.0 },
    firstTokenLatency: { max: 5000, target: 3000 },
    modelLoadTime: { max: 150000 },
  },
  'Qwen2.5-1.5B-Instruct-q4f16_1-MLC': {
    tokensPerSecond: { min: 4.0, target: 6.0 },
    firstTokenLatency: { max: 4000, target: 2500 },
    modelLoadTime: { max: 120000 },
  },
}

export const REGRESSION_TOLERANCE = 0.20 // 20% degradation allowed
