export const APP_CONFIG = {
  name: 'Leaf AI',
  version: '1.0.0',
  description: 'Your private AI assistant, running entirely in your browser',
  tagline: 'Secure. Private. Local. Accessible.',

  // Feature flags
  features: {
    ai: {
      enabled: true,
      defaultModel: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
      fallbackModel: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
    },
    offline: {
      enabled: true,
      maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
    analytics: {
      enabled: false, // Privacy-first: no analytics
    },
  },

  // Supported languages
  languages: {
    en: { name: 'English', nativeName: 'English', rtl: false },
    es: { name: 'Spanish', nativeName: 'Español', rtl: false },
  },

  // External links
  links: {
    github: 'https://github.com/dkyazzentwatwa/leaf-ai',
    donate: null,
    contact: null,
  },
} as const
