/**
 * Lista fechada do pacote público (plano do CTO do login único, 1.1 e 7.1; LU-F4.2).
 *
 * Fonte única para três quem-usa: o separador (scripts/separar-pacote.ts), o portão do
 * webroot (scripts/verificar-webroot-sem-conteudo.ts) e o portão do .htaccess
 * (scripts/verificar-htaccess-pastas.ts). Regra de 3 (L-33): a lista tem três usos,
 * então sai de cada um e mora aqui. Mudar qualquer valor exige mudar o
 * public/.htaccess no mesmo commit, senão os portões reprovam de propósito.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/** Regra de passagem direta de literais (`- [L]`), como texto de RewriteRule. */
const PASSAGEM_LITERAIS = '^(sw\\.js|robots\\.txt|entrada\\.css|icones/favicon\\.svg)$';
/** Regra de passagem direta dos endpoints da API, como texto de RewriteRule. */
const PASSAGEM_API = '^api/[a-z0-9/-]+\\.php$';

/** Passagens diretas do .htaccess: o texto exato das regras de passagem. */
export const PASSAGENS_ESPERADAS: readonly string[] = [PASSAGEM_LITERAIS, PASSAGEM_API];

/** Literais que o servidor entrega sem portão. */
export const LITERAIS: readonly string[] = [
  'sw.js',
  'robots.txt',
  'entrada.css',
  'icones/favicon.svg'
];

export const HTACCESS_RAIZ = '.htaccess';
export const HTACCESS_NUCLEO = 'api/nucleo/.htaccess';

/** O webroot precisa ter estes (piso: sem eles o site não sobe). */
export const OBRIGATORIOS_WEBROOT: readonly string[] = [
  ...LITERAIS,
  HTACCESS_RAIZ,
  HTACCESS_NUCLEO,
  'api/portao.php',
  'api/saude.php'
];

/** O app precisa ter estes. */
export const OBRIGATORIOS_APP: readonly string[] = ['index.html'];

/** Nomes que não podem vir do build (o separador os recusa). */
export const RESERVADOS: ReadonlyMap<string, string> = new Map([
  ['404.html', '404 estático saiu (plano 7.3): nenhum 404.html deve ser gerado'],
  ['manifesto.json', 'nome reservado: o manifesto do app é gerado pelo separador']
]);

/** Tipo (Content-Type) por extensão do app. Lista fechada: extensão fora dela reprova. */
export const TIPO_POR_EXTENSAO: ReadonlyMap<string, string> = new Map([
  ['html', 'text/html'],
  ['js', 'text/javascript'],
  ['css', 'text/css'],
  ['json', 'application/json'],
  ['woff2', 'font/woff2'],
  ['png', 'image/png'],
  ['jpg', 'image/jpeg'],
  ['avif', 'image/avif'],
  ['webp', 'image/webp']
]);

const RE_PASSAGEM_API = new RegExp(PASSAGEM_API);

/** Verdadeiro se o caminho (relativo, com `/`) é um arquivo do webroot. */
export function ehDoWebroot(caminho: string): boolean {
  return (
    LITERAIS.includes(caminho) ||
    caminho === HTACCESS_RAIZ ||
    caminho === HTACCESS_NUCLEO ||
    RE_PASSAGEM_API.test(caminho)
  );
}

/** Tipo do arquivo do app pela extensão, ou undefined se a extensão não é prevista. */
export function tipoDoApp(caminho: string): string | undefined {
  const nome = caminho.split('/').pop() ?? '';
  const ponto = nome.lastIndexOf('.');
  if (ponto <= 0) return undefined;
  return TIPO_POR_EXTENSAO.get(nome.slice(ponto + 1));
}

export interface Classificacao {
  readonly webroot: string[];
  readonly app: string[];
  /** Uma linha por arquivo recusado, com o caminho e a razão. Vazia = tudo previsto. */
  readonly razoes: string[];
}

/** Separa caminhos do dist em webroot e app, e recusa tudo que não está previsto. */
export function classificar(caminhos: readonly string[]): Classificacao {
  const webroot: string[] = [];
  const app: string[] = [];
  const razoes: string[] = [];
  for (const caminho of caminhos) {
    const reservado = RESERVADOS.get(caminho);
    if (reservado !== undefined) {
      razoes.push(`${caminho}: ${reservado}`);
    } else if (ehDoWebroot(caminho)) {
      webroot.push(caminho);
    } else if (caminho.startsWith('api/')) {
      razoes.push(
        `${caminho}: api fora da regra de passagem (só .php de endpoint e o .htaccess do núcleo)`
      );
    } else if (tipoDoApp(caminho) !== undefined) {
      app.push(caminho);
    } else {
      razoes.push(`${caminho}: extensão não prevista na lista fechada do app`);
    }
  }
  return { webroot, app, razoes };
}

/** Caminhos relativos (com `/`) de todos os arquivos de uma pasta, ordenados. */
export function listarArquivos(pasta: string, base: string = pasta): string[] {
  return readdirSync(pasta, { withFileTypes: true })
    .flatMap((entrada) => {
      const caminho = join(pasta, entrada.name);
      if (entrada.isDirectory()) return listarArquivos(caminho, base);
      return [relative(base, caminho).split(sep).join('/')];
    })
    .sort();
}

/** MD5 do conteúdo do arquivo, em hexadecimal. */
export function md5Do(caminho: string): string {
  return createHash('md5').update(readFileSync(caminho)).digest('hex');
}
