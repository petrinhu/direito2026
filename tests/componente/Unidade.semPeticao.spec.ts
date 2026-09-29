// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import Unidade from '@/ui/paginas/Unidade.vue';
import { CHAVE_CURRICULO, CHAVE_REPOSITORIO } from '@/app/chaves';
import { RepositorioMemoria } from '@/app/persistencia/RepositorioMemoria';
import type { Curriculo } from '@/core/curriculo/tipos';

/**
 * Cadeira sem petição (Sociologia Jurídica): a página só oferece as abas
 * que a unidade tem, e o endereço direto de uma aba que ela não tem não
 * pode abrir uma página em branco (rota morta).
 */
const curriculoSemPeticao: Curriculo = [
  {
    id: 'p1',
    numero: 1,
    rotulo: '1º período',
    cadeiras: [
      {
        id: 'sociologia-juridica',
        nome: 'Sociologia Jurídica',
        estado: 'publicado',
        unidades: [
          {
            id: 'u1',
            rotulo: 'Unidade 1',
            titulo: 'Resumo de estudo e quiz',
            estado: 'publicado',
            abas: ['resumo', 'quiz']
          }
        ]
      }
    ]
  }
];

function montar(aba: 'resumo' | 'peticao' | 'quiz') {
  return mount(Unidade, {
    props: { periodo: 'p1', cadeira: 'sociologia-juridica', unidade: 'u1', aba },
    global: {
      provide: {
        [CHAVE_CURRICULO as unknown as symbol]: curriculoSemPeticao,
        [CHAVE_REPOSITORIO as unknown as symbol]: new RepositorioMemoria()
      }
    }
  });
}

describe('Unidade sem petição', () => {
  it('oferece só as abas Resumo e Quiz', () => {
    const wrapper = montar('resumo');
    const abas = wrapper.findAll('[role="tab"]').map((a) => a.text());
    expect(abas).toEqual(['Resumo', 'Quiz']);
    expect(wrapper.text()).not.toContain('Petição');
  });

  it('o endereço direto da aba de petição mostra "não encontrada", não uma página em branco', () => {
    const wrapper = montar('peticao');
    expect(wrapper.text()).toContain('Página não encontrada');
    expect(wrapper.findAll('[role="tabpanel"]')).toHaveLength(0);
  });
});
