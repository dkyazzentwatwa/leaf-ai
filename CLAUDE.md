# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Leaf AI** is a privacy-first, browser-based AI assistant that runs entirely locally using WebGPU. Built by Cypher, it democratizes access to AI without compromising privacy—no servers, no tracking, no cloud dependencies.

**Key Principle**: Everything stays on the user's device. The AI models download once, cache locally, and run in the browser using WebLLM (WebGPU acceleration).

**Repository**: https://github.com/dkyazzentwatwa/leaf-ai

## Commands

```bash
# Development
npm run dev          # Start dev server at localhost:5173

# Build & Preview
npm run build        # TypeScript compile + Vite build
npm run preview      # Preview production build locally

# Quality
npm run lint         # ESLint check
npm run test         # Run Vitest tests
```

## Architecture Overview

### AI Engine Architecture (Critical)

The AI system is designed with **platform-specific model loading** and runs entirely client-side:

```
User Request
    ↓
ChatInterface (React component)
    ↓
useWebLLM (React hook)
    ↓
unifiedEngine (singleton wrapper)
    ↓
workerEngine (Web Worker manager)
    ↓
ai.worker.ts (runs in separate thread)
    ↓
WebLLM (@mlc-ai/web-llm)
    ↓
WebGPU (hardware acceleration)
```

**Key Components**:

1. **`unifiedEngine`** (`src/features/ai/services/unifiedEngine.ts`)
   - Singleton wrapper around WebLLM
   - Entry point for all AI operations
   - Handles engine detection and fallback

2. **`workerEngine`** (`src/features/ai/services/webllm/workerEngine.ts`)
   - Manages Web Worker communication
   - **Device capability detection** (iOS vs Desktop/Android)
   - **Model validation** before loading (checks buffer size limits)
   - iOS-specific: Blocks models >400MB for iOS, allows ultra-small models only

3. **`engine.ts`** (`src/features/ai/services/webllm/engine.ts`)
   - **AVAILABLE_MODELS** - Central model registry
   - Models tagged with `iosOnly: true/false` for platform filtering
   - iOS models: <400MB, 4-bit or 2-bit quantized (q4f16, q0f16)
   - Desktop models: 1-7GB, 4-bit quantized

4. **`aiStore`** (`src/features/ai/stores/aiStore.ts`)
   - Zustand store with persistence
   - Manages conversations, model state, settings, personas
   - Conversations stored with messages, bookmarks, reactions
   - Tracks custom user-created personas

5. **`prompts.ts`** (`src/features/ai/services/webllm/prompts.ts`)
   - Defines all AI personas (built-in and custom)
   - Contains system prompts for each persona type
   - `getSystemPrompt()` function dynamically generates prompts based on persona and language

### iOS 26+ WebGPU Support (Critical)

iOS 26+ Safari has **strict memory constraints** that required reverse engineering WebLLM:

- **1.5GB WebContent Limit**: iOS limits browser processes regardless of device RAM
- **GPU Buffer Limits**: iPhone 17 Pro ~1-1.2GB max GPU buffer
- **Solution**: Platform detection + model validation before download
- **iOS Models**: SmolLM2 135M (~130MB), Gemma 3 1B (~150MB), TinyLlama 1.1B (~350MB)
- **Desktop Models**: Llama 3.2 3B (~2GB), Gemma 3 12B (~7GB), Phi 3.5 Mini (~1.5GB)

**Detection Flow**:
```typescript
// workerEngine.ts
detectDeviceCapabilities() → iOS detection
  ↓
checkWebGPUSupport() → Allow iOS 26+, block iOS <26
  ↓
validateModelForDevice() → Check model.iosOnly matches platform
  ↓
loadModel() → Only proceed if validated
```

### State Management

**Global State (Zustand)**:
- `aiStore`: AI conversations, model status, settings (persisted to localStorage)
- `toastStore`: Toast notifications (not persisted)

**Local Storage (IndexedDB via Dexie)**:
- `aiConversations`: Backup storage for conversations
- `modelCache`: Track downloaded model metadata

**Architecture Note**: Zustand handles primary state with localStorage persistence. IndexedDB is secondary storage for conversation history and model tracking.

