import { describe, expect, it } from 'vitest';
import { literal, modeloDaCadeira, modeloDaUnidade } from '../../scripts/apoio/novaUnidade/modelos';

const ENTRADA = {
  periodo: 'p1',
  nomeDaCadeira: 'Sociologia Jurídica',
  unidade: 'u4',
  titulo: 'Teorias da ação social',
  peticao: false
};

/** Um teste por propriedade do esqueleto (L-35). Os modelos são texto puro, sem disco. */
describe('modeloDaUnidade: arquivos', () => {
  it('sem --peticao são exatamente os cinco modelos', () => {
    expect(Object.keys(modeloDaUnidade(ENTRADA)).sort()).toEqual([
      'mapaFichamento.ts',
      'meta.ts',
      'mnemonicos.ts',
      'quiz/index.ts',
      'resumo.ts'
    ]);
  });

  it('com --peticao acrescenta peticao.ts', () => {
    expect(Object.keys(modeloDaUnidade({ ...ENTRADA, peticao: true }))).toContain('peticao.ts');
  });

  it('todo modelo traz a fonte genérica nos comentários (regra do líder)', () => {
    for (const conteudo of Object.values(modeloDaUnidade({ ...ENTRADA, peticao: true }))) {
      expect(conteudo).toContain('Material de aula da disciplina.');
    }
  });

  it('nenhum modelo tem travessão (em-dash U+2014 nem en-dash U+2013)', () => {
    for (const conteudo of Object.values(modeloDaUnidade({ ...ENTRADA, peticao: true }))) {
      expect(conteudo).not.toMatch(/[–—]/);
    }
  });
});

describe('modeloDaUnidade: meta.ts', () => {
  const meta = modeloDaUnidade(ENTRADA)['meta.ts'] ?? '';

  it('nasce em-breve, com rótulo "Unidade N" e título do argumento', () => {
    expect(meta).toContain("estado: 'em-breve'");
    expect(meta).toContain("rotulo: 'Unidade 4'");
    expect(meta).toContain("titulo: 'Teorias da ação social'");
  });

  it('subtítulo segue o padrão das unidades existentes', () => {
    expect(meta).toContain("subtitulo: 'Sociologia Jurídica · Unidade 4 · faculdade · 1º período'");
  });

  it('exporta meta do tipo MetaUnidade', () => {
    expect(meta).toContain('export const meta: MetaUnidade');
  });
});

describe('modeloDaUnidade: exports que o carregador lê', () => {
  const arquivos = modeloDaUnidade({ ...ENTRADA, peticao: true });

  it.each([
    ['resumo.ts', 'export const resumo'],
    ['mapaFichamento.ts', 'export const mapaFichamento'],
    ['mnemonicos.ts', 'export const mnemonicos'],
    ['quiz/index.ts', 'export const quiz'],
    ['peticao.ts', 'export const peticao']
  ])('%s exporta o nome esperado', (arquivo, export_) => {
    expect(arquivos[arquivo]).toContain(export_);
  });
});

describe('modeloDaCadeira', () => {
  it('nasce em-breve, com a ordem dada e sem atalho nem restrição', () => {
    const texto = modeloDaCadeira({ periodo: 'p1', nome: 'Sociologia Jurídica', ordem: 6 });
    expect(texto).toContain("estado: 'em-breve'");
    expect(texto).toContain('ordem: 6');
    expect(texto).toContain("nome: 'Sociologia Jurídica'");
    expect(texto).not.toContain('restrita');
    expect(texto).not.toContain('atalhoUnidade');
  });
});

describe('literal', () => {
  it('escapa apóstrofo e barra para que o nome vire um literal válido', () => {
    expect(literal("Direito d'Água")).toBe("'Direito d\\'Água'");
    expect(literal('a\\b')).toBe("'a\\\\b'");
  });
});
