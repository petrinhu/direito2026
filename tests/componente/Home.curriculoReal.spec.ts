// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import Home from '@/ui/paginas/Home.vue';
import { CHAVE_CURRICULO } from '@/app/chaves';
import { curriculo } from '@/conteudo/curriculo';
import { numeroRomano } from '@/app/curriculo/numeroRomano';
import { separarPeriodos } from '@/app/curriculo/separarPeriodos';
import { textoEmPreparo } from '@/app/curriculo/textoEmPreparo';

/**
 * Nenhum número abaixo é escrito à mão: cada expectativa sai do próprio
 * currículo. Assim, publicar uma unidade, uma cadeira ou um período novo não
 * quebra este teste; só quebra a página deixar de mostrar o que o currículo
 * diz (uma linha a mais ou a menos).
 */
const todasAsCadeiras = curriculo.flatMap((p) => p.cadeiras);
const unidadesPublicadas = todasAsCadeiras.flatMap((c) =>
  c.unidades.filter((u) => u.estado === 'publicado')
);
const cadeirasComAtalho = todasAsCadeiras.filter((c) => c.atalhoUnidade);
const restritasPublicadas = todasAsCadeiras.filter((c) => c.restrita && c.estado === 'publicado');
const { comMaterial, emPreparo } = separarPeriodos(curriculo);

describe('Home com o currículo real', () => {
  const wrapper = mount(Home, {
    global: {
      provide: { [CHAVE_CURRICULO as unknown as symbol]: curriculo },
      stubs: { teleport: true }
    }
  });
  const unidades = wrapper.findAll('a.linha:not(.linha--restrita)');
  const placa = (nome: string) =>
    wrapper.findAll('article.placa').find((p) => p.find('h3').text().includes(nome))!;

  // Um link por UNIDADE publicada (Filosofia tem duas: a 1 e a 3). O atalho
  // para o Interdisciplinar não é unidade e não entra nesta conta.
  it('mostra uma linha por unidade publicada, todas com link e nome distintos', () => {
    expect(unidadesPublicadas.length).toBeGreaterThan(0);
    expect(unidades).toHaveLength(unidadesPublicadas.length);
    expect(new Set(unidades.map((l) => l.attributes('href'))).size).toBe(unidadesPublicadas.length);
    expect(new Set(unidades.map((l) => l.text())).size).toBe(unidadesPublicadas.length);
    expect(unidades.some((l) => (l.attributes('href') ?? '').endsWith('/u2'))).toBe(false);
  });

  it('cada cadeira pública traz o atalho para o Interdisciplinar, e a restrita traz o link de entrada', () => {
    const links = wrapper
      .findAll('a')
      .filter((a) => a.attributes('href') === '/p/p1/interdisciplinar');
    // A restrita publicada que leva ao Interdisciplinar; a Júri leva à própria página.
    const entradaDoInterdisciplinar = restritasPublicadas.filter(
      (c) => c.id === 'interdisciplinar'
    );
    expect(links).toHaveLength(cadeirasComAtalho.length + entradaDoInterdisciplinar.length);
  });

  it('a Filosofia Jurídica mostra a Unidade 3 e não oferece petição', () => {
    const p = placa('Filosofia Jurídica');
    expect(p.text()).toContain('Filosofia Moderna e Contemporânea');
    expect(p.text().toLowerCase()).not.toContain('peti');
  });

  it('a Sociologia Jurídica não oferece petição em lugar nenhum da página', () => {
    expect(placa('Sociologia Jurídica').text().toLowerCase()).not.toContain('peti');
    expect(
      wrapper.findAll('a').some((a) => (a.attributes('href') ?? '').includes('/peticao'))
    ).toBe(false);
  });

  it('os numerais romanos dos períodos com material e a linha dos demais vêm do currículo', () => {
    expect(comMaterial.length).toBeGreaterThan(0);
    expect(wrapper.findAll('.periodo__numeral').map((n) => n.text())).toEqual(
      comMaterial.map((p) => numeroRomano(p.numero))
    );
    const linha = textoEmPreparo(emPreparo);
    if (linha === null) {
      expect(wrapper.find('.em-preparo').exists()).toBe(false);
    } else {
      expect(wrapper.get('.em-preparo').text()).toBe(linha);
    }
  });
});