### PWA & Offline-First

- Service Worker managed by `vite-plugin-pwa` (Workbox)
- All routes cached for offline use
- AI models cache via WebLLM's internal IndexedDB
- Manifest in `vite.config.ts` - PWA installable on mobile

### Critical Headers (WebGPU + SharedArrayBuffer)

**Required for AI to work**:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

**Content Security Policy (CSP)** - Required for WebLLM model downloads:
```
connect-src 'self' https://huggingface.co https://raw.githubusercontent.com blob:
```

These are set in:
- `vite.config.ts` (dev + preview servers)
- `public/_headers` (production - Netlify format)

Without these headers, WebLLM's Web Workers and SharedArrayBuffer will fail. Without CSP allowing `raw.githubusercontent.com`, WASM files cannot be fetched and models will fail to load.

## Code Patterns & Conventions

### Feature Module Structure

Each feature in `src/features/` follows this pattern:
```
features/ai/
├── components/     # UI components (ChatInterface, ModelDownloader)
├── hooks/          # React hooks (useWebLLM)
├── services/       # Business logic (unifiedEngine, workerEngine)
├── stores/         # Zustand stores (aiStore)
└── workers/        # Web Workers (ai.worker.ts)
```

### Import Alias

Uses `@/` alias for imports:
```typescript
import { cn } from '@/utils/cn'  // Resolves to src/utils/cn.ts
```

### Styling

- **Tailwind CSS** with custom config
- **Mobile-first responsive**: Use `sm:`, `md:`, `lg:` breakpoints
- **Dark mode**: All components support dark mode
- **Mobile optimization**: Recent updates ensure full mobile responsiveness

### i18n (Internationalization)

- English (primary) + Spanish
- Translations in `src/assets/locales/`
- Use `useTranslation()` hook:
```typescript
const { i18n } = useTranslation()
const lang = (i18n.language === 'es' ? 'es' : 'en') as 'en' | 'es'
```

## Critical Implementation Details

### Adding New AI Models

1. **Add to `engine.ts` AVAILABLE_MODELS**:
```typescript
'model-name-q4f16_1-MLC': {
  name: 'Display Name',
  description: 'Description',
  size: '~XGB',
  recommended: true/false,
  minRAM: X,
  iosOnly: true/false,  // CRITICAL: Set correctly
  maxBufferSizeMB: XXXX,
  performance: 'X-Y tok/sec',
  quantization: 'q4f16_1',
}
```

2. **Model must exist on Hugging Face** in MLC format:
   - From `mlc-ai` organization preferred
   - Format: `model-name-quantization-MLC` (e.g., `gemma-3-1b-it-q0f16-MLC`)

3. **iOS models MUST be**:
   - <400MB total size
   - 4-bit (q4f16) or 2-bit (q0f16) quantized
   - `iosOnly: true`

### Model Validation Logic

The system automatically filters models by platform:
- `ModelDownloader.tsx`: Filters `AVAILABLE_MODELS` by `iosOnly` flag
- `workerEngine.ts`: Validates model buffer size before loading
- Prevents iOS users from attempting to load desktop models (would crash)

### Adding New Built-in AI Personas

To add a new built-in persona to the app:

1. **Update `AssistantType` in `prompts.ts`**:
```typescript
export type AssistantType =
  | 'general'
  | 'writer'
  | 'coder'
  | 'teacher'
  | 'analyst'
  | 'creative'
  | 'your-new-persona'  // Add here
```

2. **Add persona definition to `BUILT_IN_PERSONAS`**:
```typescript
'your-new-persona': {
  id: 'your-new-persona',
  name: { en: 'English Name', es: 'Nombre Español' },
  description: {
    en: 'Brief English description',
    es: 'Breve descripción en español'
  },
  systemPrompt: {
    en: `Detailed system prompt in English...`,
    es: `Prompt detallado del sistema en español...`
  },
  isBuiltIn: true,
  icon: '🎭',  // Emoji icon
}
```

