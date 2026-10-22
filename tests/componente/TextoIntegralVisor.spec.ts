// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import TextoIntegralVisor from '@/ui/componentes/TextoIntegralVisor.vue';
import type { TextoIntegral } from '@/core/textoIntegral/tipos';

/** Dado sintético: o texto real vem do OCR e não entra em teste de componente. */
const TEXTO: TextoIntegral = {
  titulo: 'Título de teste',
  fonte: 'Autor, Obra, 2010. Números entre colchetes: páginas do PDF.',
  blocos: [
    { tipo: 'subtitulo', texto: 'Subtítulo de teste' },
    {
      tipo: 'paragrafo',
      trechos: [
        { tipo: 'texto', texto: 'Primeiro trecho de texto' },
        { tipo: 'pagina', numero: 138 },
        { tipo: 'texto', texto: 'segue o parágrafo' }
      ]
    },
    {
      tipo: 'paragrafo',
      trechos: [
        { tipo: 'texto', texto: 'Um termo ' },
        { tipo: 'italico', texto: 'conveyance' },
        { tipo: 'texto', texto: ' aqui.' }
      ]
    }
  ]
};

function montar() {
  return mount(TextoIntegralVisor, { props: { texto: TEXTO } });
}

describe('TextoIntegralVisor: cabeçalho', () => {
  it('mostra o título em h2 e a fonte no texto visível', () => {
    const wrapper = montar();
    expect(wrapper.find('h2').text()).toBe('Título de teste');
    expect(wrapper.text()).toContain(TEXTO.fonte);
  });
});

describe('TextoIntegralVisor: blocos e trechos', () => {
  it('um <p> por parágrafo e um <h3> por subtítulo, dentro do corpo', () => {
    const wrapper = montar();
    expect(wrapper.findAll('.texto-integral__corpo > p')).toHaveLength(2);
    expect(wrapper.findAll('.texto-integral__corpo > h3')).toHaveLength(1);
    expect(wrapper.find('.texto-integral__corpo > h3').text()).toBe('Subtítulo de teste');
  });

  it('o trecho em itálico vai para <em>', () => {
    const wrapper = montar();
    expect(wrapper.find('em').text()).toBe('conveyance');
  });

  it('o marcador de página aparece no meio do parágrafo, com id pagina-N', () => {
    const wrapper = montar();
    const marcador = wrapper.find('#pagina-138');
    expect(marcador.exists()).toBe(true);
    expect(marcador.text()).toBe('[p. 138]');
    const primeiro = wrapper.findAll('.texto-integral__corpo > p')[0]!;
    expect(primeiro.text().replace(/\s+/g, ' ')).toBe(
      'Primeiro trecho de texto [p. 138] segue o parágrafo'
    );
  });
});

describe('TextoIntegralVisor: segurança', () => {
  it('o componente não usa v-html (exceção de CSP fica de fora do visor)', () => {
    const caminho = resolve(process.cwd(), 'src/ui/componentes/TextoIntegralVisor.vue');
    expect(readFileSync(caminho, 'utf-8')).not.toContain('v-html');
  });
});
