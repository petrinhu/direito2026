// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import TrilhaNavegacao from '@/ui/componentes/TrilhaNavegacao.vue';
import type { Curriculo } from '@/core/curriculo/tipos';

/** Trilha de um tópico: Período > Cadeira > AV3 > Livro > título do tópico > aba. */
const curriculo: Curriculo = [
  {
    id: 'p1',
    numero: 1,
    rotulo: '1º período',
    cadeiras: [
      {
        id: 'cadeira',
        nome: 'Cadeira',
        estado: 'publicado',
        grupos: [{ unidade: 'u3', id: 'livro', rotulo: 'Livro' }],
        unidades: [
          {
            id: 'u3-livro-topico',
            rotulo: 'AV3',
            titulo: 'Título do tópico',
            estado: 'publicado',
            abas: ['resumo', 'quiz']
          }
        ]
      }
    ]
  }
];

function textosDaTrilha(wrapper: ReturnType<typeof mount>): string[] {
  return wrapper.findAll('li').map((li) => li.text().replace(/\s+/g, ' ').trim());
}

describe('TrilhaNavegacao: tópico de grupo', () => {
  it('mostra Período, Cadeira, AV3, Livro, título do tópico e a aba: seis itens', () => {
    const wrapper = mount(TrilhaNavegacao, {
      props: { curriculo, caminhoAtual: 'p/p1/cadeira/u3-livro-topico/resumo' }
    });
    expect(textosDaTrilha(wrapper)).toEqual([
      '1º período',
      'Cadeira',
      'AV3',
      'Livro',
      'Título do tópico',
      'Resumo'
    ]);
  });

  it('AV3 e Livro levam à página da cadeira; o título e a aba levam à unidade do tópico', () => {
    const wrapper = mount(TrilhaNavegacao, {
      props: { curriculo, caminhoAtual: 'p/p1/cadeira/u3-livro-topico' }
    });
    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href'));
    expect(hrefs).toEqual([
      '/p/p1',
      '/p/p1/cadeira',
      '/p/p1/cadeira',
      '/p/p1/cadeira',
      '/p/p1/cadeira/u3-livro-topico',
      '/p/p1/cadeira/u3-livro-topico'
    ]);
  });
});
