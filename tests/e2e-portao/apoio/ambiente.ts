/**
 * Monta e reinicia o ambiente SINTÉTICO do teste do portão: privado (contas, conteúdo, acervo
 * de imagens) e app (cópia do dist com manifesto por md5). Roda antes do php -S (subir.ts) e
 * antes de cada teste (resetarPrivado). Nada real entra aqui (L-28).
 *
 * O formato do manifesto é o que o portão lê (public/api/nucleo/portao.php, d26_portao_manifesto):
 * {"arquivos": {"<caminho>": {"tipo": "...", "bytes": n, "md5": "..."}}}. Não depende do
 * separar-pacote da F4.2, que ainda não existe no HEAD.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { dirname, extname, join, relative, sep } from 'node:path';
import { conteudoRestritoFalso } from '../../unidade/apoio/conteudoRestritoFalso';
import { ID_IMAGEM_SINTETICA } from './constantes';

/** Raiz do ambiente de teste. Só aceita caminho sob site-login-unico (guarda do rmSync, L-53). */
export const AMBIENTE = process.env.E2E_PORTAO_AMBIENTE ?? '/var/tmp/site-login-unico/f44/ambiente';
export const PRIVADO = join(AMBIENTE, 'privado');
export const APP = join(AMBIENTE, 'app');
/** SMTP falso (EM-F1): conversas capturadas, uma por conexão, e o roteiro que o próximo falso vai seguir. */
export const PASTA_SMTP = join(AMBIENTE, 'smtp');
export const ROTEIRO_SMTP = join(PASTA_SMTP, 'roteiro.json');
/** Senha da caixa, SINTÉTICA: só existe para o envio não falhar antes de conectar (modo 600, sem quebra de linha). */
const SENHA_SMTP_SINTETICA = 'senha-smtp-sintetica-do-teste';

/** Arquivos que vivem na webroot (public/), não no app: o portão nunca os lista no manifesto. */
const SO_WEBROOT = new Set([
  'sw.js',
  'robots.txt',
  'entrada.css',
  'icones/favicon.svg',
  'fontes/inter-400.woff2',
  'fontes/cormorant-garamond-700.woff2',
  '.htaccess'
]);

/** Tipos aceitos no manifesto. Extensão fora da lista reprova a montagem (fail-closed, como a F4.2). */
const TIPOS: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

/** PNG 1x1 sintético (bytes inventados para a Júri; não é imagem real). */
const PNG_SINTETICO = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

function garantirSeguro(caminho: string): void {
  if (!caminho.includes('site-login-unico')) {
    throw new Error('ambiente fora de site-login-unico: recusado (L-53)');
  }
}

function listarArquivos(raiz: string, atual = raiz, saida: string[] = []): string[] {
  for (const nome of readdirSync(atual)) {
    const caminho = join(atual, nome);
    if (statSync(caminho).isDirectory()) listarArquivos(raiz, caminho, saida);
    else saida.push(relative(raiz, caminho).split(sep).join('/'));
  }
  return saida;
}

/** Chave do app: relativa, sem "..", sem barra inicial. Os itens da webroot não entram. */
function ehDoApp(chave: string): boolean {
  if (chave.startsWith('api/') || SO_WEBROOT.has(chave)) return false;
  return true;
}

function tipoDe(chave: string): string {
  const tipo = TIPOS[extname(chave).toLowerCase()];
  if (tipo === undefined) throw new Error(`extensão fora da lista de tipos: ${chave}`);
  return tipo;
}

function md5(caminho: string): string {
  return createHash('md5').update(readFileSync(caminho)).digest('hex');
}

