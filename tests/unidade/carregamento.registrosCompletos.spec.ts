import { describe, expect, it } from 'vitest';
import { curriculo } from '@/conteudo/curriculo';
import { CARREGADORES } from '@/app/carregamento/carregadores';
import { CARREGADORES_DISPOSITIVOS } from '@/app/carregamento/carregadoresDispositivos';

/**
 * Os dois registros são escritos à mão (import() de caminho literal, que o
 * empacotador enxerga). Esquecer uma unidade num deles deixa o conteúdo ou
 * os dispositivos dela fora do pacote sem erro nenhum; este teste torna o
 * esquecimento vermelho.
 */
const publicadas = curriculo.flatMap((p) =>
  p.cadeiras.flatMap((c) =>
    c.unidades.filter((u) => u.estado === 'publicado').map((u) => `${p.id}/${c.id}/${u.id}`)
  )
);

describe('registros de carregamento cobrem o currículo', () => {
  it('há unidades publicadas para conferir', () => {
    expect(publicadas.length).toBeGreaterThanOrEqual(3);
  });

  it.each(publicadas)('%s tem carregador de conteúdo e de dispositivos', (chave) => {
    expect(CARREGADORES[chave], 'conteúdo').toBeTypeOf('function');
    expect(CARREGADORES_DISPOSITIVOS[chave], 'dispositivos').toBeTypeOf('function');
  });

  it('nenhum registro tem chave que o currículo não publica', () => {
    expect(Object.keys(CARREGADORES).sort()).toEqual([...publicadas].sort());
    expect(Object.keys(CARREGADORES_DISPOSITIVOS).sort()).toEqual([...publicadas].sort());
  });
});

describe('carregador de Filosofia Jurídica', () => {
  it('entrega meta, resumo e o quiz de 80 perguntas', async () => {
    const conteudo = await CARREGADORES['p1/filosofia-juridica/u1']!();
    expect(conteudo.resumo.length).toBeGreaterThan(0);
    expect(conteudo.quiz).toHaveLength(80);
    expect(conteudo.peticao).toBeUndefined();
  });
});
