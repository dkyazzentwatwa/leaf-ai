// WebGPU type declarations
interface GPU {
  requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>
}

interface GPURequestAdapterOptions {
  powerPreference?: 'low-power' | 'high-performance'
}

interface GPUAdapter {
  requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>
}

interface GPUDeviceDescriptor {
  requiredFeatures?: GPUFeatureName[]
}

type GPUFeatureName = string

interface GPUDevice {
  // Minimal type for our needs
}

interface Navigator {
  gpu?: GPU
}
