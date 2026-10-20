import { describe, expect, it } from 'vitest';
import { curriculo } from '@/conteudo/curriculo';
import { CARREGADORES } from '@/app/carregamento/carregadores';
import { CARREGADORES_DISPOSITIVOS } from '@/app/carregamento/carregadoresDispositivos';

/**
 * Os registros de carregamento saem das pastas de src/conteudo/ e não listam
 * nada à mão. Garantia: o registro de CONTEÚDO tem todas as unidades do
 * currículo, em qualquer estado (uma unidade em-breve também é carregável). O
 * registro de DISPOSITIVOS tem só as publicadas, porque o gerador
 * (scripts/gerar-dispositivos-por-unidade.ts) escreve dispositivos.ts só para
 * elas. Nos dois casos, sobra (pasta órfã) e falta (unidade publicada sem
 * carregador, que deixaria o conteúdo ou os dispositivos fora do pacote sem
 * erro) reprovam. Acrescentar unidade ou cadeira nova não quebra este teste.
 */
const todasAsUnidades = curriculo.flatMap((p) =>
  p.cadeiras.flatMap((c) => c.unidades.map((u) => `${p.id}/${c.id}/${u.id}`))
);
const publicadas = curriculo.flatMap((p) =>
  p.cadeiras.flatMap((c) =>
    c.unidades.filter((u) => u.estado === 'publicado').map((u) => `${p.id}/${c.id}/${u.id}`)
  )
);

describe('registros de carregamento cobrem o currículo', () => {
  it('há unidades para conferir (piso: zero é varredura quebrada)', () => {
    expect(todasAsUnidades.length).toBeGreaterThan(0);
    expect(publicadas.length).toBeGreaterThan(0);
  });

  it.each(publicadas)('%s publicada tem carregador de conteúdo e de dispositivos', (chave) => {
    expect(CARREGADORES[chave], 'conteúdo').toBeTypeOf('function');
    expect(CARREGADORES_DISPOSITIVOS[chave], 'dispositivos').toBeTypeOf('function');
  });

  it('o registro de conteúdo tem exatamente as unidades do currículo, em qualquer estado', () => {
    expect(Object.keys(CARREGADORES).sort()).toEqual([...todasAsUnidades].sort());
  });

  it('o registro de dispositivos tem exatamente as unidades publicadas', () => {
    expect(Object.keys(CARREGADORES_DISPOSITIVOS).sort()).toEqual([...publicadas].sort());
  });
});
