/**
 * Portão de partição (plano do CTO do login único, 6.1 linha 385 e F1.2). Reprova
 * qualquer janela de 40 caracteres de texto CIFRADO que apareça em texto EM CLARO
 * do repositório. Mesmo critério de normalização do portão de vazamento
 * (scripts/verificar-conteudo-restrito.ts): caixa, acento e espaço, pela função
 * normalizarParaBusca de src/core/restrito/termosVazamento.ts.
 *
 * Escopo da janela: deslizante, a cada posição, sem limite de início e fim. O
 * método do vazamento restrito (trechosDe) só corta em tag HTML; em prosa e
 * código ele devolveria apenas o início e o fim de cada arquivo, por isso não
 * é usado aqui (decisão registrada no relatório da F1.2).
 *
 * Quem entra: arquivo rastreado pelo `.gitattributes` real como cifrado (git
 * check-attr) e lido da working tree destravada; e arquivo em claro rastreado
 * que não é cifrado. Binário (byte nulo nos 8000 primeiros) fica de fora dos dois lados.
 *
 * Saída: encontrados = arquivos em claro com ao menos uma janela casada;
 * analisados = arquivos em claro textuais lidos; falharam = encontrados (cada um
 * reprova); cifrados_texto = cifrados textuais lidos; janelas = janelas de cifrado
 * indexadas. Piso: zero cifrado textual é varredura quebrada (L-36).
 *
 * Variável: REPO_RAIZ (padrão: a raiz deste repositório).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizarParaBusca } from '../src/core/restrito/termosVazamento';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(process.env.REPO_RAIZ ?? join(AQUI, '..'));
const TAMANHO_JANELA = 40;
const FILTRO = 'git-crypt';

function git(args: string[], entrada?: string): Buffer {
  return execFileSync('git', args, { cwd: RAIZ, input: entrada, maxBuffer: 1 << 28 });
}

/** Um processo: `git check-attr` com o `.gitattributes` real. Formato -z: trincas caminho, atributo, valor. */
function caminhosCifrados(caminhos: string[]): Set<string> {
  const achados = new Set<string>();
  if (caminhos.length === 0) return achados;
  const saida = git(['check-attr', '-z', '--stdin', 'filter'], caminhos.join('\0') + '\0')
    .toString('utf-8')
    .split('\0');
  for (let i = 0; i + 2 < saida.length; i += 3) {
    if (saida[i + 2] === FILTRO) achados.add(saida[i] ?? '');
  }
  return achados;
}

/** Texto normalizado, ou undefined se o arquivo for binário (byte nulo) ou não puder ser lido. */
function textoNormalizado(caminho: string): string | undefined {
  try {
    const bruto = readFileSync(join(RAIZ, caminho));
    if (bruto.subarray(0, 8000).includes(0)) return undefined;
    return normalizarParaBusca(bruto.toString('utf-8'));
  } catch {
    return undefined;
  }
}

function principal(): number {
  const rastreados = git(['ls-files', '-z'])
    .toString('utf-8')
    .split('\0')
    .filter((c) => c.length > 0);
  const cifrados = caminhosCifrados(rastreados);

  // Janela -> primeiro cifrado que a contém. Map exato: sem colisão de hash.
  const janelas = new Map<string, string>();
  let cifradosTexto = 0;
  for (const caminho of rastreados) {
    if (!cifrados.has(caminho)) continue;
    const texto = textoNormalizado(caminho);
    if (texto === undefined) continue;
    cifradosTexto += 1;
    for (let i = 0; i + TAMANHO_JANELA <= texto.length; i += 1) {
      const janela = texto.slice(i, i + TAMANHO_JANELA);
      if (!janelas.has(janela)) janelas.set(janela, caminho);
    }
  }

  let analisados = 0;
  const reprovados: { caminho: string; cifrados: Set<string> }[] = [];
  for (const caminho of rastreados) {
    if (cifrados.has(caminho)) continue;
    const texto = textoNormalizado(caminho);
    if (texto === undefined) continue;
    analisados += 1;
    const origens = new Set<string>();
    for (let i = 0; i + TAMANHO_JANELA <= texto.length; i += 1) {
      const origem = janelas.get(texto.slice(i, i + TAMANHO_JANELA));
      if (origem !== undefined) origens.add(origem);
    }
    if (origens.size > 0) reprovados.push({ caminho, cifrados: origens });
  }

  const pisoQuebrado = cifradosTexto === 0 || analisados === 0;
  console.log(
    `verificar-particao: encontrados=${reprovados.length} analisados=${analisados} ` +
      `falharam=${reprovados.length} cifrados_texto=${cifradosTexto} janelas=${janelas.size}`
  );
  if (cifradosTexto === 0) {
    console.log(
      '  ZERO texto cifrado analisado: árvore trancada ou atributo ausente (varredura quebrada)'
    );
  }
  for (const { caminho, cifrados: origens } of reprovados) {
    console.log(`  EM CLARO com trecho de ${origens.size} cifrado(s): ${caminho}`);
  }
  return reprovados.length === 0 && !pisoQuebrado ? 0 : 1;
}

try {
  process.exitCode = principal();
} catch (erro) {
  console.error(
    `verificar-particao: git indisponível ou repositório ilegível (falha fechada): ${String(erro)}`
  );
  process.exitCode = 1;
}
