import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

// Onda 2 ligou o service worker de verdade (seção 9 da arquitetura). Onda
// seguinte (23/09/2026, pedido do líder) trocou 'prompt' por 'autoUpdate':
// o service worker novo assume sozinho (skipWaiting + clientsClaim, que o
// plugin liga automaticamente para este registerType) em vez de esperar
// todas as abas fecharem - era essa espera que deixava leitor preso na
// versão antiga. Ver docs/arquitetura.md, seção 9, para o raciocínio
// completo e a ordem do líder verbatim.
export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      manifest: false, // manifest.webmanifest é escrito à mão em public/, não gerado
      workbox: {
        // Nunca mapa de código no service worker gerado: mesma razão do
        // build.sourcemap abaixo, e o Workbox tem opção própria, separada
        // da do Vite (achado real, 22/09/2026: sw.js.map e workbox-*.js.map
        // vazavam caminho absoluto da máquina mesmo com sourcemap:false no
        // Vite, porque o Workbox gera o dele por conta própria).
        sourcemap: false,
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
    // Nunca mapa de código no pacote de produção (achado do líder,
    // 22/09/2026): o mapa carrega o caminho absoluto de disco de quem
    // construiu, e publicar isso expõe a estrutura de pastas pessoal.
    // Diagnóstico local usa CADERNO_SOURCEMAP=true npm run build.
    sourcemap: process.env.CADERNO_SOURCEMAP === 'true'
  },
  css: {
    transformer: 'lightningcss'
  }
});
