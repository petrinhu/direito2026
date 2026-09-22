import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

// Onda 2 liga o service worker de verdade (seção 9 da arquitetura). Nesta
// onda o plugin já entra configurado para não reabrir a decisão depois,
// mas registerType 'prompt' evita troca de conteúdo sob o leitor.
export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      manifest: false, // manifest.webmanifest é escrito à mão em public/, não gerado
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,svg,png,json}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /\/assets\/conteudo-.*\.js$/,
            handler: 'CacheFirst',
            options: { cacheName: 'conteudo-unidades' }
          },
          {
            urlPattern: ({ request }: { request: Request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: { cacheName: 'navegacao' }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    target: 'esnext',
    sourcemap: true
  },
  css: {
    transformer: 'lightningcss'
  }
});
