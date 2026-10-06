// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import SlidesVisor from '@/ui/area-restrita/SlidesVisor.vue';
import { validarConteudoRestrito } from '@/core/restrito/validar';
import { conteudoRestritoFalso } from '../../unidade/apoio/conteudoRestritoFalso';

const r = validarConteudoRestrito(conteudoRestritoFalso());
if (!r.ok) throw new Error('fixture inválida');
const fonte = readFileSync('src/ui/area-restrita/SlidesVisor.vue', 'utf8');

describe('SlidesVisor: aviso de celular em pé', () => {
  it('o aviso existe como texto legível (role=status), ícone decorativo e sem esconder o deck', () => {
    const w = mount(SlidesVisor, {
      props: { slides: r.conteudo.slides, equipe: r.conteudo.equipe, reduzirMovimento: true }
    });
    const aviso = w.get('.ar-slides__gire');
    expect(aviso.attributes('role')).toBe('status');
    expect(aviso.text()).toBe('Gire o aparelho para ver os slides');
    expect(aviso.get('svg').attributes('aria-hidden')).toBe('true');
    expect(w.find('[aria-roledescription="slide"]').exists()).toBe(true);
    expect(aviso.element.closest('[aria-hidden="true"]')).toBeNull();
  });

  it('só aparece por media query de orientação em retrato e largura estreita, sem JS', () => {
    expect(fonte).toMatch(/\.ar-slides__gire\s*{\s*display:\s*none;/);
    expect(fonte).toMatch(
      /@media \(orientation: portrait\) and \(max-width: 700px\)\s*{\s*\.ar-slides__gire\s*{\s*display:\s*flex;/
    );
  });
});
