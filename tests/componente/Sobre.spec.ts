// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import axe from 'axe-core';
import Sobre from '@/ui/paginas/Sobre.vue';
import { TITULAR } from '@/app/rodape/titular';
import { ROTULOS_ABA } from '@/app/curriculo/rotulosAba';
import { rotas } from '@/app/router/rotas';
import { PAPEIS_DAS_DEPENDENCIAS } from '@/conteudo/sobre/papeis';
import { TEXTOS_SOBRE } from '@/conteudo/sobre/textos';

/**
 * SB-F8, página Sobre (esqueleto). Os textos finais vêm da SB-F11 (ux-writer); aqui
 * a estrutura é a da seção 4 do plano.
 * O nome do titular entra SÓ por TITULAR (autoria.ts, via app/rodape/titular): nunca escrito à mão.
 */

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
  document.body.innerHTML = '';
});

function secaoComTitulo(titulo: string) {
  const secao = w!.findAll('section').find((s) => s.find('h2').text() === titulo);
  if (!secao) throw new Error(`seção "${titulo}" ausente`);
  return secao;
}

describe('página Sobre, estrutura (SB-F8)', () => {
  it('tem um único h1 "Sobre"', () => {
    w = mount(Sobre, { attachTo: document.body });
    expect(w.findAll('h1').map((h) => h.text())).toEqual(['Sobre']);
  });

  it('as seções saem na ordem: O projeto, Autoria, Tecnologias, Para nerds', () => {
    w = mount(Sobre, { attachTo: document.body });
    expect(w.findAll('h2').map((h) => h.text())).toEqual([
      'O projeto',
      'Autoria',
      'Tecnologias',
      'Para nerds'
    ]);
  });

  it('a seção Para nerds tem h2 próprio e nenhum conteúdo escondido', () => {
    w = mount(Sobre, { attachTo: document.body });
    const nerds = w.find('[data-secao="para-nerds"]');
    expect(nerds.exists()).toBe(true);
    expect(nerds.find('h2').text()).toBe('Para nerds');
    expect(nerds.find('details').exists()).toBe(false);
    expect(nerds.attributes('hidden')).toBeUndefined();
  });

  it('a lista do que o site oferece vem do mapa de rótulos de aba, sem reescrever nada', () => {
    w = mount(Sobre, { attachTo: document.body });
    const itens = secaoComTitulo('O projeto')
      .findAll('li')
      .map((li) => li.text());
    expect(itens).toEqual(Object.values(ROTULOS_ABA));
  });
});

describe('página Sobre, autoria e crédito', () => {
  it('a seção Autoria mostra o titular exatamente como TITULAR', () => {
    w = mount(Sobre, { attachTo: document.body });
    expect(TITULAR.length).toBeGreaterThan(0);
    expect(secaoComTitulo('Autoria').text()).toContain(TITULAR);
  });

  it('a seção Autoria traz o crédito do código (D8)', () => {
    w = mount(Sobre, { attachTo: document.body });
    expect(secaoComTitulo('Autoria').text()).toContain(
      'O código foi escrito por Claude, inteligência artificial da Anthropic.'
    );
    expect(secaoComTitulo('Autoria').text()).toContain(
      'O Caderno de Direito não tem vínculo com a Anthropic e não é apoiado nem patrocinado por ela.'
    );
  });
});

describe('página Sobre, texto', () => {
  it('não tem travessão (U+2014 nem U+2013) em lugar nenhum do texto da página', () => {
    w = mount(Sobre, { attachTo: document.body });
    expect(w.text()).not.toMatch(/[\u2013\u2014]/);
  });

  it('não usa aula, slide, "o material" nem "no material"', () => {
    w = mount(Sobre, { attachTo: document.body });
    const texto = w.text().toLowerCase();
    expect(texto).not.toMatch(/\b(aula|aulas|slide|slides)\b/);
    expect(texto).not.toContain('o material');
    expect(texto).not.toContain('no material');
  });
});

describe('página Sobre, acessibilidade', () => {
  it('não tem violação de axe', async () => {
    w = mount(Sobre, { attachTo: document.body });
    // Sem cor calculada no jsdom, o contraste é conferido no CSS, não aqui.
    const resultado = await axe.run(w.element as HTMLElement, {
      rules: { 'color-contrast': { enabled: false } }
    });
    expect(resultado.violations.map((v) => v.id)).toEqual([]);
  });
});

