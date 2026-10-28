/**
 * Gêmeo do portão de vazamento do Interdisciplinar (verificar-conteudo-restrito.ts)
 * para a área da Júri. O estado vem do cadeira.ts da cadeira juri-simulado,
 * nunca de variável de ambiente, para que nada de fora desligue o portão.
 *
 *   - estado `em-breve`: não há conteúdo a vazar. Imprime
 *     "juri: 0 analisados, cadeira não publicada" e sai 0 (nem exige o JSON).
 *   - estado `publicado`: exige CADERNO_RESTRITO_JURI (JSON privado da Júri,
 *     fora do repositório). Sem variável, arquivo inexistente, JSON malformado
 *     ou JSON sem trecho distintivo: sai 1 (falha fechada). Com ele, procura
 *     cada trecho do JSON em TODO arquivo de dist/ (sem diferenciar caixa nem
 *     acento) e sai 1 se achar qualquer um.
 *
 * Imprime só contagens, nunca um trecho (L-28). Variáveis (todas opcionais,
 * para provar o portão vermelho fora da árvore):
 *   CADERNO_RESTRITO_JURI  JSON privado da Júri (obrigatório se publicado)
 *   CADEIRA_JURI           cadeira.ts a ler (padrão: src/conteudo/p1/juri-simulado/cadeira.ts)
 *   DIST_PATH              pasta do pacote (padrão dist/ da raiz)
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { indicesEncontrados, normalizarParaBusca } from '../src/core/restrito/termosVazamento';
import { extrairTermosDeVazamentoJuri } from '../src/core/restrito/termosVazamentoJuri';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '..');
const DIST = resolve(RAIZ, process.env.DIST_PATH ?? 'dist');
const CAMINHO_CADEIRA = resolve(
  RAIZ,
  process.env.CADEIRA_JURI ?? 'src/conteudo/p1/juri-simulado/cadeira.ts'
);
const CAMINHO_JSON = process.env.CADERNO_RESTRITO_JURI ?? '';

function arquivosDe(pasta: string): string[] {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(pasta, entrada.name);
    return entrada.isDirectory() ? arquivosDe(caminho) : [caminho];
  });
}

/** Estado da cadeira lido do módulo de verdade; null quando não dá para ler (falha fechada). */
async function lerEstadoDaCadeira(): Promise<string | null> {
  if (!existsSync(CAMINHO_CADEIRA)) return null;
  try {
    const modulo = (await import(pathToFileURL(CAMINHO_CADEIRA).href)) as {
      cadeira?: { estado?: unknown };
    };
    return typeof modulo.cadeira?.estado === 'string' ? modulo.cadeira.estado : null;
  } catch {
    return null;
  }
}

function lerTermos(): string[] | null {
  if (CAMINHO_JSON === '') {
    console.error(
      'verificar-conteudo-restrito-juri: cadeira publicada sem CADERNO_RESTRITO_JURI (falha fechada)'
    );
    return null;
  }
  if (!existsSync(CAMINHO_JSON)) {
    console.error('verificar-conteudo-restrito-juri: JSON privado da Júri ausente (falha fechada)');
    return null;
  }
  let bruto: unknown;
  try {
    bruto = JSON.parse(readFileSync(CAMINHO_JSON, 'utf-8'));
  } catch {
    console.error('verificar-conteudo-restrito-juri: JSON privado malformado (falha fechada)');
    return null;
  }
  const termos = extrairTermosDeVazamentoJuri(bruto);
  console.log(`termos: trechos=${termos.length}`);
  if (termos.length === 0) {
    console.error(
      'verificar-conteudo-restrito-juri: JSON sem trecho distintivo é varredura quebrada'
    );
    return null;
  }
  return termos;
}

function varrerDist(termos: readonly string[]): {
  encontrados: number;
  analisados: number;
  falharam: number;
} {
  const arquivos = arquivosDe(DIST);
  let analisados = 0;
  let falharam = 0;
  for (const caminho of arquivos) {
    try {
      if (!statSync(caminho).isFile()) continue;
      const alvo = normalizarParaBusca(readFileSync(caminho).toString('utf-8'));
      analisados += 1;
      if (indicesEncontrados(alvo, termos).length > 0) falharam += 1;
    } catch {
      falharam += 1;
    }
  }
  return { encontrados: arquivos.length, analisados, falharam };
}

async function principal(): Promise<number> {
  const estado = await lerEstadoDaCadeira();
  if (estado === null) {
    console.error('verificar-conteudo-restrito-juri: estado da cadeira ilegível (falha fechada)');
    return 1;
  }
  if (estado === 'em-breve') {
    console.log('juri: 0 analisados, cadeira não publicada');
    return 0;
  }
  if (estado !== 'publicado') {
    // Estado fora dos dois conhecidos (typo, valor novo) não pode abrir o portão.
    console.error(
      `verificar-conteudo-restrito-juri: estado desconhecido da cadeira (falha fechada)`
    );
    return 1;
  }

  const termos = lerTermos();
  if (termos === null) return 1;
  if (!existsSync(DIST)) {
    console.error('verificar-conteudo-restrito-juri: pasta dist ausente (rode o build antes)');
    return 1;
  }

  const { encontrados, analisados, falharam } = varrerDist(termos);
  console.log(`juri: encontrados=${encontrados} analisados=${analisados} falharam=${falharam}`);
  if (analisados === 0) {
    console.error('verificar-conteudo-restrito-juri: zero arquivo analisado é varredura quebrada');
    return 1;
  }
  if (analisados !== encontrados) {
    console.error('verificar-conteudo-restrito-juri: varredura incompleta (falha fechada)');
    return 1;
  }
  if (falharam > 0) {
    console.error('verificar-conteudo-restrito-juri: VAZAMENTO do conteúdo da Júri no pacote');
    return 1;
  }
  console.log('verificar-conteudo-restrito-juri: nada da Júri encontrado no pacote');
  return 0;
}

principal().then((codigo) => {
  process.exitCode = codigo;
});
