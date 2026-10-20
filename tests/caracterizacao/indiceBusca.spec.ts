import { describe, expect, it } from 'vitest';
import { curriculo } from '@/conteudo/curriculo';
import { CARREGADORES } from '@/app/carregamento/carregadores';
import esperado from './indiceBusca.esperado.json';
import { montarDocumentosComoBuild, ordenarIdsUrls } from './projecoes';

/**
 * Caracterização dos documentos do índice de busca (scripts/gerar-indice-
 * busca.ts). O script só monta o índice dentro do build e não exporta a
 * montagem; este teste espelha o laço da montagem e NÃO escreve arquivo
 * algum (public/assets/busca-indice.json fica para o build).
 *
 * Congela a contagem de documentos e a lista ordenada de id e url. Não
 * congela o texto de cada documento (isso muda com a aula). Limite
 * conhecido: a saída do próprio script ("documentos encontrados: N") é
 * conferida à mão na geração da referência, não por este teste.
 */
describe('índice de busca: documentos congelados', () => {
  it('monta documentos (piso contra varredura vazia)', async () => {
    const documentos = await montarDocumentosComoBuild(curriculo, CARREGADORES);
    expect(documentos.length).toBeGreaterThan(0);
  });

  it('a contagem de documentos é a da referência', async () => {
    const documentos = await montarDocumentosComoBuild(curriculo, CARREGADORES);
    expect(documentos.length).toBe(esperado.documentosEncontrados);
  });

  it('a lista ordenada de id e url é a da referência', async () => {
    const documentos = await montarDocumentosComoBuild(curriculo, CARREGADORES);
    expect(ordenarIdsUrls(documentos)).toEqual(esperado.documentos);
  });
});
