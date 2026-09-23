import { describe, expect, it } from 'vitest';
import { montarDocumentosUnidade } from '@/core/busca/montarIndice';
import type { ConteudoUnidade } from '@/core/unidade/tipos';

/**
 * Mesmo achado de PecaComentadaVisor.secaoSemCorpo.spec.ts, gêmeo aqui
 * (L-17): SecaoPeca.corpoHtml é opcional (seção-título "guarda-chuva",
 * ex.: "2. Do Direito"). Sem tratar isso, a interpolação de template
 * `${secao.corpoHtml}` vira a STRING "undefined" (JS stringifica
 * `undefined` em template literal, TypeScript não acusa erro nenhum
 * aqui porque o tipo do template inteiro já é `string`), e essa palavra
 * entraria de verdade no índice de busca pesquisável.
 */
function conteudoComSecaoSemCorpo(): ConteudoUnidade {
  return {
    meta: { titulo: 't', subtitulo: 's', descricao: 'd' },
    resumo: [],
    peticao: {
      titulo: 'Petição',
      notaHtml: '<p>nota</p>',
      secoes: [
        {
          id: 'do-direito',
          titulo: '2. Do Direito',
          comentarioHtml: '<p>explica o método fato/fundamento/pedido</p>'
        }
      ]
    }
  };
}

describe('montarDocumentosUnidade, seção de peça sem corpo', () => {
  it('não indexa a palavra "undefined" quando a seção não tem corpoHtml', () => {
    const documentos = montarDocumentosUnidade({
      periodo: 'p1',
      cadeira: 'redacao-juridica-1',
      unidade: 'u1',
      conteudo: conteudoComSecaoSemCorpo()
    });
    const documentoSecao = documentos.find(
      (d) => d.id === 'p1/redacao-juridica-1/u1/peticao#do-direito'
    );
    expect(documentoSecao).toBeDefined();
    expect(documentoSecao!.corpo).not.toContain('undefined');
    expect(documentoSecao!.corpo).toContain('explica o método fato/fundamento/pedido');
  });
});
