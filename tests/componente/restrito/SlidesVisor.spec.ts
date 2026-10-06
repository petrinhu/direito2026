// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import SlidesVisor from '@/ui/area-restrita/SlidesVisor.vue';
import { validarConteudoRestrito } from '@/core/restrito/validar';
import { conteudoRestritoFalso } from '../../unidade/apoio/conteudoRestritoFalso';

const r = validarConteudoRestrito(conteudoRestritoFalso());
if (!r.ok) throw new Error('fixture inválida');
const { slides, equipe } = r.conteudo;

let w: VueWrapper | undefined;
function montar(reduzir = false) {
  w = mount(SlidesVisor, {
    props: { slides, equipe, reduzirMovimento: reduzir },
    attachTo: document.body
  });
  return w;
}
afterEach(() => {
  w?.unmount();
  document.body.innerHTML = '';
});

const slideAtual = () => w!.get('[aria-roledescription="slide"]');

describe('SlidesVisor', () => {
  it('abre na capa, com a instituição e os integrantes vindos da equipe', () => {
    montar();
    expect(slideAtual().attributes('aria-label')).toBe('Slide 1 de 10');
    expect(slideAtual().text()).toContain('Slide fictício 1');
    expect(slideAtual().text()).toContain('Instituição Fictícia');
    expect(slideAtual().text()).toContain('Pessoa Fictícia Um');
  });

  it('só a capa mostra a equipe', async () => {
    montar();
    await w!.get('button[data-acao="proximo"]').trigger('click');
    expect(slideAtual().text()).not.toContain('Instituição Fictícia');
  });

  it('botões avançam e voltam, e nas pontas ficam aria-disabled', async () => {
    montar();
    const anterior = w!.get('button[data-acao="anterior"]');
    expect(anterior.attributes('aria-disabled')).toBe('true');
    await w!.get('button[data-acao="proximo"]').trigger('click');
    expect(slideAtual().attributes('aria-label')).toBe('Slide 2 de 10');
    await anterior.trigger('click');
    expect(slideAtual().attributes('aria-label')).toBe('Slide 1 de 10');
    await anterior.trigger('click');
    expect(slideAtual().attributes('aria-label')).toBe('Slide 1 de 10');
  });

  it('teclado: setas, PageDown, PageUp, Home e End', async () => {
    montar();
    const palco = w!.get('.ar-slides__palco');
    await palco.trigger('keydown', { key: 'ArrowRight' });
    await palco.trigger('keydown', { key: 'PageDown' });
    expect(slideAtual().attributes('aria-label')).toBe('Slide 3 de 10');
    await palco.trigger('keydown', { key: 'ArrowLeft' });
    expect(slideAtual().attributes('aria-label')).toBe('Slide 2 de 10');
    await palco.trigger('keydown', { key: 'End' });
    expect(slideAtual().attributes('aria-label')).toBe('Slide 10 de 10');
    await palco.trigger('keydown', { key: 'ArrowRight' });
    expect(slideAtual().attributes('aria-label')).toBe('Slide 10 de 10');
    await palco.trigger('keydown', { key: 'Home' });
    expect(slideAtual().attributes('aria-label')).toBe('Slide 1 de 10');
    await palco.trigger('keydown', { key: 'PageUp' });
    expect(slideAtual().attributes('aria-label')).toBe('Slide 1 de 10');
  });

  it('atalhos com Ctrl ou Alt não são sequestrados', async () => {
    montar();
    await w!.get('.ar-slides__palco').trigger('keydown', { key: 'ArrowRight', ctrlKey: true });
    expect(slideAtual().attributes('aria-label')).toBe('Slide 1 de 10');
  });

  it('notas do apresentador começam escondidas; botão e a tecla N alternam, com aria-pressed', async () => {
    montar();
    const botao = w!.get('button[data-acao="notas"]');
    expect(botao.attributes('aria-pressed')).toBe('false');
    expect(w!.find('aside.ar-slides__notas').exists()).toBe(false);
    await botao.trigger('click');
    expect(botao.attributes('aria-pressed')).toBe('true');
    expect(w!.get('aside.ar-slides__notas').text()).toContain('palavra0');
    await w!.get('.ar-slides__palco').trigger('keydown', { key: 'n' });
    expect(w!.find('aside.ar-slides__notas').exists()).toBe(false);
  });

  it('cada layout renderiza o que o define', async () => {
    montar();
    const palco = w!.get('.ar-slides__palco');
    await palco.trigger('keydown', { key: 'ArrowRight' });
    expect(slideAtual().classes()).toContain('ar-slide--topicos');
    expect(slideAtual().findAll('li')).toHaveLength(2);
    await palco.trigger('keydown', { key: 'ArrowRight' });
    await palco.trigger('keydown', { key: 'ArrowRight' });
    expect(slideAtual().classes()).toContain('ar-slide--destaque');
    expect(slideAtual().text()).toContain('Frase de impacto fictícia.');
    await palco.trigger('keydown', { key: 'ArrowRight' });
    expect(slideAtual().classes()).toContain('ar-slide--comparativo');
    expect(slideAtual().findAll('.ar-slide__coluna')).toHaveLength(2);
    await palco.trigger('keydown', { key: 'End' });
    expect(slideAtual().classes()).toContain('ar-slide--encerramento');
  });

  it('anuncia a troca de slide para o leitor de tela, sem mover o foco', async () => {
    montar();
    await w!.get('button[data-acao="proximo"]').trigger('click');
    expect(w!.get('.ar-visualmente-oculto[role="status"]').text()).toMatch(/slide 2 de 10/i);
  });

  it('conteúdo de slide é texto: nada vira HTML', () => {
    const suspeito = [
      { ...slides[0]!, titulo: '<img src=x onerror=alert(1)>' },
      ...slides.slice(1)
    ];
    w = mount(SlidesVisor, { props: { slides: suspeito, equipe, reduzirMovimento: false } });
    expect(w.find('img').exists()).toBe(false);
    expect(w.text()).toContain('<img src=x onerror=alert(1)>');
  });

  it('o palco é focável e descreve como usar o teclado', () => {
    montar();
    const palco = w!.get('.ar-slides__palco');
    expect(palco.attributes('tabindex')).toBe('0');
    expect(palco.attributes('aria-label')).toMatch(/setas/i);
  });

  it('sem movimento: marca o palco para o CSS cortar a transição', () => {
    montar(true);
    expect(w!.get('.ar-slides__deck').classes()).toContain('ar-slides__deck--sem-movimento');
  });
});
