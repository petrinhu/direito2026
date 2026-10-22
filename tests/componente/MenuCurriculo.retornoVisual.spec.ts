// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import type { Curriculo } from '@/core/curriculo/tipos';

/**
 * Retorno visual dos itens clicáveis do menu lateral (ordem do líder,
 * 22/10/2026: "todo item clicável tem retorno visual"). Todo rótulo que
 * navega ou expande realça ao passar o ponteiro, e todo link tem cursor de
 * mão. jsdom não aplica CSS scoped (css:false), então a prova do realce é a
 * da regra no fonte; o resultado em pixels é conferido em navegador.
 */
const fonte = readFileSync(
  resolve(__dirname, '../../src/ui/componentes/MenuCurriculo.vue'),
  'utf-8'
);

function corpoDaRegra(seletor: RegExp): string {
  const achado = fonte.match(seletor);
  expect(achado, `regra não encontrada: ${seletor}`).not.toBeNull();
  return achado![1]!;
}

describe('MenuCurriculo, retorno visual ao passar o ponteiro', () => {
  it('botão de nível (período, cadeira, grupo, aba) realça ao passar o ponteiro', () => {
    expect(corpoDaRegra(/\n\.menu-curriculo__botao:hover[^{]*\{([^}]*)\}/)).toMatch(/background/);
  });

  it('botão de alternar (triângulo da unidade e da AV) realça ao passar o ponteiro', () => {
    expect(corpoDaRegra(/\n\.menu-curriculo__toggle:hover[^{]*\{([^}]*)\}/)).toMatch(/background/);
  });

  it('link (página) realça ao passar o ponteiro', () => {
    expect(corpoDaRegra(/\n\.menu-curriculo a:hover[^{]*\{([^}]*)\}/)).toMatch(/background/);
  });

  it('o modo de leitura adaptada também tem realce próprio (preto translúcido sobre branco)', () => {
    expect(fonte).toMatch(
      /:root\[data-modo-adaptado='on'\][^{]*\.menu-curriculo__botao:hover[^{]*\{[^}]*background/
    );
  });

  it('todo link do menu tem cursor de mão, não só os botões', () => {
    expect(corpoDaRegra(/\n\.menu-curriculo a \{([^}]*)\}/)).toMatch(/cursor:\s*pointer/);
  });

  it('o foco visível cobre botão, botão de alternar e link (teclado tem o mesmo retorno)', () => {
    expect(fonte).toMatch(/\.menu-curriculo__botao:focus-visible/);
    expect(fonte).toMatch(/\.menu-curriculo__toggle:focus-visible/);
    expect(fonte).toMatch(/\.menu-curriculo a:focus-visible/);
  });
});

describe('MenuCurriculo, todo rótulo clicável tem ação', () => {
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
              id: 'u1',
              rotulo: 'Unidade 1',
              titulo: 'Unidade 1',
              estado: 'publicado',
              abas: ['resumo', 'quiz']
            },
            {
              id: 'u3-livro-topico',
              rotulo: 'AV3',
              titulo: 'Título do tópico',
              estado: 'publicado',
              abas: ['resumo']
            }
          ]
        }
      ]
    }
  ];

  it('todo botão do menu é um disclosure (tem aria-expanded); todo link tem destino (href)', async () => {
    const wrapper = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: '' } });
    for (const botao of wrapper.findAll('button')) {
      expect(botao.attributes('aria-expanded'), botao.html()).toBeDefined();
    }
    for (const link of wrapper.findAll('a')) {
      expect(link.attributes('href'), link.html()).toBeTruthy();
    }
  });
});
