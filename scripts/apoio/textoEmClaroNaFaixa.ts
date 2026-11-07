/**
 * Prova de texto de estudo em claro na FAIXA que vai ao remoto (LU-F5.2, revisão F5.2, I-4).
 * cifra-faixa.py confere só caminhos protegidos. Esta prova confere todo blob que a faixa
 * introduz, em qualquer caminho, contra as janelas de 40 caracteres do texto de estudo cifrado.
 * O critério (fonte, janela, frase permitida) é o de scripts/apoio/textoDeEstudo.ts, o mesmo
 * do portão da árvore (scripts/verificar-particao.ts).
 *
 * Uso: node --import tsx scripts/apoio/textoEmClaroNaFaixa.ts <repositorio> <base|-> <ponta>
 *
 * Como lê, sem laço de processo por commit:
 * - Introdução: `git log --raw -z -m` dos commits da faixa (diff contra cada pai). Um blob
 *   que aparece pela primeira vez como nova versão de um caminho é introduzido por esse
 *   commit. Blob herdado do pai não é introdução: o que já estava na base não entra, porque
 *   já é público (D1).
 * - Fontes: arquivos cifrados da árvore da ponta que o critério classifica como FONTE, lidos
 *   da árvore destrancada. Se algum tiver a magia (árvore trancada) ou for ilegível, reprova:
 *   nunca dá verde falso (T7).
 * - Leitura: um `git cat-file --batch` para todos os blobs introduzidos.
 *
 * Limite declarado (L-18): a introdução é atribuída ao primeiro commit em que o blob aparece;
 * o mesmo blob em outro caminho depois não é reportado de novo.
 *
 * Saída: commits, fontes, janelas, encontrados (blobs introduzidos), analisados, falharam.
 * O relatório traz só caminho, commit e contagem, nunca trecho de conteúdo.
 * Sai 0 se tudo confere; 1 se algo falha; 2 se o uso estiver errado.
 */
import { execFileSync } from 'node:child_process';
import {
  caminhosCifrados,
  classificar,
  fontesCasadas,
  indexarFontes,
  lerBytes
} from './textoDeEstudo';

const MAGIA = Buffer.from([0x00, 0x47, 0x49, 0x54, 0x43, 0x52, 0x59, 0x50, 0x54, 0x00]);
const MODO_SUBMODULO = '160000';
const SHA_NULO = '0'.repeat(40);

interface Introducao {
  commit: string;
  caminho: string;
}

function git(repo: string, args: string[], entrada?: string): Buffer {
  return execFileSync('git', ['-C', repo, ...args], { input: entrada, maxBuffer: 1 << 30 });
}

/** Commits da faixa, do mais antigo para o mais novo (pais antes de filhos). */
export function commitsDaFaixa(repo: string, base: string, ponta: string): string[] {
  const alvo = base === '-' ? [ponta] : [`${base}..${ponta}`];
  return git(repo, ['rev-list', '--reverse', '--topo-order', ...alvo])
    .toString('utf-8')
    .split('\n')
    .filter((c) => c.length > 0);
}

/**
 * Blob -> primeiro (commit, caminho) em que a faixa o introduz. Um único `git log --raw -z`.
 * Formato -z: "C <sha>" é o cabeçalho do commit; cada entrada é um token de metadados
 * ":modo_antigo modo_novo sha_antigo sha_novo estado" seguido do caminho.
 */
export function introducoesDaFaixa(repo: string, commits: string[]): Map<string, Introducao> {
  const introducoes = new Map<string, Introducao>();
  if (commits.length === 0) return introducoes;
  const bruto = git(repo, [
    'log',
    '--no-walk=unsorted',
    '--raw',
    '-z',
    '-m',
    '--diff-merges=separate',
    '--no-renames',
    '--no-abbrev',
    '--format=C %H',
    ...commits
  ]).toString('utf-8');
  const tokens = bruto.split('\0');
  let commit = '';
  for (let i = 0; i < tokens.length; i += 1) {
    const token = (tokens[i] ?? '').replace(/^\n+/, '');
    if (token.startsWith('C ')) {
      commit = token.slice(2).trim();
      continue;
    }
    if (!token.startsWith(':')) continue;
    const caminho = tokens[i + 1] ?? '';
    i += 1;
    const campos = token.split(' ');
    const modoNovo = campos[1] ?? '';
    const shaNovo = campos[3] ?? '';
    const estado = campos[4] ?? '';
    if (estado.startsWith('D') || shaNovo === SHA_NULO || modoNovo === MODO_SUBMODULO) continue;
    if (!introducoes.has(shaNovo)) introducoes.set(shaNovo, { commit, caminho });
  }
  return introducoes;
}

