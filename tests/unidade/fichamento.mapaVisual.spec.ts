import { describe, expect, it } from 'vitest';
import { construirArvoreMapa } from '@/core/fichamento/arvoreMapa';
import {
  alternarTodosRamos,
  arvoreVisual,
  abertosIniciaisVisual,
  caminhoLigacao,
  layoutRadial,
  rotuloVisual,
  todosAbertos
} from '@/core/fichamento/mapaVisual';
import { percorrer } from '@/core/fichamento/arvoreMapa';
import { DADOS_SINTETICOS } from './apoio/dadosFichamento';

const dados = {
  ...DADOS_SINTETICOS,
  pensadores: DADOS_SINTETICOS.pensadores.map((p, i) => ({
    ...p,
    nomeCurto: i === 0 ? 'Alfa curto' : undefined
  }))
};

describe('arvoreVisual', () => {
  const raiz = arvoreVisual(dados);

  it('descarta o nível de fase: o pensador fica direto sob o período', () => {
    expect(percorrer(raiz).some((n) => n.tipo === 'fase')).toBe(false);
    expect(raiz.filhos.map((e) => e.rotulo)).toEqual(['Idade Antiga', 'Idade Média']);
    expect(raiz.filhos[0]!.filhos.map((p) => p.fichaId)).toEqual(['alfa', 'beta']);
  });

  it('o nome curto do pensador vira rótulo curto; sem ele, o rótulo do mapa', () => {
    const alfa = raiz.filhos[0]!.filhos[0]!;
    expect(rotuloVisual(alfa, 40)).toBe('Alfa curto');
    expect(rotuloVisual(raiz.filhos[0]!.filhos[1]!, 40)).toBe('Beta');
  });

  it('rótulo longo é cortado com reticências, nunca passa do máximo', () => {
    const longo = { ...raiz, rotulo: 'a'.repeat(50), rotuloCurto: undefined };
    const r = rotuloVisual(longo, 20);
    expect(r.length).toBeLessThanOrEqual(20);
    expect(r.endsWith('…')).toBe(true);
  });

  it('o atalho da ficha não vira cápsula (é link no painel de detalhe)', () => {
    expect(percorrer(raiz).some((n) => n.tipo === 'ficha')).toBe(false);
  });

  it('é diferente da árvore completa (mesma fonte, outra forma)', () => {
    expect(percorrer(raiz).length).toBeLessThan(percorrer(construirArvoreMapa(dados)).length);
  });
});

describe('layoutRadial', () => {
  const raiz = arvoreVisual(dados);
  const abertos = abertosIniciaisVisual(raiz);

  it('começa mostrando a raiz, os períodos e os pensadores, sem os detalhes', () => {
    const ids = layoutRadial(raiz, abertos).map((p) => p.no.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'mapa-raiz',
        'mapa-era-antiga',
        'mapa-pensador-alfa',
        'mapa-pensador-gama'
      ])
    );
    expect(ids).not.toContain('mapa-alfa-modo');
  });

  it('a raiz fica no centro e cada nível num anel maior', () => {
    const pos = new Map(layoutRadial(raiz, abertos).map((p) => [p.no.id, p]));
    expect(pos.get('mapa-raiz')).toMatchObject({ x: 0, y: 0 });
    const r = (id: string) => Math.hypot(pos.get(id)!.x, pos.get(id)!.y);
    expect(r('mapa-era-antiga')).toBeGreaterThan(0);
    expect(r('mapa-pensador-alfa')).toBeGreaterThan(r('mapa-era-antiga'));
  });

  it('abrir um pensador mostra os filhos dele, num anel mais fundo', () => {
    const aberto = new Set(abertos).add('mapa-pensador-alfa');
    const pos = new Map(layoutRadial(raiz, aberto).map((p) => [p.no.id, p]));
    const r = (id: string) => Math.hypot(pos.get(id)!.x, pos.get(id)!.y);
    expect(pos.has('mapa-alfa-modo')).toBe(true);
    expect(r('mapa-alfa-modo')).toBeGreaterThan(r('mapa-pensador-alfa'));
  });

  it('nós irmãos não se sobrepõem: ângulos distintos', () => {
    const angulos = layoutRadial(raiz, abertos)
      .filter((p) => p.profundidade === 2)
      .map((p) => Math.round(Math.atan2(p.y, p.x) * 1000));
    expect(new Set(angulos).size).toBe(angulos.length);
  });

  it('cada pensador e tudo que sai dele compartilham o mesmo tom (ramo)', () => {
    const todos = new Set(todosAbertos(raiz));
    const pos = layoutRadial(raiz, todos);
    const ramo = (id: string) => pos.find((p) => p.no.id === id)!.ramo;
    expect(ramo('mapa-alfa-modo')).toBe(ramo('mapa-pensador-alfa'));
    expect(ramo('mapa-alfa-conceito-0')).toBe(ramo('mapa-pensador-alfa'));
    expect(ramo('mapa-pensador-beta')).not.toBe(ramo('mapa-pensador-alfa'));
  });

  it('cada nó aponta para o pai', () => {
    const pos = layoutRadial(raiz, abertos);
    expect(pos.find((p) => p.no.id === 'mapa-pensador-alfa')!.paiId).toBe('mapa-era-antiga');
    expect(pos.find((p) => p.no.id === 'mapa-raiz')!.paiId).toBeUndefined();
  });
});

describe('abrir e fechar tudo', () => {
  const raiz = arvoreVisual(dados);

  it('todosAbertos abre todo nó com filhos', () => {
    const t = new Set(todosAbertos(raiz));
    expect(t.has('mapa-alfa-conceitos')).toBe(true);
    expect(t.has('mapa-alfa-modo')).toBe(false);
  });

  it('alternarTodosRamos abre se algo está fechado e recolhe se tudo está aberto', () => {
    const inicial = abertosIniciaisVisual(raiz);
    expect(alternarTodosRamos(raiz, inicial)).toEqual(new Set(todosAbertos(raiz)));
    expect(alternarTodosRamos(raiz, new Set(todosAbertos(raiz)))).toEqual(inicial);
  });
});

describe('caminhoLigacao e enquadrar', () => {
  it('a ligação é uma curva cúbica que começa no pai e termina no filho', () => {
    const d = caminhoLigacao({ x: 0, y: 0 }, { x: 100, y: 100 });
    expect(d).toMatch(/^M 0 0 C /);
    expect(d.endsWith('100 100')).toBe(true);
  });

  it('a curva não tem NaN nem com o pai na origem e o filho em cima dele', () => {
    expect(caminhoLigacao({ x: 0, y: 0 }, { x: 0, y: 0 })).not.toContain('NaN');
  });
});
