// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import { decorarCurriculo } from '@/app/carregamento/decorarCurriculo';
import { CARREGADORES } from '@/app/carregamento/carregadores';
import { curriculo as curriculoSemCarregador } from '@/conteudo/curriculo';

const curriculo = decorarCurriculo(curriculoSemCarregador, CARREGADORES);

/**
 * Ordem do líder, 01/10/2026: as abas novas de Filosofia Jurídica aparecem
 * no menu lateral como as outras, na ordem Resumo, Mapa mental, Fichamento,
 * Mnemônicos, Quiz, e só nessa unidade.
 */
async function abrirTudo(wrapper: ReturnType<typeof mount>): Promise<void> {
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    const fechados = wrapper
      .findAll('button[aria-expanded="false"]')
      .filter((b) => !b.text().includes('Resumo'));
    for (const botao of fechados) await botao.trigger('click');
    await flushPromises();
  }
}

describe('MenuCurriculo: abas novas de Filosofia Jurídica', () => {
  it('lista Mapa mental, Fichamento e Mnemônicos com link direto, entre Resumo e Quiz', async () => {
    const wrapper = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: '' } });
    await abrirTudo(wrapper);
    // O conteúdo da unidade é carregado por import dinâmico: espera chegar.
    await vi.waitFor(() =>
      expect(wrapper.find('a[href="/p/p1/filosofia-juridica/u1/quiz"]').exists()).toBe(true)
    );
    const base = '/p/p1/filosofia-juridica/u1';
    const links = wrapper
      .findAll('a')
      .filter(
        (a) => (a.attributes('href') ?? '').startsWith(`${base}/`) || a.attributes('href') === base
      );
    const abas = links
      .filter((a) =>
        /^\/p\/p1\/filosofia-juridica\/u1(\/(mapa|fichamento|mnemonicos|quiz))?$/.test(
          a.attributes('href')!
        )
      )
      .map((a) => [a.attributes('href'), a.text()]);
    expect(abas).toEqual([
      [base, expect.any(String)],
      [`${base}/mapa`, 'Mapa mental'],
      [`${base}/fichamento`, 'Fichamento'],
      [`${base}/mnemonicos`, 'Mnemônicos'],
      [`${base}/quiz`, 'Quiz']
    ]);
  });

  it('as outras cadeiras não ganham as abas novas no menu', async () => {
    const wrapper = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: '' } });
    await abrirTudo(wrapper);
    // Só vale afirmar a ausência depois que o conteúdo das outras cadeiras chegou.
    await vi.waitFor(() => {
      for (const cadeira of ['intr-direito', 'redacao-juridica-1', 'sociologia-juridica']) {
        expect(wrapper.find(`a[href="/p/p1/${cadeira}/u1/quiz"]`).exists(), cadeira).toBe(true);
      }
    });
    for (const cadeira of ['intr-direito', 'redacao-juridica-1', 'sociologia-juridica']) {
      for (const aba of ['mapa', 'fichamento', 'mnemonicos']) {
        expect(
          wrapper.find(`a[href="/p/p1/${cadeira}/u1/${aba}"]`).exists(),
          `${cadeira}/${aba}`
        ).toBe(false);
      }
    }
  });
});
