# Leaf AI

**Context for Gemini Agents**

## Project Overview

**Leaf AI** is a privacy-first, browser-based AI assistant that runs entirely locally using WebGPU. It is designed to democratize access to AI without compromising privacy—no servers, no tracking, no cloud dependencies.

- **Core Principle:** Everything stays on the user's device. AI models are downloaded once, cached locally, and executed in the browser using WebLLM.
- **Key Technologies:** React 19, Vite, TypeScript, Tailwind CSS, WebGPU, WebLLM (@mlc-ai/web-llm), Zustand, Dexie (IndexedDB), i18next.
- **Platforms:** Desktop (Chrome/Edge/Brave) and iOS 26+ (Safari).
- **Repository:** https://github.com/dkyazzentwatwa/leaf-ai

## Build & Run

### Prerequisites
- Node.js 18+
- npm or yarn

### Commands
| Command | Description |
| :--- | :--- |
| `npm run dev` | Start the local Vite development server at `http://localhost:5173`. |
| `npm run build` | Type-check and build the project for production. |
| `npm run preview` | Serve the production build locally to test behavior. |
| `npm run lint` | Run ESLint with strict warnings. |
| `npm run test` | Run unit tests using Vitest. |
| `npm run test:e2e` | Run end-to-end tests using Playwright. |

## Architecture

The application is a client-side Single Page Application (SPA) with a strong focus on modularity and performance.

### AI Engine (Critical)
The AI processing pipeline is isolated in a Web Worker to prevent UI blocking.

```
User Request
    ↓
ChatInterface (React)
    ↓
useWebLLM (React hook)
    ↓
unifiedEngine (Singleton Service)
    ↓
workerEngine (Worker Manager & Device Detection)
    ↓
ai.worker.ts (Web Worker Thread)
    ↓
WebLLM (@mlc-ai/web-llm)
    ↓
WebGPU (Hardware Acceleration)
```

**Key Components:**
*   **`src/features/ai/services/unifiedEngine.ts`**: The main entry point for AI operations.
*   **`src/features/ai/services/webllm/workerEngine.ts`**: Manages the Web Worker, handles device capability detection (critical for iOS limits), and validates models.
*   **`src/features/ai/services/webllm/engine.ts`**: The central registry of `AVAILABLE_MODELS`. Includes platform-specific flags (e.g., `iosOnly`).
*   **`src/features/ai/stores/aiStore.ts`**: Global state management (Zustand) for conversations, model status, and settings. Persists to `localStorage`.

### Data Storage
*   **Zustand**: Primary state management for active session data and settings.
*   **IndexedDB (Dexie)**: Used for persistent storage of conversation history (`aiConversations`) and internal WebLLM model caching.

### PWA & Offline Support
*   Configured via `vite-plugin-pwa`.
*   Uses Service Workers (Workbox) to cache assets and AI models for offline capability.

### Security & Privacy
*   **Headers**: `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` are **mandatory** for SharedArrayBuffer support (required by WebLLM).
*   **CSP**: Must allow connections to `huggingface.co` and `raw.githubusercontent.com`.

## Development Conventions

### Structure
*   **`src/features/`**: Domain-specific modules (e.g., `ai`, `settings`). Contains components, hooks, services, stores, and workers.
*   **`src/components/`**: Shared, reusable UI components (e.g., layout, primitives).
*   **`src/core/`**: Core infrastructure (config, db, router).
*   **`src/utils/`**: General utility functions.

### Coding Style
*   **Language**: TypeScript for all new code.
*   **Formatting**: 2-space indentation, single quotes, no semicolons.
*   **Styling**: Tailwind CSS. Use `cn()` utility for class merging.
*   **Components**: Functional components with hooks.
*   **Imports**: Use `@/` alias for `src/`.

### Internationalization (i18n)
*   Support for English (`en`) and Spanish (`es`).
*   All user-facing text must be translatable using `useTranslation`.
*   Translation files located in `src/assets/locales/`.

### Testing
*   **Unit**: `*.test.ts` or `*.test.tsx` files.
*   **E2E**: Playwright tests in `tests/e2e/`.

### Mobile First
*   Designs must be responsive. Use Tailwind breakpoints (`sm:`, `md:`, `lg:`) to ensure compatibility with mobile devices, especially iOS.

## Critical Implementation Notes

1.  **iOS Constraints**: iOS has a strict ~1.5GB memory limit for WebContent. Models for iOS must be explicitly optimized (quantized < 1GB) and flagged as `iosOnly: true`.
2.  **Model Validation**: The `workerEngine` actively prevents loading desktop-class models on mobile devices to prevent crashes.
3.  **Persona System**: New personas require updates to `prompts.ts` (`AssistantType` type, `BUILT_IN_PERSONAS` object, and `CONVERSATION_STARTERS`).
