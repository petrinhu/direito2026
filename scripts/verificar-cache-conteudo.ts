/**
 * Portão pós-build da regra de cache dos pedaços de conteúdo (service worker,
 * regra "conteudo-unidades" em opcoesWorkbox.runtimeCaching). A regex vem da
 * própria configuração, não é copiada aqui: se alguém mudar o nome do pedaço ou
 * a regex, este portão é quem percebe.
 *
 * Prova, sobre os arquivos REAIS de dist/assets:
 * - encontrados: .js cujo nome leva o prefixo de conteúdo (conteudo-);
 * - casados: .js que a regex da regra casa;
 * - reprova se casados = 0, se encontrados = 0, ou se algum encontrado não casar.
 *
 * DIST_PATH (opcional) aponta para outra pasta de build, para provar o vermelho
 * numa cópia (L-36, L-27).
 */
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { opcoesWorkbox, PREFIXO_PEDACO_CONTEUDO } from '../vite.config';

const AQUI = dirname(fileURLToPath(import.meta.url));
const DIST = process.env.DIST_PATH ? resolve(process.env.DIST_PATH) : resolve(AQUI, '../dist');
const PASTA_ASSETS = join(DIST, 'assets');
const NOME_DA_REGRA = 'conteudo-unidades';

interface RegraDeCache {
  readonly urlPattern: unknown;
  readonly options?: { readonly cacheName?: string };
}

function regexDaRegra(): RegExp {
  const regras = opcoesWorkbox.runtimeCaching as unknown as RegraDeCache[];
  const regra = regras.find((r) => r.options?.cacheName === NOME_DA_REGRA);
  if (!regra) throw new Error(`regra ${NOME_DA_REGRA} ausente em opcoesWorkbox.runtimeCaching`);
  if (!(regra.urlPattern instanceof RegExp)) {
    throw new Error(`regra ${NOME_DA_REGRA} não usa RegExp: não dá para provar que casa`);
  }
  return regra.urlPattern;
}

function casa(regex: RegExp, nomeDoArquivo: string): boolean {
  const url = new URL(`https://exemplo.test/assets/${nomeDoArquivo}`);
  return regex.test(url.href);
}

function principal(): number {
  let regex: RegExp;
  try {
    regex = regexDaRegra();
  } catch (erro) {
    console.error(
      `verificar-cache-conteudo: ${erro instanceof Error ? erro.message : String(erro)}`
    );
    return 1;
  }
  if (!existsSync(PASTA_ASSETS)) {
    console.error(`verificar-cache-conteudo: ${PASTA_ASSETS} ausente (rode o build antes)`);
    console.log('js analisados=0 encontrados=0 casados=0');
    return 1;
  }

  const js = readdirSync(PASTA_ASSETS).filter((nome) => nome.endsWith('.js'));
  const encontrados = js.filter((nome) => nome.startsWith(PREFIXO_PEDACO_CONTEUDO));
  const casados = js.filter((nome) => casa(regex, nome));
  const naoCasados = encontrados.filter((nome) => !casa(regex, nome));

  console.log(
    `js analisados=${js.length} encontrados=${encontrados.length} casados=${casados.length}`
  );
  if (encontrados.length === 0) {
    console.error(`verificar-cache-conteudo: nenhum ${PREFIXO_PEDACO_CONTEUDO}*.js em dist/assets`);
  }
  if (casados.length === 0) {
    console.error('verificar-cache-conteudo: a regex da regra não casa nenhum arquivo do build');
  }
  for (const nome of naoCasados) {
    console.error(`verificar-cache-conteudo: ${nome} tem o prefixo mas a regex não casa`);
  }
  const passou = encontrados.length > 0 && casados.length > 0 && naoCasados.length === 0;
  return passou ? 0 : 1;
}

process.exitCode = principal();
