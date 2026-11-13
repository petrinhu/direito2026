import { describe, expect, it } from 'vitest';
import { curriculo } from '@/conteudo/curriculo';
import { resolverRota } from '@/core/curriculo/resolverRota';
import { itensDaCadeira } from '@/core/curriculo/itensDaCadeira';
import { CARREGADORES } from '@/app/carregamento/carregadores';
import { CARREGADORES_DISPOSITIVOS } from '@/app/carregamento/carregadoresDispositivos';

const CHAVE = 'p1/filosofia-juridica/u3-moderna-contemporanea';
const filosofia = curriculo
  .find((p) => p.id === 'p1')!
  .cadeiras.find((c) => c.id === 'filosofia-juridica')!;

describe('Filosofia Jurídica, Unidade 3 (Filosofia Moderna e Contemporânea)', () => {
  it('entra depois da Unidade 1 e do atalho para o interdisciplinar', () => {
    const ids = filosofia.unidades.map((u) => u.id);
    expect(ids).toContain('u3-moderna-contemporanea');
    expect(ids.indexOf('u3-moderna-contemporanea')).toBeGreaterThan(ids.indexOf('u1'));
    expect(filosofia.atalhoUnidade?.apos).toBe('u1');
  });

  it('tem rótulo, título, estado e abas da ordem do líder', () => {
    const u3 = filosofia.unidades.find((u) => u.id === 'u3-moderna-contemporanea')!;
    expect(u3.rotulo).toBe('AV3');
    expect(u3.titulo).toBe('Filosofia Moderna e Contemporânea');
    expect(u3.estado).toBe('publicado');
    expect([...u3.abas]).toEqual(['resumo', 'mapa', 'fichamento', 'mnemonicos', 'quiz']);
  });

  it('resolve as abas pela rota e não tem petição', () => {
    const base = '/p/p1/filosofia-juridica/u3-moderna-contemporanea';
    expect(resolverRota(curriculo, base).tipo).toBe('encontrado');
    expect(resolverRota(curriculo, `${base}/mapa`).tipo).toBe('encontrado');
    expect(resolverRota(curriculo, `${base}/quiz`).tipo).toBe('encontrado');
    expect(resolverRota(curriculo, `${base}/peticao`).tipo).not.toBe('encontrado');
  });

  it('tem carregador de conteúdo e de dispositivos registrados', () => {
    expect(CARREGADORES[CHAVE], 'conteúdo').toBeTypeOf('function');
    expect(CARREGADORES_DISPOSITIVOS[CHAVE], 'dispositivos').toBeTypeOf('function');
  });

  it('o carregador entrega resumo, quiz, mapa e mnemônicos, sem petição', async () => {
    const conteudo = await CARREGADORES[CHAVE]!();
    expect(conteudo.resumo.length).toBeGreaterThan(0);
    expect(conteudo.quiz?.length ?? 0).toBeGreaterThan(0);
    expect(conteudo.mapaFichamento).toBeDefined();
    expect(conteudo.mnemonicos).toBeDefined();
    expect(conteudo.peticao).toBeUndefined();
  });

  it('no menu, a AV3 tem dois itens diretos, cada um com o seu tópico', () => {
    const av = itensDaCadeira(filosofia).find((item) => item.tipo === 'av');
    expect(av?.tipo === 'av' ? av.grupos.map((g) => [g.id, g.rotulo, g.direto]) : []).toEqual([
      ['moderna', 'Moderna e Contemporânea', true],
      ['decisao', 'Perspectiva racial e o não-dito', true]
    ]);
    expect(av?.tipo === 'av' ? av.grupos.map((g) => g.topicos.map((t) => t.id)) : []).toEqual([
      ['u3-moderna-contemporanea'],
      ['u3-decisao-perspectiva-racial']
    ]);
  });
});
