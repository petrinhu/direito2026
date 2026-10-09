// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import SlidesVisor from '@/ui/area-restrita/SlidesVisor.vue';
import { validarConteudoRestrito } from '@/core/restrito/validar';
import { conteudoRestritoFalso } from '../../unidade/apoio/conteudoRestritoFalso';

const r = validarConteudoRestrito(conteudoRestritoFalso());
if (!r.ok) throw new Error('fixture inválida');
const { slides, equipe } = r.conteudo;

const fonte = readFileSync('src/ui/area-restrita/SlidesVisor.vue', 'utf8');
/** Bloco <style> SEM o atributo scoped: é onde ficam as regras globais de @page. */
const estiloGlobal = /<style>\s*([\s\S]*?)<\/style>/.exec(fonte)?.[1] ?? '';
/** Corpo da regra CSS que começa no seletor dado (até a chave de fechamento do mesmo nível). */
const regra = (css: string, seletor: string): string => {
  const i = css.indexOf(seletor);
  expect(i, `seletor ausente: ${seletor}`).toBeGreaterThan(-1);
  return css.slice(i, css.indexOf('}', i) + 1);
};

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.documentElement.classList.remove('ar-imprimindo');
  document.documentElement.classList.remove('ar-imprimindo--sem-notas');
});

async function imprimirSemNotas(): Promise<VueWrapper> {
  vi.stubGlobal('print', vi.fn());
  w = mount(SlidesVisor, {
    props: { slides, equipe, reduzirMovimento: false },
    attachTo: document.body
  });
  await flushPromises();
  await w.get('button[data-acao="imprimir"]').trigger('click');
  await flushPromises();
  return w;
}

describe('impressão sem notas: um slide por página, só o slide', () => {
  it('marca a impressão com a classe de sem notas', async () => {
    await imprimirSemNotas();
    expect(
      document.querySelector('.ar-impresso')!.classList.contains('ar-impresso--sem-notas')
    ).toBe(true);
  });

  it('não marca sem notas quando a impressão é com notas', async () => {
    vi.stubGlobal('print', vi.fn());
    w = mount(SlidesVisor, {
      props: { slides, equipe, reduzirMovimento: false },
      attachTo: document.body
    });
    await flushPromises();
    await w.get('button[data-acao="imprimir-com-notas"]').trigger('click');
    await flushPromises();
    expect(
      document.querySelector('.ar-impresso')!.classList.contains('ar-impresso--sem-notas')
    ).toBe(false);
  });

  it('uma página por slide, e dentro de cada página só o quadro do slide', async () => {
    await imprimirSemNotas();
    const paginas = Array.from(document.querySelectorAll('.ar-impresso__pagina'));
    expect(paginas).toHaveLength(slides.length);
    for (const pagina of paginas) {
      const filhos = Array.from(pagina.children);
      expect(filhos).toHaveLength(1);
      expect(filhos[0]!.classList.contains('ar-impresso__quadro')).toBe(true);
    }
  });

  it('nenhum botão, barra, contador, cronômetro, aviso de girar nem nota na impressão', async () => {
    await imprimirSemNotas();
    const impresso = document.querySelector('.ar-impresso')!;
    for (const seletor of [
      'button',
      'nav',
      'header',
      'footer',
      'aside',
      '.ar-slides__barra',
      '.ar-slides__contador',
      '.ar-slides__tempo',
      '.ar-slides__gire',
      '.ar-impresso__notas'
    ]) {
      expect(impresso.querySelector(seletor), seletor).toBeNull();
    }
    expect(impresso.textContent).not.toMatch(/\d+\s*\/\s*\d+/);
  });

  it('o CSS de impressão sem notas esconde tudo do site que não é o quadro', () => {
    const b = regra(estiloGlobal, '@media print');
    expect(b).toContain('ar-imprimindo--sem-notas');
    expect(b).toMatch(/body\s*>\s*\*:not\(\.ar-impresso\)\s*\{\s*display:\s*none\s*!important/);
  });

  it('a página sem notas é 16:9 (338.67 x 190.5 mm), sem margem, e cada uma quebra antes da próxima', () => {
    const page = regra(estiloGlobal, '@page slide');
    expect(page).toMatch(/size:\s*338\.67mm\s+190\.5mm/);
    expect(page).toMatch(/margin:\s*0/);

    const pagina = regra(estiloGlobal, '.ar-impresso--sem-notas .ar-impresso__pagina');
    expect(pagina).toMatch(/page:\s*slide/);
    expect(pagina).toMatch(/width:\s*338\.67mm/);
    expect(pagina).toMatch(/height:\s*190\.5mm/);
    expect(pagina).toMatch(/break-after:\s*page/);

    const quadro = regra(estiloGlobal, '.ar-impresso--sem-notas .ar-impresso__quadro');
    expect(quadro).toMatch(/width:\s*100%\s*!important/);
    expect(quadro).toMatch(/height:\s*100%\s*!important/);
    expect(quadro).toMatch(/print-color-adjust:\s*exact/);
  });

  it('a última página não gera quebra extra no fim', () => {
    expect(regra(estiloGlobal, '.ar-impresso--sem-notas .ar-impresso__pagina:last-child')).toMatch(
      /break-after:\s*auto/
    );
  });

  it('o modo com notas continua em A4 deitado com margem de 10 mm', () => {
    const b = regra(fonte, '@page {');
    expect(b).toMatch(/size:\s*A4 landscape/);
    expect(b).toMatch(/margin:\s*10mm/);
  });
});
