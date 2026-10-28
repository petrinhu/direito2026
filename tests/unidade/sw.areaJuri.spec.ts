import { describe, expect, it } from 'vitest';
import { opcoesWorkbox } from '../../vite.config';

/**
 * Service worker e a API da Júri. A regra de /api/ (NetworkOnly, primeira da
 * lista) já cobre todo /api/, inclusive /api/juri/. Este spec congela isso para
 * os dois endpoints sensíveis da Júri: a sessão e a imagem cifrada nunca podem
 * sair do cache do navegador. Helper `casa` copiado do sw.areaRestrita.spec.ts
 * (segunda ocorrência; a terceira é que pede extração).
 */
type Rota = {
  urlPattern: RegExp | ((ctx: { url: URL; request: Request }) => boolean);
  handler: string;
};

function casa(rota: Rota, caminho: string): boolean {
  const url = new URL(`https://exemplo.test${caminho}`);
  const ctx = { url, request: { mode: 'cors' } as Request };
  return rota.urlPattern instanceof RegExp ? rota.urlPattern.test(url.href) : rota.urlPattern(ctx);
}

describe('service worker e a API da Júri', () => {
  const rotas = opcoesWorkbox.runtimeCaching as unknown as Rota[];

  it('/api/juri/conteudo.php e /api/juri/imagem.php casam a primeira regra, NetworkOnly', () => {
    for (const caminho of ['/api/juri/conteudo.php', '/api/juri/imagem.php']) {
      const indice = rotas.findIndex((r) => casa(r, caminho));
      expect(indice, caminho).toBe(0);
      expect(rotas[indice]!.handler, caminho).toBe('NetworkOnly');
    }
  });

  it('a regra da Júri não captura as páginas da cadeira nem os pedaços de conteúdo', () => {
    expect(casa(rotas[0]!, '/p/p1/juri-simulado')).toBe(false);
    expect(casa(rotas[0]!, '/assets/conteudo-juri-abc.js')).toBe(false);
  });

  it('a navegação para /api/juri/ não cai no fallback do index.html', () => {
    const negados = opcoesWorkbox.navigateFallbackDenylist ?? [];
    expect(negados.some((r) => r.test('/api/juri/conteudo.php'))).toBe(true);
  });
});
