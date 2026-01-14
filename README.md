# Rights Shield

Privacy-first activist resource platform for immigration rights, digital security, and community defense.

## 🌟 Features

- **Immigration Rights**: Know Your Rights guidance for ICE encounters
- **Digital Security**: Privacy and security checklists for activists
- **Activism Tools**: Organizing and protest resources
- **AI Assistant**: Local AI-powered rights guidance (coming in Phase 4)
- **AI Defense**: Protection from surveillance tech (coming in Phase 6)

## 🔒 Privacy-First Design

- ✅ No user accounts or tracking
- ✅ No analytics or data collection
- ✅ Works 100% offline after initial load
- ✅ AI runs locally in your browser (no cloud)
- ✅ All data stays on your device
- ✅ Open source (AGPLv3)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Browser Compatibility

For the best experience with AI features:
- **Recommended**: Chrome 113+, Edge 113+, or Brave (latest)
- **Supported**: Any WebGPU-compatible browser
- **iOS/Mobile**: Local AI not yet available (cloud AI mode coming soon)

See [WEBGPU_COMPATIBILITY.md](WEBGPU_COMPATIBILITY.md) for full compatibility details.

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development

The app will be available at `http://localhost:5173/`

## 📁 Project Structure

```
src/
├── core/               # Core infrastructure
│   ├── config/         # App configuration, i18n
│   ├── db/             # IndexedDB schema (Dexie)
│   ├── pwa/            # Service worker logic
│   └── router/         # React Router configuration
│
├── features/           # Feature modules
│   ├── immigration/    # Immigration rights content
│   ├── security/       # Digital security checklists
│   ├── activism/       # Activism tools
│   ├── ai/             # AI assistant
│   ├── ai-defense/     # AI surveillance defense
│   └── common/         # Shared feature components
│
├── components/         # Shared UI components
│   ├── ui/             # shadcn/ui components
│   ├── layout/         # Header, footer, navigation
│   └── primitives/     # Reusable UI elements
│
├── pages/              # Route pages
├── hooks/              # Global React hooks
├── stores/             # Zustand state stores
├── utils/              # Utility functions
└── assets/             # Static assets & translations
```

## 🛠 Technology Stack

- **Framework**: Vite + React 19 + TypeScript
- **Routing**: React Router v7
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand + React Query
- **Database**: Dexie (IndexedDB)
- **i18n**: i18next + react-i18next
- **PWA**: vite-plugin-pwa (Workbox)
- **AI** (Phase 4): WebLLM + Transformers.js

## 📖 Implementation Roadmap

### ✅ Phase 1: Foundation (COMPLETED)
- [x] Vite + React + TypeScript setup
- [x] PWA configuration
- [x] Tailwind CSS + shadcn/ui
- [x] React Router with core routes
- [x] i18n (English/Spanish)
- [x] IndexedDB schema
- [x] App shell (header, nav, footer)
- [x] Offline detection
- [x] Basic pages for all routes

### 🔄 Phase 2: Digital Security Module (CURRENT)
- [ ] Write original security checklists
- [ ] Checklist viewer UI
- [ ] Progress tracking
- [ ] Print-friendly views
- [ ] Local keyword search

### 📋 Phase 3: Immigration Rights Module
- [ ] Know Your Rights scenarios
- [ ] Red card generator
- [ ] Emergency hotlines database
- [ ] Multi-language content
- [ ] Preparedness planner

### 🤖 Phase 4: AI Infrastructure
- [ ] WebLLM integration
- [ ] Model downloader UI
- [ ] Web Worker setup
- [ ] Basic chatbot interface
- [ ] Transformers.js semantic search

### 🎯 Phase 5-8: Additional Features & Polish
- See [Implementation Plan](/Users/cypher/.claude/plans/robust-questing-frost.md) for details

## 🌐 Languages

- English (primary)
- Spanish (es)
- More languages planned (French, Arabic, Chinese, Vietnamese)

## 🤝 Contributing

Rights Shield is open source and welcomes contributions!

- **Content**: Help write security checklists, immigration guides
- **Translations**: Add support for more languages
- **Code**: Fix bugs, add features, improve accessibility
- **Design**: UI/UX improvements

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines (coming soon).

## 📄 License

AGPLv3 - See [LICENSE](LICENSE) for details

Built with ❤️ by activists, for activists.

## ⚖️ Legal Disclaimer

This platform provides educational information about your rights, not legal advice.
For specific situations, always consult with a qualified attorney.

## 🔗 Links

- [GitHub Repository](#) (TBD)
- [Issue Tracker](#) (TBD)
- [Deployment](https://rights-shield.app) (TBD)

---

**Version**: 0.1.0 (Phase 1 Foundation)
**Status**: Active Development
**License**: AGPLv3
