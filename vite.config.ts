import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * O FullCalendar 6.1.22 injeta, ao ser importado, uma regra @font-face da
 * fonte de ícones "fcicons" com a fonte embutida em data:. Sob a CSP de
 * produção (font-src 'self', public/.htaccess), o navegador tenta essa fonte no
 * carregamento mesmo sem nenhum elemento que a use, e a tentativa vira erro no
 * console (medido: sonda Chromium, 20/10/2026; buttonIcons:false não bastava,
 * porque a regra é injetada pelo próprio core). O caminho oficial é liberar
 * data: em font-src, proibido aqui (L-02). Os botões usam texto (buttonIcons:
 * false), então a fonte não tem uso: a regra sai do código do pacote no build.
 */
const REGRA_FONTE_ICONES_FULLCALENDAR = /@font-face\{font-family:fcicons[^}]*\}/g;

/** Só o módulo interno do core guarda o CSS injetado. */
export function ehModuloDoCore(id: string): boolean {
  return /[\\/]@fullcalendar[\\/]core[\\/]internal-common\.js$/.test(id);
}

/**
 * Fail-closed: exige exatamente uma regra. Se o pacote mudar esse trecho, o
 * build quebra em vez de publicar a fonte em silêncio.
 */
export function removerFonteIconesFullCalendar(codigo: string): string {
  const ocorrencias = codigo.match(REGRA_FONTE_ICONES_FULLCALENDAR)?.length ?? 0;
  if (ocorrencias !== 1) {
    throw new Error(
      `removerFonteIconesFullCalendar: esperava 1 regra fcicons, achei ${ocorrencias}. ` +
        'O FullCalendar mudou o CSS injetado: revisar antes de publicar.'
    );
  }
  return codigo.replace(REGRA_FONTE_ICONES_FULLCALENDAR, '');
}

function removerFonteIconesDoCalendario(): Plugin {
  return {
    name: 'caderno-remover-fonte-icones-fullcalendar',
    transform(codigo, id) {
      if (!ehModuloDoCore(id)) return null;
      return { code: removerFonteIconesFullCalendar(codigo), map: null };
    }
  };
}

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
    removerFonteIconesDoCalendario(),
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