describe('página Sobre, pilha gerada no build (SB-F10)', () => {
  const pilha = __STACK_SITE__;
  const deExecucao = pilha.dependencias.filter((d) => d.grupo === 'execucao');
  const deConstrucao = pilha.dependencias.filter((d) => d.grupo === 'construcao');

  it('Tecnologias traz Vue, Vue Router, TypeScript e Vite com a versão instalada', () => {
    w = mount(Sobre, { attachTo: document.body });
    const texto = secaoComTitulo('Tecnologias').text();
    for (const nome of ['vue', 'vue-router', 'typescript', 'vite']) {
      const dep = pilha.dependencias.find((d) => d.nome === nome);
      expect(dep, nome).toBeDefined();
      expect(texto, nome).toContain(`${nome} ${dep!.versao}`);
    }
  });

  it('Para nerds mostra a versão do site e a do Node do build', () => {
    w = mount(Sobre, { attachTo: document.body });
    const texto = secaoComTitulo('Para nerds').text();
    expect(texto).toContain(pilha.versaoSite);
    expect(texto).toContain(pilha.versaoNode);
  });

  it('Para nerds tem tabela de execução e tabela de construção, com nome, versão, licença e papel', () => {
    w = mount(Sobre, { attachTo: document.body });
    const tabelas = secaoComTitulo('Para nerds').findAll('table');
    expect(tabelas).toHaveLength(2);
    const [tabelaExecucao, tabelaConstrucao] = tabelas;
    const pares = [
      [tabelaExecucao!, deExecucao],
      [tabelaConstrucao!, deConstrucao]
    ] as const;
    for (const [tabela, deps] of pares) {
      expect(tabela.find('caption').exists()).toBe(true);
      const linhas = tabela.findAll('tbody tr');
      expect(linhas).toHaveLength(deps.length);
      deps.forEach((dep, i) => {
        const celulas = linhas[i]!.findAll('td').map((td) => td.text());
        expect(celulas).toEqual([
          dep.nome,
          dep.versao,
          dep.licenca,
          PAPEIS_DAS_DEPENDENCIAS[dep.nome]
        ]);
        expect(PAPEIS_DAS_DEPENDENCIAS[dep.nome]?.length ?? 0).toBeGreaterThan(0);
      });
    }
  });

  it('nenhum número de PHP nem dado de servidor aparece na página (decisão do CISO)', () => {
    w = mount(Sobre, { attachTo: document.body });
    const texto = w.text();
    expect(texto).not.toMatch(/PHP\s*v?\d/i);
    expect(texto).not.toMatch(/memory_cost|time_cost|default-src|LiteSpeed|Hostinger/i);
    expect(texto).not.toMatch(/openssl|\bv8\b/i);
  });
});

describe('rota /sobre', () => {
  it('existe com o nome sobre e import preguiçoso', () => {
    const rota = rotas.find((r) => r.name === 'sobre');
    expect(rota?.path).toBe('/sobre');
    expect(typeof rota?.component).toBe('function');
  });

  it('vem antes do coringa de não encontrado', () => {
    const indiceSobre = rotas.findIndex((r) => r.name === 'sobre');
    const indiceCoringa = rotas.findIndex((r) => r.name === 'nao-encontrado');
    expect(indiceSobre).toBeGreaterThanOrEqual(0);
    expect(indiceSobre).toBeLessThan(indiceCoringa);
  });
});

describe('página Sobre, tabelas da seção Para nerds em tela estreita (SB-F13, A1 e A2)', () => {
  it('cada contêiner de tabela é região rolável focável, com nome pela seção', () => {
    w = mount(Sobre, { attachTo: document.body });
    const contineres = secaoComTitulo('Para nerds').findAll('.pagina-sobre__tabela');
    expect(contineres).toHaveLength(2);
    for (const contorno of contineres) {
      expect(contorno.attributes('tabindex')).toBe('0');
      expect(contorno.attributes('role')).toBe('region');
      const idDoNome = contorno.attributes('aria-labelledby');
      expect(idDoNome).toBeDefined();
      expect(idDoNome).not.toBe('sobre-para-nerds');
      expect(w.find(`#${idDoNome}`).exists()).toBe(true);
    }
    const nomes = contineres.map((c) => c.attributes('aria-labelledby'));
    expect(new Set(nomes).size).toBe(nomes.length);
    expect(w.find('#sobre-tabela-execucao').text()).toBe(TEXTOS_SOBRE.paraNerds.tabelaExecucao);
    expect(w.find('#sobre-tabela-construcao').text()).toBe(TEXTOS_SOBRE.paraNerds.tabelaConstrucao);
  });

  it('cada célula de corpo traz o cabeçalho da coluna em data-label (par rótulo/valor)', () => {
    w = mount(Sobre, { attachTo: document.body });
    const tabelas = secaoComTitulo('Para nerds').findAll('table');
    for (const tabela of tabelas) {
      const cabecalhos = tabela.findAll('thead th').map((th) => th.text());
      expect(cabecalhos).toEqual(['Nome', 'Versão', 'Licença', 'Papel']);
      for (const linha of tabela.findAll('tbody tr')) {
        const celulas = linha.findAll('td');
        expect(celulas).toHaveLength(cabecalhos.length);
        celulas.forEach((td, i) => {
          expect(td.attributes('data-label')).toBe(cabecalhos[i]);
        });
      }
    }
  });
});
