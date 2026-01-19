# WebGPU Compatibility Guide

## Current Status

Leaf AI uses **WebGPU** for local AI model execution, which provides hardware-accelerated machine learning directly in your browser.

## Supported Platforms

### ✅ Fully Supported

| Platform | Browser | Requirements | Model Support |
|----------|---------|--------------|---------------|
| **Windows** | Chrome 113+ | GPU with DirectX 12 support | Desktop tier (2-7GB models) |
| **Windows** | Edge 113+ | GPU with DirectX 12 support | Desktop tier (2-7GB models) |
| **macOS** | Chrome 113+ | Metal-compatible GPU | Desktop tier (2-7GB models) |
| **macOS** | Edge 113+ | Metal-compatible GPU | Desktop tier (2-7GB models) |
| **Linux** | Chrome 113+ | Vulkan-compatible GPU | Desktop tier (2-7GB models) |
| **Linux** | Edge 113+ | Vulkan-compatible GPU | Desktop tier (2-7GB models) |
| **Android** | Chrome 113+ | GPU with Vulkan support | Smart tier selection based on RAM |
| **iOS 26+/iPadOS 26+** | Safari 26+ | Apple A-series or M-series chip | iOS tier (< 400MB models) |

### 🎯 Android Smart Model Selection

Leaf AI automatically detects Android device capabilities and recommends compatible models:

| Device Type | RAM | Models Available | Recommended Model |
|-------------|-----|------------------|-------------------|
| **Low-end** | < 4GB | iOS tier (< 400MB) | SmolLM2 135M (~360MB) |
| **Mid-range** | 4-6GB | iOS + Android tier (< 2GB) | Qwen 2.5 1.5B (~1GB) |
| **High-end** | 8GB+ | All tiers (< 7GB) | Llama 3.2 3B (~2.3GB) |

**Detection Method**: Uses `navigator.deviceMemory` (Chrome 63+) for accurate RAM detection, with fallback heuristics based on screen resolution.

### ⚠️ Limited Support

| Platform | Status | Details |
|----------|--------|---------|
| **iOS < 26** | Not Supported | WebGPU requires iOS 26+ / Safari 26+ <br>• Update to iOS 26+ for full support <br>• Or use desktop browser |
| **Safari (Desktop) < 26** | Partial | Requires Safari 26+ for full WebGPU support |

## iOS 26+ Support 🎉

**iOS 26+ now has full WebGPU support!** Leaf AI works natively on iPhone and iPad with iOS 26+.

### iOS Requirements
- **iOS/iPadOS 26+** (WebGPU introduced in Safari 26)
- **iPhone/iPad** with Apple A-series or M-series chip
- **Safari 26+** browser

### iOS Model Optimization

iOS has strict memory constraints (~1.5GB WebContent limit), so Leaf AI automatically:
- **Detects iOS devices** and shows only compatible models
- **Filters models** to iOS tier (< 400MB)
- **Validates buffer size** before loading to prevent crashes
- **Recommends SmolLM2 135M** (~360MB, 2-bit) as the best iOS model

**Available iOS Models**:
- SmolLM2 135M (~360MB) - Recommended, ultra-compact
- SmolLM2 360M (~376MB) - Small and efficient
- Qwen3 0.6B (~500MB) - Latest Qwen3 for iOS
- TinyLlama 1.1B (~697MB) - Better quality
- Qwen 2.5 0.5B (~945MB) - Quality iOS model

### iOS < 26 Workaround

If you're on iOS < 26:
- **Update to iOS 26+** (recommended) - Full local AI support
- **Use desktop browser** - Chrome/Edge on desktop/laptop
- **Wait for device update** - Check for iOS updates in Settings

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

### Desktop/Laptop

**Minimum:**
- Any GPU with Vulkan 1.1, DirectX 12, or Metal support
- 4GB RAM
- Modern CPU (Intel Core i5 or equivalent)

**Recommended:**
- Dedicated GPU (NVIDIA, AMD, or Apple Silicon)
- 8GB+ RAM
- Recent CPU (Intel Core i7, AMD Ryzen 5, or Apple M1/M2)

### Android

**Low-end (< 4GB RAM):**
- GPU with Vulkan support
- Shows iOS tier models (< 400MB)
- Basic AI functionality

**Mid-range (4-6GB RAM):**
- GPU with Vulkan support
- Shows Android tier models (< 2GB)
- Recommended: Qwen 2.5 1.5B (~1GB)
- **Most Android users fall in this category**

**High-end (8GB+ RAM):**
- GPU with Vulkan support
- Shows desktop tier models (< 7GB)
- Same experience as desktop

### iOS/iPadOS

**Requirements:**
- iOS 26+ / iPadOS 26+
- Apple A-series or M-series chip
- Safari 26+
- Shows iOS tier models (< 400MB only)
- ~1.5GB WebContent limit enforced by Safari

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
- **iOS < 26**: WebGPU not available - update to iOS 26+ or use desktop
- **Model too large**: Leaf AI only shows iOS-compatible models (< 400MB)
- **Browser crash**: Ensure using Safari 26+, not third-party iOS browsers
- **WebGPU error**: Check if iOS 26+ is installed

### Android-specific issues
- **Model too large error**: Your device RAM is limited - select Android tier or iOS tier models
- **Slow performance**: Try a smaller model from Android tier
- **Browser crash during load**: RAM too low for selected model - choose iOS tier models
- **Models not showing**: Ensure Chrome 113+ is installed

## Implementation Status

**Completed:**
- ✅ WebGPU support for Desktop (Chrome/Edge 113+)
- ✅ iOS 26+ WebGPU support with optimized models
- ✅ Android three-tier model system with RAM detection
- ✅ Smart device capability detection
- ✅ Platform-specific model filtering and validation
- ✅ 4-bit and 2-bit model quantization

**In Progress:**
- ⏳ Cloud AI mode with API key support
- ⏳ WebAssembly fallback for unsupported devices
- ⏳ Further model optimization for mobile devices

## Questions?

Check our documentation or open an issue on GitHub.
