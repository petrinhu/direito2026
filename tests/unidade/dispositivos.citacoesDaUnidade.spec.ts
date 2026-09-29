import { describe, expect, it } from 'vitest';
import {
  coletarHtmlDaUnidade,
  resolverCitacoesDaUnidade,
  conteudoArquivoDispositivos
} from '@/core/dispositivos/citacoesDaUnidade';
import type { DispositivoLegal, IndiceDispositivos } from '@/core/dispositivos/tipos';
import type { ConteudoUnidade } from '@/core/unidade/tipos';

const CC186: DispositivoLegal = {
  id: 'cc-186',
  diploma: 'Código Civil',
  diplomaSigla: 'CC',
  artigo: '186',
  texto: 'Aquele que...',
  urlFonte: 'https://exemplo.gov.br',
  dataConsulta: '2026-09-22'
};
const CATALOGO: IndiceDispositivos = { 'cc-186': CC186 };

function bloco(corpoHtml: string, exemploHtml = ''): ConteudoUnidade['resumo'][number] {
  return { id: 'b', numero: 1, titulo: 't', fonte: 'f', corpoHtml, resumo: [], exemploHtml };
}

function unidadeSemCitacao(): ConteudoUnidade {
  return {
    meta: { titulo: 't', subtitulo: 's', descricao: 'd' },
    resumo: [bloco('<p>Sociologia pura, sem artigo de lei.</p>', '<p>exemplo</p>')],
    quiz: [
      {
        id: 1,
        categoria: 'conceitos',
        enunciadoHtml: 'e',
        alternativasHtml: ['a', 'b', 'c', 'd', 'e'],
        correta: 0,
        fonteExtra: false,
        explicacaoHtml: 'x'
      }
    ]
  };
}

describe('unidade sem nenhuma citação de dispositivo legal', () => {
  it('não acha citação, não gera órfã e o subconjunto sai vazio', () => {
    const r = resolverCitacoesDaUnidade(unidadeSemCitacao(), CATALOGO);
    expect(r.encontradas).toEqual([]);
    expect(r.orfas).toEqual([]);
    expect(r.subconjunto).toEqual({});
  });

  it('o arquivo gerado para o subconjunto vazio é um módulo válido com objeto vazio', () => {
    const texto = conteudoArquivoDispositivos({});
    expect(texto).toContain('export const dispositivos: IndiceDispositivos = {};');
    expect(texto).toContain('GERADO');
  });
});

describe('resolverCitacoesDaUnidade, o que continua reprovando', () => {
  it('citação que não existe no catálogo aparece como órfã, mesmo em unidade com resolvidas', () => {
    const conteudo: ConteudoUnidade = {
      ...unidadeSemCitacao(),
      resumo: [
        bloco(
          '<button data-dispositivo="cc-186">art. 186</button> <button data-dispositivo="cc-999">art. 999</button>'
        )
      ]
    };
    const r = resolverCitacoesDaUnidade(conteudo, CATALOGO);
    expect([...r.encontradas].sort()).toEqual(['cc-186', 'cc-999']);
    expect(r.orfas).toEqual(['cc-999']);
    expect(Object.keys(r.subconjunto)).toEqual(['cc-186']);
  });

  it('enxerga citação que só existe em enunciado, alternativa ou explicação do quiz', () => {
    const base = unidadeSemCitacao();
    const p = base.quiz![0]!;
    const conteudo: ConteudoUnidade = {
      ...base,
      quiz: [
        {
          ...p,
          enunciadoHtml: '<button data-dispositivo="cc-186">a</button>',
          alternativasHtml: ['a', 'b', 'c', 'd', '<button data-dispositivo="cc-999">x</button>']
        }
      ]
    };
    expect([...resolverCitacoesDaUnidade(conteudo, CATALOGO).encontradas].sort()).toEqual([
      'cc-186',
      'cc-999'
    ]);
  });
});

describe('coletarHtmlDaUnidade', () => {
  it('junta resumo, seção de peça sem corpo e quiz', () => {
    const conteudo: ConteudoUnidade = {
      ...unidadeSemCitacao(),
      peticao: {
        titulo: 'p',
        notaHtml: 'n',
        secoes: [{ id: 's', titulo: 't', comentarioHtml: 'COMENTARIO' }]
      }
    };
    const html = coletarHtmlDaUnidade(conteudo);
    expect(html).toContain('Sociologia pura');
    expect(html).toContain('COMENTARIO');
    expect(html).not.toContain('undefined');
  });
});
