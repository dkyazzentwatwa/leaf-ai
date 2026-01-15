import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  server: {
    headers: {
      // Required for SharedArrayBuffer and WebGPU
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      // Content Security Policy for XSS protection
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://huggingface.co blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self';",
    },
  },
  preview: {
    headers: {
      // Required for SharedArrayBuffer and WebGPU
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      // Content Security Policy for XSS protection
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://huggingface.co blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self';",
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'leaf.svg',
        'apple-touch-icon.png',
        'pwa-64x64.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'maskable-icon-512x512.png',
        'shortcuts/settings.png',
        '_headers',
      ],
      manifest: {
        name: 'Leaf AI - Private AI Assistant',
        short_name: 'Leaf AI',
        description: 'Your private AI assistant, running entirely in your browser. Secure, private, and accessible to all.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        categories: ['productivity', 'utilities'],
        lang: 'en-US',
        dir: 'ltr',
        shortcuts: [
          {
            name: 'Settings',
            url: '/settings',
            icons: [{ src: '/shortcuts/settings.png', sizes: '96x96', type: 'image/png' }]
          }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        // Allow larger files (AI libraries are big)
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['class-variance-authority', 'clsx', 'tailwind-merge', 'lucide-react'],
          'db-vendor': ['dexie', 'dexie-react-hooks'],
          'i18n-vendor': ['i18next', 'react-i18next'],
          'state-vendor': ['zustand'],
          // AI library in separate chunk (loaded on demand)
          'ai-webllm': ['@mlc-ai/web-llm'],
        }
      }
    },
    chunkSizeWarningLimit: 3000 // AI libraries are large
  },
  optimizeDeps: {
    exclude: ['@mlc-ai/web-llm']
  }
})
