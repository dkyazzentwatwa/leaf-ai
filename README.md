# 🍃 Leaf AI

**Your private AI assistant, running entirely in your browser**

Leaf AI is a privacy-first, browser-based AI assistant that runs 100% locally using WebGPU. No servers, no tracking, no cloud dependencies - just you and AI, privately.

Built with ❤️ by [the AI Flow Club](https://flow-club.techtiff.ai/)

## ✨ Features

- 🔒 **Complete Privacy**: All AI processing happens on your device. No data ever leaves your browser.
- ⚡ **WebGPU Acceleration**: Hardware-accelerated inference using WebGPU for fast responses
- 📱 **Smart Mobile Support**: Optimized for iOS 26+ and Android devices with intelligent model selection based on device capabilities
- 🤖 **Android Optimized**: Three-tier model system automatically detects Android device RAM and recommends compatible models
- 💾 **Offline-First**: Works completely offline after initial model download
- 🌍 **Multi-language**: English and Spanish support
- 💬 **Conversation Management**: Organize chats with folders, tags, and search
- 📤 **Export**: Export conversations as Markdown or JSON
- 🎨 **Dark Mode**: Beautiful dark theme support

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/dkyazzentwatwa/leaf-ai.git
cd leaf-ai

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173/`

### Available Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run tests with Vitest
```

## 🌐 Browser Compatibility

### Desktop
- ✅ Chrome 113+ (recommended)
- ✅ Edge 113+
- ✅ Brave (latest)
- ✅ Any WebGPU-compatible browser

### Android
- ✅ Chrome 113+ (recommended)
- ✅ Edge 113+
- 🎯 **Smart Model Selection**: Automatically detects device RAM and shows compatible models
  - **Low-end** (< 4GB RAM): Ultra-small models (< 400MB)
  - **Mid-range** (4-6GB RAM): Mobile-optimized models (400MB-2GB) ← **Most Android users**
  - **High-end** (8GB+ RAM): Desktop-class models (1-7GB)

### iOS/iPadOS
- ✅ Safari 26+ / iOS 26+ (WebGPU support)
- ⚠️ iOS <26: WebGPU not available

**Platform Detection**: Leaf AI automatically detects your device's platform and RAM, showing only models that will work smoothly on your hardware. No more crashes from models that are too large!

## 🧠 Available AI Models

Leaf AI uses a **three-tier model system** that automatically adapts to your device:

### 🖥️ Desktop Tier (2-7GB)
*For high-end Android (8GB+ RAM) and Desktop*
- **Llama 3.2 3B** (~2.3GB) - ⭐ **Recommended**, best quality (3-7 tok/sec)
- **Qwen3 4B** (~3.4GB) - Latest Qwen, excellent quality (3-5 tok/sec)
- **Llama 3.1 8B** (~4.5GB) - Highest quality, best for powerful desktops (2-4 tok/sec)
- **Mistral 7B v0.3** (~4GB) - Excellent general-purpose model (2-4 tok/sec)

### 📱 Android Tier (400MB-2GB)
*For mid-range Android (4-6GB RAM)*
- **Qwen 2.5 1.5B** (~1GB) - ⭐ **Recommended for Android**, best quality/size ratio (5-7 tok/sec)
- **Llama 3.2 1B** (~1.1GB) - Compact Meta Llama (5-8 tok/sec)
- **Phi 3.5 Mini** (~1.5GB) - Microsoft's efficient model (4-6 tok/sec)
- **Gemma 2 2B** (~1.9GB) - Google's efficient model (3-6 tok/sec)

### 🍎 iOS Tier (<400MB)
*For iOS 26+ and low-end Android (< 4GB RAM)*
- **SmolLM2 135M** (~360MB, 2-bit) - ⭐ **Recommended for iOS**, ultra-compact (2-3 tok/sec)
- **SmolLM2 360M** (~376MB, 4-bit) - Small and efficient (2-3 tok/sec)
- **Qwen3 0.6B** (~500MB, 4-bit) - Latest Qwen3 for iOS (2-3 tok/sec)
- **TinyLlama 1.1B** (~697MB, 4-bit) - Better quality (1-2 tok/sec)
- **Qwen 2.5 0.5B** (~945MB, 4-bit) - Quality iOS model (1-2 tok/sec)

**Smart Filtering**: The app automatically shows only models compatible with your device's RAM. Android mid-range users (4-6GB) see 9 models total (iOS + Android tiers), preventing crashes from oversized models.

All models use 4-bit or 2-bit quantization for optimal performance and memory efficiency.

## 🛠 Technology Stack

- **Framework**: Vite + React 19 + TypeScript
- **AI Engine**: [WebLLM](https://github.com/mlc-ai/web-llm) (@mlc-ai/web-llm)
- **Acceleration**: WebGPU
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand with localStorage persistence
- **Database**: IndexedDB (Dexie) for conversation history
- **i18n**: i18next + react-i18next (English, Spanish)
- **PWA**: vite-plugin-pwa (Workbox)
- **Router**: React Router v7

## 🏗 Architecture

### AI Engine Flow

```
User Request
    ↓
ChatInterface (React)
    ↓
useWebLLM (React hook)
    ↓
unifiedEngine (singleton wrapper)
    ↓
workerEngine (Web Worker manager)
    ↓
ai.worker.ts (separate thread)
    ↓
WebLLM (@mlc-ai/web-llm)
    ↓
WebGPU (hardware acceleration)
```

### Key Components

- **`unifiedEngine`**: Main entry point for all AI operations
- **`workerEngine`**: Manages Web Worker communication, device detection, and RAM-based model validation
- **`engine.ts`**: Central model registry with three-tier platform filtering (iOS/Android/Desktop)
- **`aiStore`**: Zustand store for conversations and model state

### Device Detection & Validation

Leaf AI automatically detects:
- **Platform**: iOS, Android, or Desktop
- **RAM**: Uses `navigator.deviceMemory` (Chrome/Edge) or screen-based heuristics
- **Device Tier**: Classifies as low-end (< 4GB), mid-range (4-6GB), or high-end (8GB+)
- **GPU Limits**: Queries WebGPU adapter for buffer size constraints

**Safety Rule**: Models are validated before loading. Android devices can only load models up to 40% of their available RAM, preventing browser crashes.

See [CLAUDE.md](CLAUDE.md) for detailed architecture documentation.

## 🔐 Privacy Philosophy

Leaf AI is built on these non-negotiable principles:

- ✅ No data sent to external servers
- ✅ No tracking or analytics
- ✅ No user accounts
- ✅ All processing happens locally
- ✅ Open source and auditable

If a feature requires external communication, it doesn't belong in this project.

## 📁 Project Structure

```
src/
├── features/ai/           # AI feature module
│   ├── components/        # Chat UI, model downloader
│   ├── hooks/             # useWebLLM hook
│   ├── services/          # AI engine, WebLLM integration
│   ├── stores/            # Zustand state management
│   └── workers/           # Web Workers for AI
│
├── components/            # Shared UI components
│   ├── layout/            # Header, footer, layout
│   └── ui/                # shadcn/ui components
│
├── core/                  # Core infrastructure
│   ├── config/            # App configuration
│   ├── db/                # IndexedDB schema
│   └── router/            # React Router setup
│
├── pages/                 # Route pages
├── utils/                 # Utility functions
└── assets/                # Locales, static assets
```

## 🚢 Deployment

### Required Headers

For WebLLM to work, these headers are **required**:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

These are configured in:
- `vite.config.ts` (dev/preview)
- `public/_headers` (production - Netlify format)

Without these headers, SharedArrayBuffer and Web Workers will fail.

### Netlify Deployment

1. Push to GitHub
2. Connect to Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Headers are auto-configured via `public/_headers`

## 🤝 Contributing

Contributions are welcome! Whether it's bug fixes, new features, or documentation improvements.

### Development Guidelines

- Follow the existing code style
- Use TypeScript for all new code
- Mobile-first responsive design (use `sm:`, `md:`, `lg:` breakpoints)
- Add Spanish translations for user-facing text
- Respect the privacy-first philosophy

## 📄 License

MIT License - See [LICENSE](LICENSE) for details

## 🔗 Links

- **GitHub**: [https://github.com/dkyazzentwatwa/leaf-ai](https://github.com/dkyazzentwatwa/leaf-ai)
- **Made by**: [the AI Flow Club](https://flow-club.techtiff.ai/)

---

**Built with ❤️ for a more private world**

Made by [the AI Flow Club](https://flow-club.techtiff.ai/)
