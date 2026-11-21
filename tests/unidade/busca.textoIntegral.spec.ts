import { describe, expect, it } from 'vitest';
import { montarDocumentosTextoIntegral } from '@/core/busca/montarIndice';
import type { TextoIntegral } from '@/core/textoIntegral/tipos';

/** Texto sintético: nenhum trecho real de src/conteudo entra em teste commitado. */
const texto: TextoIntegral = {
  titulo: 'Capítulo de teste',
  fonte: 'Fonte sintética',
  blocos: [
    { tipo: 'paragrafo', trechos: [{ tipo: 'texto', texto: 'Abertura do capítulo. ' }] },
    { tipo: 'subtitulo', texto: 'Norma fundamental' },
    {
      tipo: 'paragrafo',
      trechos: [
        { tipo: 'pagina', numero: 17 },
        { tipo: 'texto', texto: 'Hipótese jurídica sem nome próprio. ' },
        { tipo: 'italico', texto: 'Grundnorm' }
      ]
    },
    { tipo: 'subtitulo', texto: 'Textura aberta' },
    { tipo: 'paragrafo', trechos: [{ tipo: 'texto', texto: 'Palavra exclusiva zabelê.' }] }
  ]
};

function params(sobrescrito: Partial<Parameters<typeof montarDocumentosTextoIntegral>[0]> = {}) {
  return {
    periodo: 'p1',
    cadeira: 'cad-teste',
    unidade: 'u3-teste',
    cadeiraRestrita: false,
    unidadePublicada: true,
    texto,
    ...sobrescrito
  };
}

describe('montarDocumentosTextoIntegral: índice separado do texto integral', () => {
  it('gera um documento por seção (subtítulo), na aba texto, com a rota /texto', () => {
    const documentos = montarDocumentosTextoIntegral(params());

    expect(documentos.map((d) => d.id)).toEqual([
      'p1/cad-teste/u3-teste/texto#secao-0',
      'p1/cad-teste/u3-teste/texto#secao-1',
      'p1/cad-teste/u3-teste/texto#secao-2'
    ]);
    expect(new Set(documentos.map((d) => d.aba))).toEqual(new Set(['texto']));
    expect(new Set(documentos.map((d) => d.url))).toEqual(
      new Set(['/p/p1/cad-teste/u3-teste/texto'])
    );
  });

  it('o texto antes do primeiro subtítulo fica sob o título do capítulo', () => {
    const [primeira] = montarDocumentosTextoIntegral(params());

    expect(primeira?.titulo).toBe('Capítulo de teste');
    expect(primeira?.corpo).toContain('Abertura do capítulo');
  });

  it('inclui o trecho em itálico e nunca o marcador de página', () => {
    const documentos = montarDocumentosTextoIntegral(params());
    const normaFundamental = documentos.find((d) => d.titulo === 'Norma fundamental');

    expect(normaFundamental?.corpo).toContain('Grundnorm');
    expect(normaFundamental?.corpo).toContain('Hipótese jurídica');
    expect(normaFundamental?.corpo).not.toMatch(/17/);
  });

  it('a palavra exclusiva do texto integral vira termo de busca do seu documento', () => {
    const documentos = montarDocumentosTextoIntegral(params());

    expect(documentos.find((d) => d.corpo.includes('zabelê'))?.titulo).toBe('Textura aberta');
  });

  it('o trecho do cartão de resultado tem no máximo 200 caracteres', () => {
    const longo = 'x'.repeat(500);
    const documentos = montarDocumentosTextoIntegral(
      params({
        texto: {
          titulo: 'T',
          fonte: 'F',
          blocos: [{ tipo: 'paragrafo', trechos: [{ tipo: 'texto', texto: longo }] }]
        }
      })
    );

    expect(documentos[0]?.trecho.length).toBeLessThanOrEqual(200);
  });

  it('cadeira restrita nunca gera documento, nem por engano de quem chama', () => {
    expect(montarDocumentosTextoIntegral(params({ cadeiraRestrita: true }))).toEqual([]);
  });

  it('unidade que não está publicada nunca gera documento', () => {
    expect(montarDocumentosTextoIntegral(params({ unidadePublicada: false }))).toEqual([]);
  });

  it('unidade sem texto integral não gera documento', () => {
    expect(montarDocumentosTextoIntegral(params({ texto: undefined }))).toEqual([]);
  });
});
