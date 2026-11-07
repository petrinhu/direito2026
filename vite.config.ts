import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';

/**
 * Versão do site (campo "version" do package.json) entra no código como
 * constante de build, declarada em src/versao-site.d.ts. Lida aqui no Node,
 * para o pacote do navegador não carregar o package.json inteiro. Vitest
 * (vitest.config.ts) importa esta mesma constante, para o teste ver a mesma
 * versão do build.
 */
const pacote = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8')
) as { version: string };

export const definicoesDeVersao = {
  __VERSAO_SITE__: JSON.stringify(pacote.version)
};

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
 * Prefixo dos pedaços de conteúdo. Nenhuma regra de cache o usa mais (o service
 * worker saiu, plano 2.1); fica até o portão verificar-cache-conteudo sair (F4.5).
 */
export const PREFIXO_PEDACO_CONTEUDO = 'conteudo-';

const ORIGEM_DO_CONTEUDO = /[\\/]src[\\/]conteudo[\\/]/;

export interface PedacoDoBuild {
  readonly name: string;
  readonly facadeModuleId?: string | null;
  readonly moduleIds?: readonly string[];
}

/**
 * Pedaço é de conteúdo só se TODO módulo dele vem de src/conteudo. Pedaço misto
 * (conteúdo com código do app) não vira CacheFirst: fica com o nome de sempre.
 */
export function ehPedacoDeConteudo(pedaco: PedacoDoBuild): boolean {
  const modulos = pedaco.moduleIds?.length ? pedaco.moduleIds : [pedaco.facadeModuleId ?? ''];
  return modulos.every((origem) => ORIGEM_DO_CONTEUDO.test(origem));
}

/**
 * Nome dos arquivos de pedaço do build (chunkFileNames). Mantém "assets/" e
 * "[hash]": sem "assets/" a regex /\/assets\/conteudo-/ não casa, e sem o hash o
 * verificar-cache-fingerprint reprova (o .htaccess deixa *.js imutável por um ano).
 */
export function nomeDoPedaco(pedaco: PedacoDoBuild): string {
  const prefixo = ehPedacoDeConteudo(pedaco) ? PREFIXO_PEDACO_CONTEUDO : '';
  return `assets/${prefixo}[name]-[hash].js`;
}

export default defineConfig({
  base: '/',
  define: definicoesDeVersao,
  plugins: [vue(), removerFonteIconesDoCalendario()],
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
    sourcemap: process.env.CADERNO_SOURCEMAP === 'true',
    rollupOptions: {
      output: {
        // Pedaço de conteúdo sai como conteudo-<nome>-<hash>.js, o padrão da
        // regra de cache do service worker (ver nomeDoPedaco acima).
        chunkFileNames: nomeDoPedaco
      }
    }
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
