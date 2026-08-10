import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

const rootPath = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(({ mode }) => {
  const isCapacitorBuild = mode === 'capacitor'

  return {
    plugins: [
      react(),
      tailwindcss(),
      !isCapacitorBuild && VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: '奇門遁甲(專業排盤)',
        short_name: '奇門排盤',
        description: '最完整的年月日時家及陰盤奇門遁甲系統',
        id: '/qimen-app/',
        start_url: '/qimen-app/',
        scope: '/qimen-app/',
        lang: 'zh-Hant',
        theme_color: '#eef1f5',
        background_color: '#eef1f5',
        display: 'standalone',
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
            purpose: 'any maskable'
          }
        ]
      }
      })
    ].filter(Boolean),
    // GitHub Pages 需要專案子路徑；Capacitor WebView 則從內嵌根目錄載入。
    base: isCapacitorBuild ? './' : '/qimen-app/',
    build: {
      rollupOptions: {
        input: {
          main: `${rootPath}index.html`,
          userApp: `${rootPath}user-app.html`,
        },
      },
    },
  }
})
