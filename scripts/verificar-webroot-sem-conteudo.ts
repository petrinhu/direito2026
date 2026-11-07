/**
 * Portão do webroot separado (plano do CTO do login único, 7.3; LU-F4.2).
 *
 * O webroot tem de conter só a lista fechada de ehDoWebroot (scripts/apoio/pacotePublico.ts),
 * com os itens obrigatórios. Além da estrutura, o portão procura, em cada arquivo do webroot:
 *   1. cada termo do arquivo de termos (VERIFICAR_PROIBICOES_TERMOS, o mesmo de R3);
 *   2. cada janela de 40 caracteres de literal de src/conteudo (TypeScript, só valor de string).
 * Os termos e os trechos são normalizados por normalizarParaBusca (src/core/restrito).
 *
 * Não repete a varredura restrita do dist (verificar-conteudo-restrito, no preci): aquele
 * portão já cobre o pacote inteiro e a árvore. Este só fecha o webroot.
 *
 * Nunca imprime termo nem trecho (L-28): só caminho, número da regra e contagens.
 * Falha fechada: webroot ausente ou vazio, arquivo de termos ausente ou sem termo,
 * src/conteudo sem literal (zero janela é varredura quebrada, L-36).
 *
 * Variáveis (opcionais): WEBROOT_PATH (padrão dist-pacote/webroot),
 * VERIFICAR_PROIBICOES_TERMOS (padrão ~/.config/secrets/caderno-direito-termos-proibidos.txt),
 * CONTEUDO_PATH (padrão src/conteudo).
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { normalizarParaBusca } from '../src/core/restrito/termosVazamento';
import { OBRIGATORIOS_WEBROOT, ehDoWebroot, listarArquivos } from './apoio/pacotePublico';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '..');
const WEBROOT = resolve(process.env.WEBROOT_PATH ?? join(RAIZ, 'dist-pacote/webroot'));
const ARQUIVO_TERMOS =
  process.env.VERIFICAR_PROIBICOES_TERMOS ??
  join(homedir(), '.config/secrets/caderno-direito-termos-proibidos.txt');
const CONTEUDO = resolve(process.env.CONTEUDO_PATH ?? join(RAIZ, 'src/conteudo'));
const TAMANHO_JANELA = 40;

function ehPasta(caminho: string): boolean {
  return statSync(caminho, { throwIfNoEntry: false })?.isDirectory() ?? false;
}

/** Termos normalizados, sem linha vazia. Undefined se o arquivo não existe. */
function lerTermos(): string[] | undefined {
  if (!existsSync(ARQUIVO_TERMOS)) return undefined;
  return readFileSync(ARQUIVO_TERMOS, 'utf-8')
    .split('\n')
    .map((linha) => normalizarParaBusca(linha))
    .filter((termo) => termo.length > 0);
}

/** Janelas deslizantes de TAMANHO_JANELA caracteres de um texto já normalizado. */
function janelas(texto: string): string[] {
  const saida: string[] = [];
  for (let i = 0; i + TAMANHO_JANELA <= texto.length; i += 1) {
    saida.push(texto.slice(i, i + TAMANHO_JANELA));
  }
  return saida;
}

/** Valores de literal de string (aspas e template sem substituição) de um arquivo .ts. */
function literaisDoArquivo(caminho: string): string[] {
  const fonte = ts.createSourceFile(
    caminho,
    readFileSync(caminho, 'utf-8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
  const valores: string[] = [];
  const visitar = (no: ts.Node): void => {
    if (ts.isStringLiteral(no) || ts.isNoSubstitutionTemplateLiteral(no)) valores.push(no.text);
    ts.forEachChild(no, visitar);
  };
  visitar(fonte);
  return valores;
}

/** Todos os .ts sob src/conteudo, como caminhos absolutos. */
function arquivosDeConteudo(pasta: string): string[] {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(pasta, entrada.name);
    if (entrada.isDirectory()) return arquivosDeConteudo(caminho);
    return entrada.name.endsWith('.ts') ? [caminho] : [];
  });
}

/** Texto de estudo (só literal) de cada .ts de src/conteudo, já normalizado. */
function textosDoConteudo(): string[] {
  return arquivosDeConteudo(CONTEUDO).map((caminho) =>
    normalizarParaBusca(literaisDoArquivo(caminho).join(' '))
  );
}

function principal(): number {
  if (!ehPasta(WEBROOT)) {
    console.error(
      `verificar-webroot-sem-conteudo: pasta ausente: ${WEBROOT} (rode 'npm run build' antes)`
    );
    return 1;
  }
  const caminhos = listarArquivos(WEBROOT);
  if (caminhos.length === 0) {
    console.error(
      'verificar-webroot-sem-conteudo: encontrados=0 analisados=0 falharam=0 (piso, L-36)'
    );
    return 1;
  }

  let falharam = 0;
  let analisados = 0;
  const reprovar = (caminho: string, motivo: string): void => {
    falharam += 1;
    console.error(`verificar-webroot-sem-conteudo: ${caminho}: ${motivo}`);
  };

  for (const obrigatorio of OBRIGATORIOS_WEBROOT) {
    if (!caminhos.includes(obrigatorio)) {
      falharam += 1;
      console.error(`verificar-webroot-sem-conteudo: ausente no webroot: ${obrigatorio}`);
    }
  }

  const termos = lerTermos();
  if (termos === undefined || termos.length === 0) {
    console.error(
      'verificar-webroot-sem-conteudo: arquivo de termos ausente ou sem termo (falha fechada)'
    );
    return 1;
  }

  const textosConteudo = textosDoConteudo();
  const janelasDoWebroot = new Map<string, string>();
  for (const caminho of caminhos) {
    const texto = normalizarParaBusca(readFileSync(join(WEBROOT, caminho), 'utf-8'));
    for (const janela of janelas(texto)) {
      if (!janelasDoWebroot.has(janela)) janelasDoWebroot.set(janela, caminho);
    }
  }

  for (const caminho of caminhos) {
    analisados += 1;
    if (!ehDoWebroot(caminho)) {
      reprovar(caminho, 'fora da lista fechada do webroot');
      continue;
    }
    const alvo = normalizarParaBusca(readFileSync(join(WEBROOT, caminho), 'utf-8'));
    termos.forEach((termo, i) => {
      if (alvo.includes(termo)) reprovar(caminho, `termo proibido (regra ${i + 1})`);
    });
  }

  const comTrecho = new Set<string>();
  let trechos = 0;
  for (const texto of textosConteudo) {
    for (const janela of janelas(texto)) {
      trechos += 1;
      const achado = janelasDoWebroot.get(janela);
      if (achado !== undefined) comTrecho.add(achado);
    }
  }
  if (trechos === 0) {
    console.error(
      'verificar-webroot-sem-conteudo: trechos de conteúdo=0 (piso, src/conteudo sem literal)'
    );
    return 1;
  }
  for (const caminho of comTrecho) reprovar(caminho, 'trecho de conteúdo de src/conteudo');

  console.log(
    `verificar-webroot-sem-conteudo: encontrados=${caminhos.length} analisados=${analisados} falharam=${falharam}`
  );
  console.log(
    `verificar-webroot-sem-conteudo: termos=${termos.length} trechos de conteúdo=${trechos}`
  );
  if (analisados !== caminhos.length) {
    console.error('verificar-webroot-sem-conteudo: varredura incompleta');
    return 1;
  }
  return falharam > 0 ? 1 : 0;
}

process.exitCode = principal();
