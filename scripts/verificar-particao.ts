/**
 * Portão de partição (plano do CTO do login único, 6.1 linha 385, E6 e F1.2b).
 * Reprova qualquer janela de 40 caracteres de TEXTO DE ESTUDO cifrado que
 * apareça em arquivo EM CLARO do repositório. O critério (o que é fonte, o que é
 * janela, o que é frase permitida, as classes FONTE e FORA) mora em
 * scripts/apoio/textoDeEstudo.ts, e é o mesmo que o portão do histórico da faixa
 * (scripts/apoio/textoEmClaroNaFaixa.ts) usa. Aqui fica só a varredura da árvore.
 *
 * Lado claro: todo arquivo textual rastreado que não é cifrado, inteiro, com
 * comentário. Sem AST: .md, .html, .css, .json, e as expressões de template do
 * .vue (limite declarado, L-18). Literais em statements, arrays ou `.join()`
 * separados não se juntam (limite declarado).
 *
 * NUL em arquivo em claro: se a extensão estiver em BINARIAS_POR_EXTENSAO, o
 * arquivo sai por extensão. Qualquer outro com NUL, em qualquer lugar do arquivo,
 * é falha (CAMINHO COM NUL), nunca saída silenciosa.
 *
 * Classes: todo caminho cifrado cai em FONTE ou em FORA da fonte, com motivo
 * escrito. Caminho cifrado sem classe reprova (falha fechada). Cifrado fora da
 * fonte não é varrido como fonte e não reprova; é contado em fora_da_fonte.
 *
 * Saída: encontrados = arquivos em claro com ao menos uma janela casada;
 * analisados = arquivos em claro textuais lidos; falharam = encontrados; fontes =
 * arquivos cifrados lidos como fonte; permitidas = frases permitidas;
 * fora_da_fonte = cifrados em classe FORA; sem_classe = cifrados sem classe (falha);
 * nul = arquivos em claro com NUL fora de binário por extensão (falha).
 * Piso: zero fonte ou zero claro analisado é falha.
 *
 * Variável: REPO_RAIZ (padrão: a raiz deste repositório).
 */
import { execFileSync } from 'node:child_process';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BINARIAS_POR_EXTENSAO,
  FRASES_PERMITIDAS,
  TETO_FRASES,
  caminhosCifrados,
  classificar,
  fontesCasadas,
  indexarFontes,
  lerBytes
} from './apoio/textoDeEstudo';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(process.env.REPO_RAIZ ?? join(AQUI, '..'));

function git(args: string[]): Buffer {
  return execFileSync('git', args, { cwd: RAIZ, maxBuffer: 1 << 28 });
}

function principal(): number {
  if (FRASES_PERMITIDAS.length > TETO_FRASES) {
    console.log(
      `verificar-particao: ${FRASES_PERMITIDAS.length} frases permitidas, teto ${TETO_FRASES} (falha fechada)`
    );
    return 1;
  }

  const rastreados = git(['ls-files', '-z'])
    .toString('utf-8')
    .split('\0')
    .filter((c) => c.length > 0);
  const cifrados = caminhosCifrados(RAIZ, rastreados);

  const caminhosFonte: string[] = [];
  const semClasse: string[] = [];
  let foraDaFonte = 0;
  for (const caminho of rastreados.filter((c) => cifrados.has(c))) {
    const classe = classificar(caminho);
    if (classe === undefined) semClasse.push(caminho);
    else if (classe.classe === 'fonte') caminhosFonte.push(caminho);
    else foraDaFonte += 1;
  }
  const { janelas, fontes } = indexarFontes(RAIZ, caminhosFonte);

  let analisados = 0;
  const reprovados: { caminho: string; fontes: Set<string> }[] = [];
  const comNul: string[] = [];
  for (const caminho of rastreados) {
    if (cifrados.has(caminho)) continue;
    const bruto = lerBytes(RAIZ, caminho);
    if (bruto === undefined) continue;
    if (bruto.includes(0)) {
      if (!BINARIAS_POR_EXTENSAO.has(extname(caminho).toLowerCase())) comNul.push(caminho);
      continue;
    }
    const codigo = bruto.toString('utf-8');
    analisados += 1;
    const origens = fontesCasadas(janelas, caminho, codigo);
    if (origens.size > 0) reprovados.push({ caminho, fontes: origens });
  }

  const pisoQuebrado = fontes === 0 || analisados === 0;
  console.log(
    `verificar-particao: encontrados=${reprovados.length} analisados=${analisados} ` +
      `falharam=${reprovados.length} fontes=${fontes} permitidas=${FRASES_PERMITIDAS.length} ` +
      `fora_da_fonte=${foraDaFonte} sem_classe=${semClasse.length} nul=${comNul.length}`
  );
  if (pisoQuebrado) {
    console.log(
      '  ZERO fonte ou zero claro analisado: árvore trancada ou escopo quebrado (varredura quebrada)'
    );
  }
  for (const caminho of semClasse) {
    console.log(`  CAMINHO CIFRADO SEM CLASSE (falha fechada): ${caminho}`);
  }
  for (const caminho of comNul) {
    console.log(`  CAMINHO COM NUL EM EXTENSÃO TEXTUAL (falha fechada): ${caminho}`);
  }
  for (const { caminho, fontes: origens } of reprovados) {
    console.log(`  EM CLARO com trecho de ${origens.size} fonte(s) cifrada(s): ${caminho}`);
  }
  const limpo =
    reprovados.length === 0 && !pisoQuebrado && semClasse.length === 0 && comNul.length === 0;
  return limpo ? 0 : 1;
}

try {
  process.exitCode = principal();
} catch (erro) {
  console.error(
    `verificar-particao: git indisponível ou repositório ilegível (falha fechada): ${String(erro)}`
  );
  process.exitCode = 1;
}
