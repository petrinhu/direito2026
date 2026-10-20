// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import { curriculo } from '@/conteudo/curriculo';

/**
 * Defeito (QA em produção, 1280px): no menu lateral, "Português e Redação
 * Jurídica 1" quebrava deixando o "1" sozinho na linha de baixo. O nome
 * exibido precisa trazer U+00A0 antes do último token curto.
 */
describe('MenuCurriculo, nome da cadeira sem viúva', () => {
  it('o nome exibido liga "Jurídica" ao "1" com espaço não separável', async () => {
    const wrapper = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: '' } });
    await wrapper.findAll('button[aria-expanded]')[0]!.trigger('click');
    expect(wrapper.text()).toContain('Redação Jurídica 1');
  });
});
