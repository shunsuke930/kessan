import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: '男磨きアプリ',
        short_name: '男磨き',
        description: '自分磨きタスクをこなすとキャラと部屋が育つWebモック',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // JS/CSS/HTMLはプリキャッシュしない。開発が活発な間はデプロイのたびに
        // ハッシュが変わるため、丸ごとプリキャッシュすると古いservice workerが
        // 古いapp shellを配り続け「直したのに反映されない」原因になる。
        // 画像だけは変更頻度が低く重いので、静的にプリキャッシュしてオフライン
        // 表示に使う。
        globPatterns: ['**/*.{png,svg,webp,ico}'],
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // ナビゲーション(index.html)・JS・CSSは毎回まずネットワークを試し、
            // オフラインの時だけ直近のキャッシュにフォールバックする
            urlPattern: ({ request }) =>
              request.destination === 'document' ||
              request.destination === 'script' ||
              request.destination === 'style',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-shell',
              networkTimeoutSeconds: 3,
            },
          },
        ],
      },
    }),
  ],
})
