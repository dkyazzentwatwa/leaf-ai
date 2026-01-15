import { beforeAll } from 'vitest'

beforeAll(() => {
  if (typeof window !== 'undefined') {
    if (typeof SharedArrayBuffer === 'undefined') {
      console.warn('SharedArrayBuffer not available - tests may fail')
      console.warn('Ensure COOP/COEP headers are set')
    }

    const nav = navigator as Navigator & { gpu?: GPU }
    if (!nav.gpu) {
      console.warn('WebGPU not available - benchmark tests will be skipped')
    }
  }
})
