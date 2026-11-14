// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import AvisoVersaoPosicao from '@/ui/layout/AvisoVersaoPosicao.vue';

/**
 * AV-F10 (ratificado pelo líder, 46d e 46g, 14/11): o banner é uma faixa FIXA logo ABAIXO do
 * cabeçalho, por cima do conteúdo, e continua visível ao rolar. A posição vem da medida do
 * cabeçalho (--altura-cabecalho, publicada pela BarraTopo), nunca de número solto.
 */
const CAMINHO = resolve(__dirname, '../../src/ui/layout/AvisoVersaoPosicao.vue');

describe('AvisoVersaoPosicao', () => {
  it('mostra o conteúdo que recebe', () => {
    const wrapper = mount(AvisoVersaoPosicao, { slots: { default: '<p>aviso</p>' } });
    expect(wrapper.text()).toContain('aviso');
  });

  it('fica fixa no topo da janela, abaixo do cabeçalho medido, em toda a largura', () => {
    const css = readFileSync(CAMINHO, 'utf-8');
    expect(css).toMatch(/position:\s*fixed/);
    expect(css).toMatch(/top:\s*var\(--altura-cabecalho/);
    expect(css).toMatch(/left:\s*0/);
    expect(css).toMatch(/right:\s*0/);
  });

  it('não tem número solto para o topo', () => {
    const css = readFileSync(CAMINHO, 'utf-8');
    expect(css).not.toMatch(/\btop:\s*\d/);
  });
});
