import { describe, expect, it } from 'vitest';
import {
  converterMarkdown,
  ErroDeConversao,
  formatarArquivoTextoIntegral
} from '../../scripts/apoio/textoIntegral/converterMarkdown';

/**
 * Conversor do markdown do OCR para o TextoIntegral (L-35: vermelho antes).
 * Regra de fidelidade: nenhum caractere do original muda, exceto os marcadores
 * de markdown (# de cabeçalho, * de itálico), o escape \* e o marcador [p. N]
 * (que vira trecho de página).
 */
const FONTE = 'Autor, Obra, 2010.';

function semEspacos(texto: string): string {
  return texto.replace(/\s+/g, '');
}

describe('converterMarkdown: cabeçalhos', () => {
  it('# Título vira titulo, e a fonte vem do argumento', () => {
    const texto = converterMarkdown('# A textura aberta\n\nUm parágrafo.\n', FONTE);
    expect(texto.titulo).toBe('A textura aberta');
    expect(texto.fonte).toBe(FONTE);
  });

  it('## Notas vira subtítulo, na ordem em que aparece entre os parágrafos', () => {
    const texto = converterMarkdown('# T\n\nUm.\n\n## Notas\n\nDois.\n', FONTE);
    expect(texto.blocos).toEqual([
      { tipo: 'paragrafo', trechos: [{ tipo: 'texto', texto: 'Um.' }] },
      { tipo: 'subtitulo', texto: 'Notas' },
      { tipo: 'paragrafo', trechos: [{ tipo: 'texto', texto: 'Dois.' }] }
    ]);
  });

  it('reprova documento sem # de título, nomeando a linha', () => {
    expect(() => converterMarkdown('Um parágrafo.\n', FONTE)).toThrow(ErroDeConversao);
    expect(() => converterMarkdown('Um parágrafo.\n', FONTE)).toThrow(/linha 1/);
  });

  it('reprova ### e qualquer outro cabeçalho, nomeando a linha', () => {
    expect(() => converterMarkdown('# T\n\n### Sub\n\nUm.\n', FONTE)).toThrow(/linha 3/);
  });
});

describe('converterMarkdown: marcador de página', () => {
  it('[p. 139] em linha própria no meio do parágrafo separa dois trechos de texto', () => {
    const texto = converterMarkdown('# T\n\nPrimeira linha\n[p. 139]\nsegunda linha\n', FONTE);
    expect(texto.blocos).toEqual([
      {
        tipo: 'paragrafo',
        trechos: [
          { tipo: 'texto', texto: 'Primeira linha' },
          { tipo: 'pagina', numero: 139 },
          { tipo: 'texto', texto: 'segunda linha' }
        ]
      }
    ]);
  });

  it('[p. 146] sozinho entre linhas em branco vira parágrafo só com o trecho página', () => {
    const texto = converterMarkdown('# T\n\n[p. 146]\n\nTexto.\n', FONTE);
    expect(texto.blocos).toEqual([
      { tipo: 'paragrafo', trechos: [{ tipo: 'pagina', numero: 146 }] },
      { tipo: 'paragrafo', trechos: [{ tipo: 'texto', texto: 'Texto.' }] }
    ]);
  });
});

describe('converterMarkdown: itálico e asterisco', () => {
  it('*termo* vira trecho itálico, e o espaço fora do itálico fica no texto', () => {
    const texto = converterMarkdown('# T\n\nUm *termo* aqui.\n', FONTE);
    expect(texto.blocos).toEqual([
      {
        tipo: 'paragrafo',
        trechos: [
          { tipo: 'texto', texto: 'Um ' },
          { tipo: 'italico', texto: 'termo' },
          { tipo: 'texto', texto: ' aqui.' }
        ]
      }
    ]);
  });

  it('\\* vira asterisco literal no texto, sem itálico', () => {
    const texto = converterMarkdown('# T\n\n(\\*)\n', FONTE);
    expect(texto.blocos).toEqual([
      { tipo: 'paragrafo', trechos: [{ tipo: 'texto', texto: '(*)' }] }
    ]);
  });

  it('«*conveyance*» vira três trechos: aspa, itálico e aspa', () => {
    const texto = converterMarkdown('# T\n\n«*conveyance*»\n', FONTE);
    expect(texto.blocos).toEqual([
      {
        tipo: 'paragrafo',
        trechos: [
          { tipo: 'texto', texto: '«' },
          { tipo: 'italico', texto: 'conveyance' },
          { tipo: 'texto', texto: '»' }
        ]
      }
    ]);
  });

  it('reprova linha com asterisco ímpar, nomeando a linha', () => {
    expect(() => converterMarkdown('# T\n\nUm *aberto.\n', FONTE)).toThrow(/linha 3/);
  });
});

describe('converterMarkdown: erros com número de linha', () => {
  it('reprova documento sem nenhum parágrafo', () => {
    expect(() => converterMarkdown('# T\n\n## Notas\n', FONTE)).toThrow(/parágrafo/);
  });
});

describe('converterMarkdown: nada além dos marcadores muda', () => {
  it('o texto dos blocos, sem espaços, é o markdown sem #, sem *, sem [p. N] e com \\* como *', () => {
    const markdown =
      '# Título do trecho\n\n## Notas\n\nA regra «*conveyance*» é fiel.\n[p. 140]\nSegue o trecho (\\*) aqui.\n\n[p. 141]\n\nÚltimo, com *ênfase*.\n';
    const texto = converterMarkdown(markdown, FONTE);
    const obtido = [
      texto.titulo,
      ...texto.blocos.map((bloco) =>
        bloco.tipo === 'subtitulo'
          ? bloco.texto
          : bloco.trechos.map((trecho) => (trecho.tipo === 'pagina' ? '' : trecho.texto)).join('')
      )
    ].join('');
    const esperado = markdown
      .replace(/^#+ /gm, '')
      .replace(/\[p\. \d+\]/g, '')
      .replace(/\\\*/g, '\uE000')
      .replace(/\*/g, '')
      .replace(/\uE000/g, '*');
    expect(semEspacos(obtido)).toBe(semEspacos(esperado));
  });
});

describe('formatarArquivoTextoIntegral: forma do arquivo gravado', () => {
  it('exporta textoIntegral tipado, com o aviso de geração e o import do tipo', () => {
    const arquivo = formatarArquivoTextoIntegral(converterMarkdown('# T\n\nUm.\n', FONTE));
    expect(arquivo).toContain("import type { TextoIntegral } from '../../../tipos';");
    expect(arquivo).toContain('export const textoIntegral: TextoIntegral = {');
    expect(arquivo).toContain('npm run texto-integral');
    expect(arquivo.endsWith('\n')).toBe(true);
  });
});
