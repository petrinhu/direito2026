/**
 * Separa o dist em webroot/ e app/ (plano do CTO do login único, 1.1 e 7.1; LU-F4.2).
 *
 * Saída (SAIDA = PACOTE_SAIDA, padrão dist-pacote/):
 *   SAIDA/webroot/   só a lista fechada de ehDoWebroot (sem conteúdo, sem app)
 *   SAIDA/app/       o resto do dist, com extensão prevista
 *   SAIDA/app/manifesto.json  {"versao", "arquivos": {"<caminho>":{"tipo","bytes","md5"}}} de cada
 *                    arquivo do app, exceto o próprio manifesto. Mesmo formato que o portão PHP lê
 *                    (portao.php, d26_portao_manifesto): `tipo` é o Content-Type (LU-F4.3, L-15).
 *
 * Falha fechada: dist ausente ou vazio, arquivo sem lista (extensão, api fora da regra,
 * 404.html, nome reservado), item obrigatório ausente, saída que engole o dist. A saída
 * anterior é apagada só em SAIDA/webroot e SAIDA/app, e só depois de todas as checagens
 * passarem. Depois de escrever, reconta o que foi escrito.
 *
 * Variáveis (opcionais): DIST_PATH (padrão dist/), PACOTE_SAIDA (padrão dist-pacote/).
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  OBRIGATORIOS_APP,
  OBRIGATORIOS_WEBROOT,
  classificar,
  listarArquivos,
  md5Do,
  tipoDoApp
} from './apoio/pacotePublico';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '..');
const DIST = resolve(process.env.DIST_PATH ?? join(RAIZ, 'dist'));
const SAIDA = resolve(process.env.PACOTE_SAIDA ?? join(RAIZ, 'dist-pacote'));

function ehPasta(caminho: string): boolean {
  return statSync(caminho, { throwIfNoEntry: false })?.isDirectory() ?? false;
}

function reprovar(linhas: readonly string[], encontrados: number, falharam: number): number {
  for (const linha of linhas) console.error(`separar-pacote: ${linha}`);
  console.error(
    `separar-pacote: encontrados=${encontrados} analisados=${encontrados} falharam=${falharam}`
  );
  return 1;
}

/** Caminhos obrigatórios que não estão na lista. */
function faltantes(obrigatorios: readonly string[], previstos: readonly string[]): string[] {
  return obrigatorios.filter((caminho) => !previstos.includes(caminho));
}

/** Versão do package.json, gravada no manifesto (rastreio: qual release está no ar). */
function versaoDoPacote(): string {
  const pacote = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf-8')) as {
    version?: unknown;
  };
  if (typeof pacote.version !== 'string' || pacote.version === '') {
    throw new Error('package.json sem version: o manifesto não tem como dizer qual release é');
  }
  return pacote.version;
}

function escreverPacote(webroot: readonly string[], app: readonly string[]): void {
  rmSync(join(SAIDA, 'webroot'), { recursive: true, force: true });
  rmSync(join(SAIDA, 'app'), { recursive: true, force: true });
  for (const caminho of webroot) {
    mkdirSync(dirname(join(SAIDA, 'webroot', caminho)), { recursive: true });
    copyFileSync(join(DIST, caminho), join(SAIDA, 'webroot', caminho));
  }
  const arquivos: Record<string, { tipo: string; bytes: number; md5: string }> = {};
  for (const caminho of app) {
    const origem = join(DIST, caminho);
    const destino = join(SAIDA, 'app', caminho);
    mkdirSync(dirname(destino), { recursive: true });
    copyFileSync(origem, destino);
    arquivos[caminho] = {
      tipo: tipoDoApp(caminho) ?? '',
      bytes: statSync(origem).size,
      md5: md5Do(origem)
    };
  }
  const manifesto = { versao: versaoDoPacote(), arquivos };
  writeFileSync(join(SAIDA, 'app', 'manifesto.json'), `${JSON.stringify(manifesto, null, 2)}\n`);
}

function principal(): number {
  if (!ehPasta(DIST)) {
    console.error(`separar-pacote: pasta ausente: ${DIST} (rode 'npm run build' antes)`);
    return 1;
  }
  if (SAIDA === RAIZ || SAIDA === DIST || DIST.startsWith(SAIDA + sep)) {
    console.error(
      'separar-pacote: saída não pode ser o dist, a raiz do repositório, nem conter o dist'
    );
    return 1;
  }

  const caminhos = listarArquivos(DIST);
  if (caminhos.length === 0) {
    console.error(
      'separar-pacote: encontrados=0 analisados=0 falharam=0 (dist vazio é varredura quebrada, L-36)'
    );
    return 1;
  }

  const { webroot, app, razoes } = classificar(caminhos);
  if (razoes.length > 0) return reprovar(razoes, caminhos.length, razoes.length);

  const ausentes = [
    ...faltantes(OBRIGATORIOS_WEBROOT, webroot).map((c) => `ausente no webroot: ${c}`),
    ...faltantes(OBRIGATORIOS_APP, app).map((c) => `ausente no app: ${c}`)
  ];
  if (ausentes.length > 0) return reprovar(ausentes, caminhos.length, ausentes.length);
  if (webroot.length === 0 || app.length === 0) {
    return reprovar(['webroot ou app vazio é varredura quebrada (piso)'], caminhos.length, 1);
  }

  escreverPacote(webroot, app);

  const escritosWebroot = existsSync(join(SAIDA, 'webroot'))
    ? listarArquivos(join(SAIDA, 'webroot'))
    : [];
  const escritosApp = listarArquivos(join(SAIDA, 'app'));
  if (escritosWebroot.length !== webroot.length || escritosApp.length !== app.length + 1) {
    return reprovar(
      [
        `conferência pós-escrita divergiu: webroot ${escritosWebroot.length}/${webroot.length}, app ${escritosApp.length}/${app.length + 1}`
      ],
      caminhos.length,
      1
    );
  }

  console.log(
    `separar-pacote: encontrados=${caminhos.length} analisados=${caminhos.length} falharam=0`
  );
  console.log(
    `separar-pacote: webroot=${webroot.length} app=${app.length} manifesto=${app.length} (em ${SAIDA})`
  );
  return 0;
}

process.exitCode = principal();
