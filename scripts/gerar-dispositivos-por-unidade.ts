/**
 * Gera src/conteudo/<periodo>/<cadeira>/<unidade>/dispositivos.ts: o
 * subconjunto de dispositivos legais que aquela unidade de fato cita
 * (seção 12.5 da arquitetura). Roda antes do `vite build` e antes dos
 * testes que dependem do conteúdo montado.
 *
 * Arquivo GERADO: não é escrito à mão (nem por este agente, nem por quem
 * mantém src/conteudo/), e por isso está no .gitignore
 * (src/conteudo/**\/dispositivos.ts).
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extrairCitacoes } from '../src/core/dispositivos/extrairCitacoes';
import type {
  CatalogoDispositivos,
  DispositivoLegal,
  IndiceDispositivos
} from '../src/core/dispositivos/tipos';
import { curriculo } from '../src/conteudo/curriculo';
import { CARREGADORES } from '../src/app/carregamento/carregadores';

const AQUI = dirname(fileURLToPath(import.meta.url));
const CATALOGO_PATH = resolve(AQUI, '../src/dados/dispositivos-legais.json');

function coletarHtmlDaUnidade(
  conteudo: Awaited<ReturnType<(typeof CARREGADORES)[string]>>
): string {
  const pedacos: string[] = [];
  for (const bloco of conteudo.resumo) {
    pedacos.push(bloco.corpoHtml, bloco.exemploHtml);
  }
  if (conteudo.peticao) {
    for (const secao of conteudo.peticao.secoes) {
      pedacos.push(secao.corpoHtml, secao.comentarioHtml);
    }
  }
  if (conteudo.quiz) {
    for (const pergunta of conteudo.quiz) {
      pedacos.push(pergunta.explicacao);
    }
  }
  return pedacos.join(' ');
}

async function principal(): Promise<void> {
  const catalogo = JSON.parse(readFileSync(CATALOGO_PATH, 'utf-8')) as CatalogoDispositivos;
  const catalogoPorId: IndiceDispositivos = Object.fromEntries(catalogo.map((d) => [d.id, d]));

  let citacoesEncontradas = 0;
  let citacoesResolvidas = 0;
  let unidadesGeradas = 0;

  for (const periodo of curriculo) {
    for (const cadeira of periodo.cadeiras) {
      for (const unidade of cadeira.unidades) {
        if (unidade.estado !== 'publicado') continue;
        const caminho = `${periodo.id}/${cadeira.id}/${unidade.id}`;
        const carregar = CARREGADORES[caminho];
        if (!carregar) continue;

        const conteudo = await carregar();
        const html = coletarHtmlDaUnidade(conteudo);
        const ids = extrairCitacoes(html);
        citacoesEncontradas += ids.length;

        const subconjunto: Record<string, DispositivoLegal> = {};
        for (const id of ids) {
          const dispositivo = catalogoPorId[id];
          if (!dispositivo) {
            console.error(`gerar-dispositivos-por-unidade: citação órfã '${id}' em ${caminho}`);
            process.exitCode = 1;
            continue;
          }
          subconjunto[id] = dispositivo;
          citacoesResolvidas += 1;
        }

        const destino = resolve(AQUI, `../src/conteudo/${caminho}/dispositivos.ts`);
        const conteudoArquivo = `// Arquivo GERADO por scripts/gerar-dispositivos-por-unidade.ts. Não editar à mão.
import type { IndiceDispositivos } from '../../../../core/dispositivos/tipos';

export const dispositivos: IndiceDispositivos = ${JSON.stringify(subconjunto, null, 2)};
`;
        writeFileSync(destino, conteudoArquivo, 'utf-8');
        unidadesGeradas += 1;
      }
    }
  }

  console.log(`citações encontradas: ${citacoesEncontradas} / resolvidas: ${citacoesResolvidas}`);
  console.log(`unidades com subconjunto gerado: ${unidadesGeradas}`);

  if (citacoesEncontradas === 0) {
    console.error(
      'gerar-dispositivos-por-unidade: zero citação no site inteiro é varredura quebrada'
    );
    process.exitCode = 1;
  }
  if (citacoesEncontradas !== citacoesResolvidas) {
    process.exitCode = 1;
  }
}

principal();
