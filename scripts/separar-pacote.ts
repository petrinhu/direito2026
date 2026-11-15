/**
 * Separa o dist em webroot/ e app/ (plano do CTO do login único, 1.1 e 7.1; LU-F4.2).
 *
 * Saída (SAIDA = PACOTE_SAIDA, padrão dist-pacote/):
 *   SAIDA/webroot/   só a lista fechada de ehDoWebroot (sem conteúdo, sem app)
 *   SAIDA/app/       o resto do dist, com extensão prevista
 *   SAIDA/app/manifesto.json  {"versao", "arquivos": {"<caminho>":{"tipo","bytes","md5"}}} de cada
 *                    arquivo do app, exceto o próprio manifesto. Mesmo formato que o portão PHP lê
 *                    (portao.php, d26_portao_manifesto): `tipo` é o Content-Type (LU-F4.3, L-15).
 *   SAIDA/app/versao.json     histórico do aviso de versão nova (AV-F4): {"versao", "historico"},
 *                    montado de docs/versoes/novidades.json e do currículo. Teto: 10 versões, 4 KB.
 *                    Entra no manifesto, como qualquer arquivo do app.
 *
 * Falha fechada: dist ausente ou vazio, arquivo sem lista (extensão, api fora da regra,
 * 404.html, nome reservado, versao.json vindo do build), item obrigatório ausente, novidades
 * inválidas ou ilegíveis, saída que engole o dist. A saída anterior é apagada só em
 * SAIDA/webroot e SAIDA/app, e só depois de todas as checagens passarem. Depois de escrever,
 * confere a listagem gravada (obrigatórios presentes) e reconta o que foi escrito.
 *
 * Variáveis (opcionais): DIST_PATH (padrão dist/), PACOTE_SAIDA (padrão dist-pacote/),
 * NOVIDADES_JSON (padrão docs/versoes/novidades.json), CONTEUDO_RAIZ (padrão src/conteudo/).
 */
import { createHash } from 'node:crypto';
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
import { curriculoDoDisco, RAIZ_DO_CONTEUDO } from './apoio/conteudoDoDisco';
import {
  GERADOS_NO_APP,
  OBRIGATORIOS_APP,
  OBRIGATORIOS_WEBROOT,
  VERSAO_PUBLICADA,
  classificar,
  listarArquivos,
  md5Do,
  tipoDoApp
} from './apoio/pacotePublico';
import { montarVersaoPublicada, lerNovidades, type ResultadoVersao } from './apoio/versaoPublicada';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '..');
const DIST = resolve(process.env.DIST_PATH ?? join(RAIZ, 'dist'));
const SAIDA = resolve(process.env.PACOTE_SAIDA ?? join(RAIZ, 'dist-pacote'));
const NOVIDADES = resolve(process.env.NOVIDADES_JSON ?? join(RAIZ, 'docs/versoes/novidades.json'));
const CONTEUDO = resolve(process.env.CONTEUDO_RAIZ ?? RAIZ_DO_CONTEUDO);

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

/** Lê docs/versoes/novidades.json e o currículo, e monta o texto do versao.json. Não grava nada. */
async function montarVersaoDoPacote(): Promise<ResultadoVersao<{ versao: string; corpo: string }>> {
  let versao: string;
  try {
    versao = versaoDoPacote();
  } catch (erro) {
    return { ok: false, motivo: mensagem(erro) };
  }
  let bytes: Buffer;
  try {
    bytes = readFileSync(NOVIDADES);
  } catch (erro) {
    const ausente = (erro as { code?: unknown }).code === 'ENOENT';
    return {
      ok: false,
      motivo: ausente
        ? 'novidades.json ausente (esperado em docs/versoes/novidades.json)'
        : `novidades.json ilegível: ${mensagem(erro)}`
    };
  }
  const lida = lerNovidades(bytes);
  if (!lida.ok) return lida;
  let curriculo: Awaited<ReturnType<typeof curriculoDoDisco>>;
  try {
    curriculo = await curriculoDoDisco(CONTEUDO);
  } catch (erro) {
    return { ok: false, motivo: `currículo ilegível: ${mensagem(erro)}` };
  }
  const montada = montarVersaoPublicada({ versaoDoPacote: versao, entradas: lida.valor, curriculo });
  return montada.ok ? { ok: true, valor: { versao, corpo: montada.valor } } : montada;
}

function escreverPacote(
  webroot: readonly string[],
  app: readonly string[],
  versao: string,
  versaoJson: string
): void {
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
  const destinoVersao = join(SAIDA, 'app', VERSAO_PUBLICADA);
  mkdirSync(dirname(destinoVersao), { recursive: true });
  writeFileSync(destinoVersao, versaoJson);
  arquivos[VERSAO_PUBLICADA] = {
    tipo: tipoDoApp(VERSAO_PUBLICADA) ?? '',
    bytes: Buffer.byteLength(versaoJson, 'utf-8'),
    md5: createHash('md5').update(versaoJson).digest('hex')
  };
  const manifesto = { versao, arquivos };
  writeFileSync(join(SAIDA, 'app', 'manifesto.json'), `${JSON.stringify(manifesto, null, 2)}\n`);
}

async function principal(): Promise<number> {
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

  // O versao.json não vem do dist: o separador o gera, então conta como previsto.
  const ausentes = [
    ...faltantes(OBRIGATORIOS_WEBROOT, webroot).map((c) => `ausente no webroot: ${c}`),
    ...faltantes(OBRIGATORIOS_APP, [...app, ...GERADOS_NO_APP]).map((c) => `ausente no app: ${c}`)
  ];
  if (ausentes.length > 0) return reprovar(ausentes, caminhos.length, ausentes.length);
  if (webroot.length === 0 || app.length === 0) {
    return reprovar(['webroot ou app vazio é varredura quebrada (piso)'], caminhos.length, 1);
  }

  const montada = await montarVersaoDoPacote();
  if (!montada.ok) return reprovar([montada.motivo], caminhos.length, 1);

  escreverPacote(webroot, app, montada.valor.versao, montada.valor.corpo);

  const escritosWebroot = existsSync(join(SAIDA, 'webroot'))
    ? listarArquivos(join(SAIDA, 'webroot'))
    : [];
  const escritosApp = listarArquivos(join(SAIDA, 'app'));
  const ausentesNaSaida = faltantes(OBRIGATORIOS_APP, escritosApp).map(
    (c) => `ausente na saída gravada: ${c}`
  );
  if (ausentesNaSaida.length > 0) {
    return reprovar(ausentesNaSaida, caminhos.length, ausentesNaSaida.length);
  }
  const esperadosApp = app.length + GERADOS_NO_APP.length;
  if (escritosWebroot.length !== webroot.length || escritosApp.length !== esperadosApp) {
    return reprovar(
      [
        `conferência pós-escrita divergiu: webroot ${escritosWebroot.length}/${webroot.length}, app ${escritosApp.length}/${esperadosApp}`
      ],
      caminhos.length,
      1
    );
  }

  console.log(
    `separar-pacote: encontrados=${caminhos.length} analisados=${caminhos.length} falharam=0`
  );
  console.log(
    `separar-pacote: webroot=${webroot.length} app=${app.length} manifesto=${escritosApp.length - 1} (em ${SAIDA})`
  );
  return 0;
}

function mensagem(erro: unknown): string {
  return erro instanceof Error ? erro.message : String(erro);
}

process.exitCode = await principal();
