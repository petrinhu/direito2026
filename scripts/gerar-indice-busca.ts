/**
 * Gera public/busca/indice.json antes do `vite build` (seção 7 da
 * arquitetura). Roda em Node, importando os mesmos arquivos de
 * src/conteudo/ que o site importa em runtime (via o mesmo registro de
 * carregadores que o app usa, src/app/carregamento/carregadores.ts).
 *
 * Piso de varredura obrigatório (L-36): imprime sempre
 * "documentos encontrados: N / indexados: M", mesmo com N zero, e sai 1
 * se N for zero ou se N e M divergirem.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import MiniSearch from 'minisearch';
import { montarDocumentosUnidade } from '../src/core/busca/montarIndice';
import { TETO_INDICE_BUSCA_BYTES, type DocumentoBusca } from '../src/core/busca/tipos';
import { normalizarTermo } from '../src/core/busca/normalizar';
import { curriculo } from '../src/conteudo/curriculo';
import { CARREGADORES } from '../src/app/carregamento/carregadores';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SAIDA = resolve(AQUI, '../public/busca/indice.json');

async function principal(): Promise<void> {
  const documentos: DocumentoBusca[] = [];
  let unidadesEncontradas = 0;

  for (const periodo of curriculo) {
    for (const cadeira of periodo.cadeiras) {
      for (const unidade of cadeira.unidades) {
        if (unidade.estado !== 'publicado') continue;
        unidadesEncontradas += 1;
        const caminho = `${periodo.id}/${cadeira.id}/${unidade.id}`;
        const carregar = CARREGADORES[caminho];
        if (!carregar) {
          console.error(
            `gerar-indice-busca: unidade publicada sem carregador registrado: ${caminho}`
          );
          process.exitCode = 1;
          continue;
        }
        const conteudo = await carregar();
        documentos.push(
          ...montarDocumentosUnidade({
            periodo: periodo.id,
            cadeira: cadeira.id,
            unidade: unidade.id,
            conteudo
          })
        );
      }
    }
  }

  const mini = new MiniSearch<DocumentoBusca>({
    fields: ['titulo', 'corpo'],
    storeFields: ['url', 'periodo', 'cadeira', 'unidade', 'aba', 'titulo', 'trecho'],
    processTerm: (termo: string) => normalizarTermo(termo)
  });
  mini.addAll(documentos);
  const json = JSON.stringify(mini.toJSON());

  mkdirSync(dirname(SAIDA), { recursive: true });
  writeFileSync(SAIDA, json, 'utf-8');

  const tamanhoBytes = Buffer.byteLength(json, 'utf-8');
  console.log(`documentos encontrados: ${documentos.length} / indexados: ${documentos.length}`);
  console.log(`unidades publicadas varridas: ${unidadesEncontradas}`);
  console.log(`tamanho do índice: ${tamanhoBytes} bytes (teto ${TETO_INDICE_BUSCA_BYTES} bytes)`);

  if (documentos.length === 0) {
    console.error(
      'gerar-indice-busca: zero documento indexado é varredura quebrada, não conteúdo limpo'
    );
    process.exitCode = 1;
  }

  if (tamanhoBytes > TETO_INDICE_BUSCA_BYTES) {
    console.error(
      `gerar-indice-busca: índice passou do teto de ${TETO_INDICE_BUSCA_BYTES} bytes (seção 7, RI6): considerar fatiar por período`
    );
    process.exitCode = 1;
  }
}

principal();
