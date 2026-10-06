import { describe, expect, it } from 'vitest';
import { opcoesWorkbox } from '../../vite.config';

type Rota = {
  urlPattern: RegExp | ((ctx: { url: URL; request: Request }) => boolean);
  handler: string;
};

function casa(rota: Rota, caminho: string): boolean {
  const url = new URL(`https://exemplo.test${caminho}`);
  const ctx = { url, request: { mode: 'cors' } as Request };
  return rota.urlPattern instanceof RegExp ? rota.urlPattern.test(url.href) : rota.urlPattern(ctx);
}

describe('service worker e a API da área restrita', () => {
  const rotas = opcoesWorkbox.runtimeCaching as unknown as Rota[];

  it('navegação para /api/ não cai no fallback do index.html', () => {
    const negados = opcoesWorkbox.navigateFallbackDenylist ?? [];
    expect(negados.some((r) => r.test('/api/sessao.php'))).toBe(true);
    expect(negados.some((r) => r.test('/p/p1/interdisciplinar'))).toBe(false);
  });

  it('/api/ é NetworkOnly e vem ANTES de qualquer outra regra (a primeira que casa vence)', () => {
    const indice = rotas.findIndex((r) => casa(r, '/api/conteudo.php'));
    expect(indice).toBe(0);
    expect(rotas[indice]!.handler).toBe('NetworkOnly');
    expect(casa(rotas[0]!, '/api/usuarios.php')).toBe(true);
  });

  it('a regra de /api/ não captura as rotas e os chunks do site', () => {
    expect(casa(rotas[0]!, '/p/p1/interdisciplinar')).toBe(false);
    expect(casa(rotas[0]!, '/assets/conteudo-abc.js')).toBe(false);
    expect(casa(rotas[0]!, '/apimaster')).toBe(false);
  });

  it('nenhum php entra no precache', () => {
    const globs = (opcoesWorkbox.globPatterns ?? []).join(' ');
    expect(globs).not.toMatch(/php/i);
  });
});
