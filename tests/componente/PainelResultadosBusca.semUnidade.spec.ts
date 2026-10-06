// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PainelResultadosBusca from '@/ui/componentes/PainelResultadosBusca.vue';
import type { DocumentoBusca } from '@/core/busca/tipos';

const doc: DocumentoBusca = {
  id: 'p1/x',
  url: '/p/p1/x',
  periodo: 'p1',
  cadeira: 'x',
  unidade: '',
  aba: 'resumo',
  titulo: 'Titulo',
  corpo: 'Titulo',
  trecho: 'trecho'
};

describe('PainelResultadosBusca', () => {
  it('resultado sem unidade não deixa separador solto', () => {
    const w = mount(PainelResultadosBusca, { props: { resultados: [doc], termo: 't' } });
    const trilha = w.get('.painel-resultados-busca__trilha').text();
    expect(trilha).toBe('p1 · x');
  });
});
