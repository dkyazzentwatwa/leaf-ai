# WebGPU Compatibility Guide

## Current Status

Leaf AI uses **WebGPU** for local AI model execution, which provides hardware-accelerated machine learning directly in your browser.

## Supported Platforms

### ✅ Fully Supported

| Platform | Browser | Requirements |
|----------|---------|--------------|
| **Windows** | Chrome 113+ | GPU with DirectX 12 support |
| **Windows** | Edge 113+ | GPU with DirectX 12 support |
| **macOS** | Chrome 113+ | Metal-compatible GPU |
| **macOS** | Edge 113+ | Metal-compatible GPU |
| **Linux** | Chrome 113+ | Vulkan-compatible GPU |
| **Linux** | Edge 113+ | Vulkan-compatible GPU |
| **Android** | Chrome 113+ | GPU with Vulkan or OpenCL support |

### ⚠️ Limited Support

| Platform | Status | Details |
|----------|--------|---------|
| **iOS/iPadOS** | Coming Soon | WebGPU support is in development for Safari. Currently, iOS users should use: <br>• Desktop browser with Chrome/Edge <br>• Wait for iOS Safari WebGPU support <br>• Cloud AI mode (coming soon) |
| **Safari (Desktop)** | Partial | Requires Safari 17+ with experimental features enabled |

## iOS/iPadOS Workarounds

While iOS has powerful Apple A-series GPUs with Metal support, **WebGPU is not yet available in iOS Safari**. Here are your options:

### Option 1: Use Desktop Browser (Recommended)
- Use Chrome 113+ or Edge 113+ on a desktop/laptop computer
- All features work perfectly on desktop

### Option 2: Wait for iOS Safari WebGPU
- Apple is working on WebGPU support for iOS Safari
- Expected in future iOS versions
- Check [webkit.org](https://webkit.org/status/#specification-webgpu) for updates

### Option 3: Cloud AI Mode (Coming Soon)
We're adding cloud-based AI that works on all devices:
- Bring your own API key (OpenAI, Anthropic, etc.)
- Works on any device including iOS
- Your data stays private with your own credentials
- No WebGPU required

## Testing WebGPU Support

You can check if your browser supports WebGPU:

```javascript
if ('gpu' in navigator) {
  const adapter = await navigator.gpu.requestAdapter();
  if (adapter) {
    console.log('✅ WebGPU is supported!');
  }
}
```

Or visit: [webgpureport.org](https://webgpureport.org/)

## Why WebGPU?

WebGPU provides:
- **Privacy**: All AI processing happens locally on your device
- **Performance**: Hardware-accelerated computation using your GPU
- **No server costs**: No data sent to external servers
- **Offline capability**: Works without internet connection

## Alternative Browsers

If your current browser doesn't support WebGPU:

1. **Chrome** (Recommended): Download from [google.com/chrome](https://www.google.com/chrome/)
2. **Edge**: Download from [microsoft.com/edge](https://www.microsoft.com/edge)
3. **Brave**: Based on Chromium, supports WebGPU

## Hardware Requirements

### Minimum
- Any GPU with Vulkan 1.1, DirectX 12, or Metal support
- 4GB RAM
- Modern CPU (Intel Core i5 or equivalent)

### Recommended
- Dedicated GPU (NVIDIA, AMD, or Apple Silicon)
- 8GB+ RAM
- Recent CPU (Intel Core i7, AMD Ryzen 5, or Apple M1/M2)

## Troubleshooting

### "WebGPU not supported" error
1. Update your browser to the latest version
2. Check if your GPU drivers are up to date
3. Try a different browser (Chrome/Edge)
4. Verify your GPU is compatible

### Performance issues
1. Close other tabs/applications
2. Ensure your laptop is plugged in (not on battery saver mode)
3. Update GPU drivers
4. Try a smaller AI model

### iOS-specific issues
- Currently, iOS Safari doesn't support WebGPU
- Use desktop browser or wait for iOS Safari updates
- Cloud AI mode (coming soon) will work on iOS

## Future Plans

We're working on:
- ✅ WebGPU support (Done)
- ⏳ Cloud AI mode with API key support (In Progress)
- ⏳ WebAssembly fallback for unsupported devices
- ⏳ Model quantization for lower memory usage

## Questions?

Check our documentation or open an issue on GitHub.
