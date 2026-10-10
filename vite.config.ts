import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Exportado para o teste tests/unidade/sw.areaRestrita.spec.ts conferir a
 * regra da API da área restrita sem rodar o build.
 */
export const opcoesWorkbox = {
  // Nunca mapa de código no service worker gerado: mesma razão do
  // build.sourcemap abaixo, e o Workbox tem opção própria, separada
  // da do Vite (achado real, 22/09/2026: sw.js.map e workbox-*.js.map
  // vazavam caminho absoluto da máquina mesmo com sourcemap:false no
  // Vite, porque o Workbox gera o dele por conta própria).
  sourcemap: false,
  globPatterns: ['**/*.{js,css,html,woff2,svg,png,json}'],
  navigateFallback: '/index.html',
  // A API PHP da área restrita nunca vira index.html: uma navegação direta
  // a /api/... vai à rede (e o servidor responde 404/405 em JSON).
  navigateFallbackDenylist: [/^\/api\//],
  runtimeCaching: [
    // PRIMEIRA, de propósito: o Workbox usa a primeira regra que casa. Conteúdo
    // restrito e sessão nunca passam por cache do service worker.
    {
      urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/api/'),
      handler: 'NetworkOnly' as const
    },
    {
      urlPattern: /\/assets\/conteudo-.*\.js$/,
      handler: 'CacheFirst' as const,
      options: { cacheName: 'conteudo-unidades' }
    },
    {
      urlPattern: ({ request }: { request: Request }) => request.mode === 'navigate',
      handler: 'NetworkFirst' as const,
      options: { cacheName: 'navegacao' }
    }
  ]
};

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
      workbox: opcoesWorkbox
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    // Alvo explícito, o mesmo do CSS (css.lightningcss.targets abaixo). Com
    // 'esnext' o JS saía sem rebaixar e o Edge 109 (último para Windows 7/8.1)
    // recebia sintaxe que não entende (achado do líder, 10/10/2026).
    target: ['chrome109', 'edge109', 'firefox115', 'safari15'],
    // Nunca mapa de código no pacote de produção (achado do líder,
    // 22/09/2026): o mapa carrega o caminho absoluto de disco de quem
    // construiu, e publicar isso expõe a estrutura de pastas pessoal.
    // Diagnóstico local usa CADERNO_SOURCEMAP=true npm run build.
    sourcemap: process.env.CADERNO_SOURCEMAP === 'true'
  },
  css: {
    transformer: 'lightningcss',
    // Versões em formato lightningcss (major << 16). Mesmos alvos do build.target.
    lightningcss: {
      targets: {
        chrome: 109 << 16,
        edge: 109 << 16,
        firefox: 115 << 16,
        safari: 15 << 16
      }
    }
  }
});
