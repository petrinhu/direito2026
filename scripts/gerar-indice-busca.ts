/**
 * Gera public/assets/busca-indice.json antes do `vite build` (seção 7 da
 * arquitetura). Roda em Node, importando os mesmos arquivos de
 * src/conteudo/ que o site importa em runtime (via o mesmo registro de
 * carregadores que o app usa, src/app/carregamento/carregadores.ts).
 *
 * Achado do líder, 22/09/2026, medido no site publicado: o destino
 * anterior, public/busca/indice.json, virava dist/busca/ no pacote, e essa
 * PASTA colidia com a ROTA /busca da SPA. No Apache, quando existe
 * diretório com o mesmo nome do caminho pedido, ele redireciona para
 * .../busca/ (301) e, como listagem é proibida, devolve 403. Por isso o
 * destino agora é um arquivo de nome único dentro de assets/ (a mesma
 * pasta dos chunks JS/CSS com hash, que nunca é nome de rota da
 * aplicação): nenhuma rota pode colidir com pasta nenhuma do pacote
 * (portão: scripts/verificar-colisao-rotas.sh).
 *
 * O texto integral (EP-F11-BUSCA-TETO) sai num segundo arquivo, à parte:
 * o principal fica com o que já tinha, e o do texto só desce sob demanda
 * (src/app/stores/busca.ts). Juntar os dois faria todo aluno baixar o
 * texto da lei a cada visita.
 *
 * Piso de varredura obrigatório (L-36): imprime sempre
 * "documentos encontrados: N / indexados: M", mesmo com N zero, e sai 1
 * se N for zero ou se N e M divergirem.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import MiniSearch from 'minisearch';
import {
  montarDocumentosCadeirasRestritas,
  montarDocumentosTextoIntegral,
  montarDocumentosUnidade
} from '../src/core/busca/montarIndice';
import {
  ARQUIVO_INDICE_TEXTO_INTEGRAL,
  TETO_INDICE_BUSCA_BYTES,
  type DocumentoBusca
} from '../src/core/busca/tipos';
import { normalizarTermo } from '../src/core/busca/normalizar';
import { validarIndiceGerado } from '../src/core/busca/validarIndice';
import { carregadoresDoDisco, curriculoDoDisco } from './apoio/conteudoDoDisco';
import { medirTamanhoComprimido } from './apoio/medirIndiceComprimido';

const CARREGADORES = carregadoresDoDisco();

const AQUI = dirname(fileURLToPath(import.meta.url));
const SAIDA = resolve(AQUI, '../public/assets/busca-indice.json');
const SAIDA_TEXTO = resolve(AQUI, '../public/assets/' + ARQUIVO_INDICE_TEXTO_INTEGRAL);

function serializar(documentos: readonly DocumentoBusca[]): string {
  const mini = new MiniSearch<DocumentoBusca>({
    fields: ['titulo', 'corpo'],
    storeFields: ['url', 'periodo', 'cadeira', 'unidade', 'aba', 'titulo', 'trecho'],
    processTerm: (termo: string) => normalizarTermo(termo)
  });
  mini.addAll(documentos as DocumentoBusca[]);
  return JSON.stringify(mini.toJSON());
}

async function principal(): Promise<void> {
  const curriculo = await curriculoDoDisco();
  const documentos: DocumentoBusca[] = [];
  const documentosTexto: DocumentoBusca[] = [];
  let unidadesEncontradas = 0;
  let unidadesComTexto = 0;

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
        if (conteudo.textoIntegral) unidadesComTexto += 1;
        documentosTexto.push(
          ...montarDocumentosTextoIntegral({
            periodo: periodo.id,
            cadeira: cadeira.id,
            unidade: unidade.id,
            cadeiraRestrita: cadeira.restrita === true,
            unidadePublicada: unidade.estado === 'publicado',
            texto: conteudo.textoIntegral
          })
        );
      }
    }
  }

  documentos.push(...montarDocumentosCadeirasRestritas(curriculo));

  const json = serializar(documentos);
  mkdirSync(dirname(SAIDA), { recursive: true });
  writeFileSync(SAIDA, json, 'utf-8');

  const tamanhoBrutoBytes = Buffer.byteLength(json, 'utf-8');
  // O teto da RI6 é sobre o tamanho comprimido (gzip -9), não o bruto.
  const tamanhoComprimidoBytes = medirTamanhoComprimido(json);
  console.log(`documentos encontrados: ${documentos.length} / indexados: ${documentos.length}`);
  console.log(`unidades publicadas varridas: ${unidadesEncontradas}`);
  console.log(`tamanho bruto do índice: ${tamanhoBrutoBytes} bytes`);
  console.log(
    `tamanho comprimido do índice (gzip -9): ${tamanhoComprimidoBytes} bytes (teto ${TETO_INDICE_BUSCA_BYTES} bytes comprimidos)`
  );

  // Validação extraída para src/core/busca/validarIndice.ts (item 9 da
  // onda): mesma regra de sempre, agora testável de verdade sem precisar
  // rodar este script inteiro (tests/unidade/busca.validarIndice.spec.ts).
  const validacao = validarIndiceGerado(documentos.length, tamanhoComprimidoBytes);
  if (!validacao.ok) {
    for (const mensagem of validacao.mensagens) {
      console.error(`gerar-indice-busca: ${mensagem}`);
    }
    process.exitCode = 1;
  }

  // Índice do texto integral (EP-F11-BUSCA-TETO): mesmo teto e mesmo piso,
  // porque é baixado por aluno e tem de caber no mesmo orçamento de rede.
  const jsonTexto = serializar(documentosTexto);
  writeFileSync(SAIDA_TEXTO, jsonTexto, 'utf-8');
  const tamanhoTextoBruto = Buffer.byteLength(jsonTexto, 'utf-8');
  const tamanhoTextoComprimido = medirTamanhoComprimido(jsonTexto);
  console.log(`texto integral: unidades com texto: ${unidadesComTexto}`);
  console.log(`texto integral: documentos indexados: ${documentosTexto.length}`);
  console.log(`texto integral: tamanho bruto do índice: ${tamanhoTextoBruto} bytes`);
  console.log(
    `texto integral: tamanho comprimido do índice (gzip -9): ${tamanhoTextoComprimido} bytes (teto ${TETO_INDICE_BUSCA_BYTES} bytes comprimidos)`
  );
  const validacaoTexto = validarIndiceGerado(documentosTexto.length, tamanhoTextoComprimido);
  if (!validacaoTexto.ok) {
    for (const mensagem of validacaoTexto.mensagens) {
      console.error(`gerar-indice-busca (texto integral): ${mensagem}`);
    }
    process.exitCode = 1;
  }
}

principal();