/** Conteúdo de cada blob, num único `git cat-file --batch`. Sha ausente vira null. */
export function lerBlobs(repo: string, shas: string[]): Map<string, Buffer | null> {
  const saida = new Map<string, Buffer | null>();
  if (shas.length === 0) return saida;
  const bruto = git(repo, ['cat-file', '--batch'], `${shas.join('\n')}\n`);
  let pos = 0;
  for (const sha of shas) {
    const fim = bruto.indexOf(0x0a, pos);
    const cabecalho = bruto.subarray(pos, fim).toString('utf-8').split(' ');
    pos = fim + 1;
    if (cabecalho.length < 3 || cabecalho[1] === 'missing') {
      saida.set(sha, null);
      continue;
    }
    const tamanho = Number(cabecalho[2]);
    saida.set(sha, bruto.subarray(pos, pos + tamanho));
    pos += tamanho + 1;
  }
  return saida;
}

function principal(argumentos: string[]): number {
  if (argumentos.length !== 3) {
    console.error('uso: textoEmClaroNaFaixa.ts <repositorio> <base|-> <ponta>');
    return 2;
  }
  const repo = argumentos[0] ?? '';
  const base = argumentos[1] ?? '';
  const ponta = argumentos[2] ?? '';

  const commits = commitsDaFaixa(repo, base, ponta);
  if (commits.length === 0) {
    console.error(
      'texto em claro na faixa: faixa vazia (zero commits a enviar): nada a conferir, recusado'
    );
    return 1;
  }

  const rastreados = git(repo, ['ls-files', '-z'])
    .toString('utf-8')
    .split('\0')
    .filter((c) => c.length > 0);
  const cifrados = caminhosCifrados(repo, rastreados);
  const fontesCaminhos = rastreados.filter(
    (c) => cifrados.has(c) && classificar(c)?.classe === 'fonte'
  );
  if (fontesCaminhos.length === 0) {
    console.error(
      'texto em claro na faixa: zero fonte cifrada na árvore da ponta (varredura quebrada; zero é falha)'
    );
    return 1;
  }

  // Árvore trancada: a fonte tem a magia (ou não se lê) na árvore de trabalho. Reprova, nunca verde.
  const trancadas = fontesCaminhos.filter((c) => {
    const bruto = lerBytes(repo, c);
    return bruto === undefined || bruto.subarray(0, MAGIA.length).equals(MAGIA);
  });
  const { janelas, fontes, trancadas: ilegiveis } = indexarFontes(repo, fontesCaminhos);
  const bloqueadas = new Set([...trancadas, ...ilegiveis]);
  if (bloqueadas.size > 0) {
    console.error(
      `texto em claro na faixa: árvore trancada ou ilegível: ${bloqueadas.size} fonte(s) ` +
        'não estão em claro na árvore de trabalho (destrave antes; verde falso é recusado)'
    );
    return 1;
  }
  if (janelas.size === 0) {
    console.error(
      'texto em claro na faixa: zero janela de 40 caracteres nas fontes (varredura quebrada; zero é falha)'
    );
    return 1;
  }

  const introducoes = introducoesDaFaixa(repo, commits);
  const shas = [...introducoes.keys()];
  if (shas.length === 0) {
    console.error(
      'texto em claro na faixa: zero blob introduzido pela faixa (varredura quebrada; zero é falha)'
    );
    return 1;
  }
  const conteudo = lerBlobs(repo, shas);

  let analisados = 0;
  const falharam: { commit: string; caminho: string; origens: number }[] = [];
  for (const sha of shas) {
    const corpo = conteudo.get(sha);
    if (!corpo) continue;
    analisados += 1;
    const intro = introducoes.get(sha);
    if (!intro) continue;
    const origens = fontesCasadas(janelas, intro.caminho, corpo.toString('utf-8'));
    if (origens.size > 0) {
      falharam.push({ commit: intro.commit, caminho: intro.caminho, origens: origens.size });
    }
  }

  console.log(
    `texto em claro na faixa: commits=${commits.length} fontes=${fontes} janelas=${janelas.size} ` +
      `encontrados=${shas.length} analisados=${analisados} falharam=${falharam.length}`
  );
  for (const f of falharam) {
    console.log(
      `  TEXTO DE ESTUDO EM CLARO: ${f.commit.slice(0, 12)} ${f.caminho} (trecho de ${f.origens} fonte(s))`
    );
  }
  if (analisados !== shas.length) {
    console.error(
      'texto em claro na faixa: varredura incompleta (analisados diferente de encontrados)'
    );
    return 1;
  }
  return falharam.length > 0 ? 1 : 0;
}

try {
  process.exitCode = principal(process.argv.slice(2));
} catch (erro) {
  console.error(
    `texto em claro na faixa: git indisponível ou repositório ilegível (falha fechada): ${String(erro)}`
  );
  process.exitCode = 1;
}