/** Copia o dist do app para APP/atual e grava o manifesto por md5. Falha se o dist não existir. */
function montarApp(dist: string): void {
  if (!existsSync(join(dist, 'index.html')))
    throw new Error('dist sem index.html: rode o build antes');
  const atual = join(APP, 'atual');
  mkdirSync(atual, { recursive: true, mode: 0o700 });
  const arquivos: Record<string, { tipo: string; bytes: number; md5: string }> = {};
  for (const chave of listarArquivos(dist)) {
    if (!ehDoApp(chave)) continue;
    const origem = join(dist, chave);
    const destino = join(atual, chave);
    mkdirSync(dirname(destino), { recursive: true });
    copyFileSync(origem, destino);
    arquivos[chave] = { tipo: tipoDe(chave), bytes: statSync(destino).size, md5: md5(destino) };
  }
  writeFileSync(join(atual, 'manifesto.json'), JSON.stringify({ versao: 'e2e-portao', arquivos }));
}

/** Semeia contas e limite zerado pelo PHP (hash Argon2id, mesmo formato do núcleo). */
export function semearContas(): void {
  execFileSync('php', [join(import.meta.dirname, 'semear.php'), PRIVADO], {
    stdio: 'pipe',
    timeout: 60_000
  });
}

/** Sessões de testes anteriores somem: cookie de outro teste não pode valer no seguinte. */
function esvaziarSessoes(): void {
  const pasta = join(PRIVADO, 'sessoes');
  for (const nome of readdirSync(pasta)) rmSync(join(pasta, nome), { force: true });
}

/** Roteiro do SMTP falso (smtpFalso.php): vazio é o caminho feliz. Os testes de falha gravam as respostas que querem. */
export function definirRoteiroSmtp(roteiro: Record<string, unknown> = {}): void {
  writeFileSync(ROTEIRO_SMTP, JSON.stringify(roteiro));
}

/** Estado de um teste: contas novas, sessões vazias, limite zerado, SMTP falso com o roteiro feliz. */
export function resetarPrivado(): void {
  semearContas();
  esvaziarSessoes();
  definirRoteiroSmtp();
}

/** Monta o ambiente inteiro: privado com conteúdo sintético, imagem e app a partir do dist. */
export function prepararAmbiente(dist: string): void {
  garantirSeguro(AMBIENTE);
  rmSync(AMBIENTE, { recursive: true, force: true });
  mkdirSync(PRIVADO, { recursive: true, mode: 0o700 });
  semearContas();

  mkdirSync(PASTA_SMTP, { recursive: true, mode: 0o700 });
  definirRoteiroSmtp();
  const senhaSmtp = join(PRIVADO, 'smtp.senha');
  writeFileSync(senhaSmtp, SENHA_SMTP_SINTETICA);
  chmodSync(senhaSmtp, 0o600);

  const conteudo = join(PRIVADO, 'conteudo');
  writeFileSync(join(conteudo, 'interdisciplinar.json'), JSON.stringify(conteudoRestritoFalso()));
  writeFileSync(join(conteudo, 'juri.json'), '{"titulo":"fixture sintética","perguntas":[1,2]}');
  for (const arq of ['interdisciplinar.json', 'juri.json']) chmodSync(join(conteudo, arq), 0o600);

  const imagens = join(PRIVADO, 'imagens');
  writeFileSync(join(imagens, ID_IMAGEM_SINTETICA), PNG_SINTETICO);
  chmodSync(join(imagens, ID_IMAGEM_SINTETICA), 0o600);
  const acervo = {
    indice: [
      {
        id: ID_IMAGEM_SINTETICA,
        tipo: 'png',
        bytes: PNG_SINTETICO.length,
        sha256: createHash('sha256').update(PNG_SINTETICO).digest('hex')
      }
    ]
  };
  writeFileSync(join(PRIVADO, 'acervo.json'), JSON.stringify(acervo));
  chmodSync(join(PRIVADO, 'acervo.json'), 0o600);

  montarApp(dist);
}

/** Chave de um asset JS do app, para o teste de asset anônimo (sai do manifesto, não é fixa). */
export function chaveAssetJs(): string {
  const manifesto = JSON.parse(readFileSync(join(APP, 'atual', 'manifesto.json'), 'utf8')) as {
    arquivos: Record<string, unknown>;
  };
  const chave = Object.keys(manifesto.arquivos).find(
    (k) => k.startsWith('assets/') && k.endsWith('.js')
  );
  if (chave === undefined) throw new Error('manifesto sem asset JS');
  return chave;
}
