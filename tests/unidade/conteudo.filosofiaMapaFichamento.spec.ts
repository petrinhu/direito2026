import { describe, expect, it } from 'vitest';
import { mapaFichamento } from '@/conteudo/p1/filosofia-juridica/u1/mapaFichamento';
import { mnemonicos } from '@/conteudo/p1/filosofia-juridica/u1/mnemonicos';
import { resumo } from '@/conteudo/p1/filosofia-juridica/u1/resumo';
import { construirArvoreMapa } from '@/core/fichamento/arvoreMapa';
import { ROTULOS_TECNICA } from '@/core/mnemonicos/rotulosTecnica';

const idsDoResumo = new Set(resumo.map((b) => b.id));
const TRAVESSAO = /[–—]/;

function textoDe(valor: unknown): string {
  return JSON.stringify(valor);
}

describe('mapa e fichamento de Filosofia Jurídica: estrutura', () => {
  it('a raiz do mapa nomeia a unidade', () => {
    expect(mapaFichamento.titulo).toContain('Filosofia Jurídica');
  });

  it('as eras são Idade Antiga e Idade Média, nessa ordem, cada uma com fases', () => {
    expect(mapaFichamento.eras.map((e) => e.nome)).toEqual(['Idade Antiga', 'Idade Média']);
    for (const era of mapaFichamento.eras) expect(era.fases.length, era.id).toBeGreaterThan(0);
  });

  it('ids de era, fase e pensador são únicos', () => {
    for (const lista of [
      mapaFichamento.eras.map((e) => e.id),
      mapaFichamento.eras.flatMap((e) => e.fases.map((f) => f.id)),
      mapaFichamento.pensadores.map((p) => p.id)
    ]) {
      expect(new Set(lista).size).toBe(lista.length);
    }
  });

  it('toda fase tem ao menos um pensador, e todo pensador aponta para fase existente', () => {
    const fases = mapaFichamento.eras.flatMap((e) => e.fases.map((f) => f.id));
    for (const fase of fases) {
      expect(
        mapaFichamento.pensadores.some((p) => p.faseId === fase),
        fase
      ).toBe(true);
    }
    for (const p of mapaFichamento.pensadores) expect(fases, p.id).toContain(p.faseId);
  });

  it('a árvore do mapa se constrói sem erro', () => {
    expect(() => construirArvoreMapa(mapaFichamento)).not.toThrow();
  });

  it('cobre os pensadores e correntes que o resumo desenvolve', () => {
    const nomes = mapaFichamento.pensadores.map((p) => p.nome).join(' | ');
    for (const nome of [
      'Sófocles',
      'sofistas',
      'Sócrates',
      'Platão',
      'Aristóteles',
      'Epicuro',
      'estoicos',
      'Cícero',
      'Agostinho',
      'Tomás de Aquino',
      'Escoto',
      'Ockham'
    ]) {
      expect(nomes.toLowerCase(), nome).toContain(nome.toLowerCase());
    }
  });

  it('a Idade Antiga vem antes da Média na ordem das fichas', () => {
    const faseAntiga = new Set(mapaFichamento.eras[0]!.fases.map((f) => f.id));
    const posicoes = mapaFichamento.pensadores.map((p) => faseAntiga.has(p.faseId));
    expect(posicoes).toEqual([...posicoes].sort((a, b) => Number(b) - Number(a)));
  });
});

describe('mapa e fichamento de Filosofia Jurídica: cada ficha', () => {
  it.each(mapaFichamento.pensadores.map((p) => [p.id, p] as const))('%s está completa', (_id, p) => {
    expect(p.nome.trim()).not.toBe('');
    expect(p.modoDePensar.trim()).not.toBe('');
    expect(p.paraODireito.trim()).not.toBe('');
    expect(p.conceitos.length).toBeGreaterThan(0);
    expect(p.referencias.length).toBeGreaterThan(0);
    expect(idsDoResumo.has(p.blocoResumo), `${p.id}: ${p.blocoResumo}`).toBe(true);
  });

  it('citação literal só existe com fonte', () => {
    const comCitacao = mapaFichamento.pensadores.filter((p) => p.citacao);
    expect(comCitacao.length).toBeGreaterThan(0);
    for (const p of comCitacao) {
      expect(p.citacao!.texto.trim(), p.id).not.toBe('');
      expect(p.citacao!.fonte.trim(), p.id).not.toBe('');
    }
  });

  it('datas seguem as aulas onde os livros divergem (Platão e Tomás)', () => {
    const datas = (id: string) => mapaFichamento.pensadores.find((p) => p.id === id)!.datas;
    expect(datas('platao')).toBe('427-348 a.C.');
    expect(datas('tomas-de-aquino')).toBe('1225-1274');
  });

  it('a divergência sobre Tomás vem atribuída aos dois autores, sem dizer que alguém errou', () => {
    const tomas = mapaFichamento.pensadores.find((p) => p.id === 'tomas-de-aquino')!;
    expect(tomas.ressalva).toContain('Wolkmer');
    expect(tomas.ressalva).toContain('Manual de Humanística');
    expect(tomas.ressalva!.toLowerCase()).not.toMatch(/errou|erro |equivoc/);
  });

  it('nenhum texto tem travessão nem meia-risca', () => {
    expect(textoDe(mapaFichamento)).not.toMatch(TRAVESSAO);
  });

  it('nenhum texto cita instituição ou pessoa da turma', () => {
    expect(textoDe(mapaFichamento).toLowerCase()).not.toMatch(/professor|professora|colega|instituicao/);
  });
});

