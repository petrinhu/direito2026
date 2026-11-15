import { describe, expect, it } from 'vitest';
import { rotas } from '@/app/router/rotas';

/**
 * HIST-F3 (ordem do líder de 14/11): as páginas Novidades (/novidades) e Changelog (/changelog) entram na
 * tabela de rotas antes do coringa de página não encontrada, que precisa continuar por último.
 */
describe('rotas do histórico', () => {
  const indice = (caminho: string) => rotas.findIndex((r) => r.path === caminho);

  it('/novidades e /changelog existem, com nome e componente de página', () => {
    for (const [caminho, nome] of [
      ['/novidades', 'novidades'],
      ['/changelog', 'changelog']
    ] as const) {
      const rota = rotas.find((r) => r.path === caminho);
      expect(rota, caminho).toBeDefined();
      expect(rota?.name, caminho).toBe(nome);
      expect(typeof rota?.component, caminho).toBe('function');
    }
  });

  it('as duas rotas vêm antes do coringa', () => {
    const coringa = indice('/:pathMatch(.*)*');
    expect(coringa).toBeGreaterThan(-1);
    expect(indice('/novidades')).toBeLessThan(coringa);
    expect(indice('/changelog')).toBeLessThan(coringa);
  });
  it('/novidades carrega a página Novidades, e /changelog a página Changelog', async () => {
    const porCaminho = (caminho: string) => rotas.find((x) => x.path === caminho)!;
    const novidades = (
      await (
        porCaminho('/novidades').component as () => Promise<{ default: { __name?: string } }>
      )()
    ).default;
    const changelog = (
      await (
        porCaminho('/changelog').component as () => Promise<{ default: { __name?: string } }>
      )()
    ).default;
    expect(novidades.__name).toBe('Novidades');
    expect(changelog.__name).toBe('Changelog');
  });
});