3. **Add conversation starters to `CONVERSATION_STARTERS`**:
```typescript
'your-new-persona': {
  en: ['Starter 1', 'Starter 2', 'Starter 3', 'Starter 4'],
  es: ['Inicio 1', 'Inicio 2', 'Inicio 3', 'Inicio 4']
}
```

4. **System prompt best practices**:
   - Define AI's role and expertise clearly
   - Include capabilities and limitations
   - Specify response style/format if relevant
   - Mention local-only processing
   - Keep language-appropriate (formal for professional, casual for creative, etc.)
   - Length: 200-500 words for focused personas

### Web Worker Communication

AI processing runs in a separate thread to avoid blocking UI:
```typescript
// Main thread
workerEngine.send({ type: 'load', modelId })

// Worker thread (ai.worker.ts)
onmessage = (event) => {
  if (event.data.type === 'load') {
    // Load model using WebLLM
  }
}
```

### AI Persona System

The app supports customizable AI personas with different system prompts:

**Built-in Personas** (6 total):
- `general` - Friendly Leaf AI assistant (default)
- `writer` - Professional writer and editor
- `coder` - Expert software engineer
- `teacher` - Patient educational guide
- `analyst` - Data analyst and researcher
- `creative` - Creative brainstorming partner

**Architecture**:
```typescript
// prompts.ts - Define personas
export interface Persona {
  id: string
  name: { en: string; es: string }
  description: { en: string; es: string }
  systemPrompt: { en: string; es: string }
  isBuiltIn: boolean
  icon?: string
}

export const BUILT_IN_PERSONAS: Record<AssistantType, Persona>

// getSystemPrompt() selects prompt based on:
// 1. Custom persona (if provided)
// 2. Built-in persona type
// 3. User's language (en/es)
// 4. Optional context string
```

**Per-Conversation Persona Tracking**:
- Each conversation stores its `personaId` in the `Conversation` interface
- Conversations remember which persona they started with
- Users can switch personas mid-conversation (affects new messages only)
- Active persona stored in `aiStore.activePersonaId` for new conversations

**Custom Personas**:
- Users can create unlimited custom personas via Settings > PersonaManager
- Custom personas stored in `aiStore.customPersonas` array
- Persisted to localStorage
- Must provide: name (EN), system prompt (EN)
- Optional: name (ES), description (EN/ES), system prompt (ES), emoji icon

**UI Components**:
- `PersonaSelector` - Dropdown in ChatInterface header for quick switching
- `PersonaManager` - Full editor in Settings for creating/editing custom personas

## Browser Compatibility

**Desktop/Android**:
- Chrome 113+
- Edge 113+
- Brave (latest)

**iOS/iPadOS**:
- Safari 26+ / iOS 26+ (WebGPU support)
- Older iOS versions: WebGPU not available

## Common Gotchas

1. **Never use `require()` in browser code** - Use ES6 imports only
2. **Model sizes must be accurate** - iOS crashes if models exceed buffer limits
3. **COOP/COEP headers required** - Without them, SharedArrayBuffer unavailable
4. **CSP must allow raw.githubusercontent.com** - Required for WASM file downloads
5. **Quantization is mandatory** - Full-precision models (f32/f16) won't work
6. **Mobile responsive** - All new UI must support mobile (sm: breakpoints)
7. **JSX entities** - Use `&lt;` not `<` in JSX text to avoid parsing errors
8. **Persona system** - Built-in personas use their `id` as `assistantType`, custom personas pass through `customPersona` prop
9. **Conversation starters** - Must be defined for ALL persona types in `CONVERSATION_STARTERS`

## Testing on iOS

To test iOS changes:
1. Deploy to staging (Netlify/Vercel with proper headers)
2. Test on iPhone 17 Pro (iOS 26+) - target device
3. Check browser console for device detection logs
4. Verify only iOS models are shown in ModelDownloader
5. Test model download doesn't crash (watch for "webpage problem" errors)

## Privacy Philosophy

Every feature must respect:
- ✅ No data sent to external servers
- ✅ No tracking or analytics
- ✅ No user accounts
- ✅ All processing happens locally
- ✅ Open source and auditable

This is non-negotiable. If a feature requires external communication, it doesn't belong in this project.