describe('mnemônicos de Filosofia Jurídica', () => {
  it('há mnemônicos, com id único e técnica conhecida', () => {
    expect(mnemonicos.length).toBeGreaterThanOrEqual(8);
    expect(new Set(mnemonicos.map((m) => m.id)).size).toBe(mnemonicos.length);
    for (const m of mnemonicos) expect(Object.keys(ROTULOS_TECNICA), m.id).toContain(m.tecnica);
  });

  it('todo id é slug ASCII, porque vira âncora de URL e id de elemento', () => {
    for (const id of [...mnemonicos.map((m) => m.id), ...mapaFichamento.pensadores.map((p) => p.id)]) {
      expect(id, id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('usa pelo menos quatro técnicas diferentes', () => {
    expect(new Set(mnemonicos.map((m) => m.tecnica)).size).toBeGreaterThanOrEqual(4);
  });

  it.each(mnemonicos.map((m) => [m.id, m] as const))('%s está completo e remete ao resumo', (_id, m) => {
    for (const campo of [m.titulo, m.dica, m.desafio, m.comoFunciona]) {
      expect(campo.trim()).not.toBe('');
    }
    expect(m.guarda.length).toBeGreaterThanOrEqual(2);
    for (const item of m.guarda) {
      expect(item.termo.trim()).not.toBe('');
      expect(item.explicacao.trim()).not.toBe('');
    }
    expect(idsDoResumo.has(m.blocoResumo), `${m.id}: ${m.blocoResumo}`).toBe(true);
  });

  it('cobre o que mais se confunde na unidade', () => {
    const titulos = mnemonicos.map((m) => m.titulo).join(' | ').toLowerCase();
    for (const tema of [
      'tomás',
      'comutativa',
      'ius civile',
      'cronológica',
      'platão',
      'protágoras',
      'regimes'
    ]) {
      expect(titulos, tema).toContain(tema);
    }
  });

  it('o das leis de Tomás não afirma "quatro" como consenso: carrega a ressalva dos slides e de Wolkmer', () => {
    const m = mnemonicos.find((x) => x.id === 'leis-de-tomas')!;
    expect(m.ressalva).toBeDefined();
    expect(m.ressalva!.toLowerCase()).toContain('três');
    expect(m.ressalva).toContain('Wolkmer');
    expect(m.guarda.map((g) => g.termo)).toEqual([
      'Lei eterna',
      'Lei natural',
      'Lei humana',
      'Lei divina'
    ]);
  });

  it('o da tripartição romana avisa que a classificação do ius gentium é discutida', () => {
    const romana = mnemonicos.find((x) => x.titulo.toLowerCase().includes('ius civile'))!;
    expect(romana.ressalva).toContain('Bobbio');
    expect(romana.ressalva).toContain('Del Vecchio');
  });

  it('o cronológico percorre os dez pensadores na ordem da linha do tempo do resumo', () => {
    const m = mnemonicos.find((x) => x.titulo.toLowerCase().includes('cronológica'))!;
    expect(m.tecnica).toBe('loci');
    expect(m.guarda.map((g) => g.termo)).toEqual([
      'Sófocles',
      'Os sofistas',
      'Sócrates',
      'Platão',
      'Aristóteles',
      'Cícero',
      'Agostinho',
      'Tomás de Aquino',
      'Duns Escoto',
      'Guilherme de Ockham'
    ]);
  });

  it('nenhum texto tem travessão nem meia-risca', () => {
    expect(textoDe(mnemonicos)).not.toMatch(TRAVESSAO);
  });
});
