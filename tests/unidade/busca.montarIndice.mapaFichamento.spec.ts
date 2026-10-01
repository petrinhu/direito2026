import { describe, expect, it } from 'vitest';
import { montarDocumentosUnidade } from '@/core/busca/montarIndice';
import type { ConteudoUnidade } from '@/core/unidade/tipos';
import type { Mnemonico } from '@/core/mnemonicos/tipos';
import { DADOS_SINTETICOS } from './apoio/dadosFichamento';

const mnemonico: Mnemonico = {
  id: 'm1',
  titulo: 'Quem é quem',
  tecnica: 'frase',
  dica: 'Alfa adoça e Beta salga.',
  desafio: 'Diga o que cada um faz.',
  guarda: [{ termo: 'Alfa', explicacao: 'açúcar' }],
  comoFunciona: 'Um verbo por pensador.',
  blocoResumo: 'bloco-0'
};

const conteudo: ConteudoUnidade = {
  meta: { titulo: 'T', subtitulo: 's', descricao: 'd' },
  resumo: [],
  mapaFichamento: DADOS_SINTETICOS,
  mnemonicos: [mnemonico]
};

const docs = montarDocumentosUnidade({ periodo: 'p1', cadeira: 'c', unidade: 'u1', conteudo });

describe('índice de busca com mapa, fichamento e mnemônicos', () => {
  it('gera um documento por ficha, apontando para a âncora da ficha', () => {
    const fichas = docs.filter((d) => d.aba === 'fichamento');
    expect(fichas).toHaveLength(3);
    expect(fichas[0]!.url).toBe('/p/p1/c/u1/fichamento#ficha-alfa');
    expect(fichas[0]!.id).toBe('p1/c/u1/fichamento#ficha-alfa');
    expect(fichas[0]!.titulo).toBe('Alfa');
    expect(fichas[0]!.corpo).toContain('açúcar');
    expect(fichas[0]!.corpo).toContain('Obra A');
  });

  it('gera um documento do mapa mental, com os nomes dos pensadores', () => {
    const mapa = docs.filter((d) => d.aba === 'mapa');
    expect(mapa).toHaveLength(1);
    expect(mapa[0]!.url).toBe('/p/p1/c/u1/mapa');
    expect(mapa[0]!.corpo).toContain('Alfa');
    expect(mapa[0]!.corpo).toContain('Fase três');
  });

  it('gera um documento por mnemônico', () => {
    const mn = docs.filter((d) => d.aba === 'mnemonicos');
    expect(mn).toHaveLength(1);
    expect(mn[0]!.url).toBe('/p/p1/c/u1/mnemonicos#mnemonico-m1');
    expect(mn[0]!.corpo).toContain('Alfa adoça');
  });

  it('não escreve a palavra "undefined" no corpo de ficha sem citação, sem datas e sem ressalva', () => {
    const beta = docs.find((d) => d.id.endsWith('ficha-beta'))!;
    expect(beta.corpo).not.toContain('undefined');
  });
});
