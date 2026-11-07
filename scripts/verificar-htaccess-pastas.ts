/**
 * Portão pós-build do .htaccess do pacote (7.3; reescrito em 07/11/2026, LU-F4.5).
 *
 * O .htaccess novo não tem mais lista de pastas: o que o servidor entrega sem o
 * portão PHP é só o que as regras RewriteRule de passagem (`- [L]`) liberam. O
 * portão confere, em ordem:
 *  1. as regras de passagem são exatamente a lista fechada PASSAGENS_ESPERADAS
 *     (qualquer liberação nova reprova, mesmo sem arquivo em dist);
 *  2. em dist, o que o .htaccess deixa passar direto é exatamente o que se espera:
 *     LITERAIS (sw.js, robots.txt, entrada.css, icones/favicon.svg) e os endpoints
 *     api/**.php fora de api/nucleo; cada um existe e passa; nada mais passa;
 *  3. api/nucleo/ é negado (regra F), com o .htaccess da pasta presente;
 *  4. dist/.htaccess é igual ao público (VERIFICAR_HTACCESS_REFERENCIA, padrão
 *     public/.htaccess);
 *  5. toda pasta de primeiro nível de dist é conhecida (api, assets, icones).
 *
 * Fica para verificar-webroot-sem-conteudo (F4.2), não aqui: que nada fora da lista
 * exista no webroot separado. Hoje dist ainda tem o app inteiro, e tudo que não é
 * passagem vai ao portão PHP por desenho.
 *
 * Variáveis (opcionais): DIST_PATH (padrão dist/), VERIFICAR_HTACCESS_REFERENCIA.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extrairRegras, veredito } from '../src/core/rotas/regrasHtaccess';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '..');
const DIST = resolve(process.env.DIST_PATH ?? join(RAIZ, 'dist'));
const REFERENCIA = resolve(
  process.env.VERIFICAR_HTACCESS_REFERENCIA ?? join(RAIZ, 'public/.htaccess')
);

/** Lista fechada: o texto exato das regras de passagem. Mudar exige mudar aqui, de propósito. */
const PASSAGENS_ESPERADAS = [
  '^(sw\\.js|robots\\.txt|entrada\\.css|icones/favicon\\.svg)$',
  '^api/[a-z0-9/-]+\\.php$'
];
const LITERAIS = ['sw.js', 'robots.txt', 'entrada.css', 'icones/favicon.svg'];
const OBRIGATORIOS = ['api/portao.php', 'api/saude.php', 'api/nucleo/.htaccess'];
const PASTAS_CONHECIDAS = new Set(['api', 'assets', 'icones']);

function ehPasta(caminho: string): boolean {
  return statSync(caminho, { throwIfNoEntry: false })?.isDirectory() ?? false;
}

function ehArquivo(caminho: string): boolean {
  return statSync(caminho, { throwIfNoEntry: false })?.isFile() ?? false;
}

function listarArquivos(pasta: string, base: string = pasta): string[] {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(pasta, entrada.name);
    if (entrada.isDirectory()) return listarArquivos(caminho, base);
    return [relative(base, caminho).split(sep).join('/')];
  });
}

/**
 * Endpoint da API: qualquer .php sob api/, fora de api/nucleo/. A checagem não usa a
 * regex da regra de passagem: um nome fora dela (maiúscula, underscore) tem de
 * reprovar aqui, não virar 404 calado em produção.
 */
function ehEndpoint(caminho: string): boolean {
  return (
    caminho.startsWith('api/') && caminho.endsWith('.php') && !caminho.startsWith('api/nucleo/')
  );
}

function principal(): number {
  if (!ehPasta(DIST)) {
    console.error(`verificar-htaccess-pastas: pasta ausente: ${DIST} (rode 'npm run build' antes)`);
    return 1;
  }
  if (!ehArquivo(join(DIST, '.htaccess'))) {
    console.error(`verificar-htaccess-pastas: .htaccess ausente em ${DIST}`);
    return 1;
  }
  if (!ehArquivo(REFERENCIA)) {
    console.error(`verificar-htaccess-pastas: referência ausente: ${REFERENCIA}`);
    return 1;
  }

  let divergencias = 0;
  const reprovar = (mensagem: string): void => {
    divergencias += 1;
    console.error(`verificar-htaccess-pastas: ${mensagem}`);
  };

  const textoDist = readFileSync(join(DIST, '.htaccess'), 'utf-8');
  const regras = extrairRegras(textoDist);
  const passagens = regras.filter((r) => r.veredito === 'passa').map((r) => r.padrao);

  // 1. lista fechada de regras de passagem
  const ordenadas = (lista: readonly string[]) => [...lista].sort().join(' | ');
  if (ordenadas(passagens) !== ordenadas(PASSAGENS_ESPERADAS)) {
    reprovar(
      `regra de passagem fora da lista fechada (liberada sem portão): ${passagens.join(' | ')}`
    );
  }
  if (regras.some((r) => r.veredito === 'desconhecido')) {
    reprovar('regra do .htaccess não reconhecida pela simulação (falha fechada)');
  }

  // 4. dist/.htaccess igual ao público
  if (!readFileSync(join(DIST, '.htaccess')).equals(readFileSync(REFERENCIA))) {
    reprovar(`dist/.htaccess difere de ${REFERENCIA}`);
  }

  // 2. o que passa direto em dist é exatamente o esperado
  const arquivos = listarArquivos(DIST);
  const diretos = arquivos.filter((rel) => veredito(rel, regras) === 'passa');
  const esperadosDiretos = [...LITERAIS, ...arquivos.filter(ehEndpoint)];

  for (const literal of LITERAIS) {
    if (!arquivos.includes(literal)) reprovar(`dist/${literal} é liberado sem portão e não existe`);
  }
  for (const esperado of esperadosDiretos) {
    if (!diretos.includes(esperado)) {
      reprovar(
        `dist/${esperado} deveria passar direto pelo .htaccess e não passa (veredito: ${veredito(esperado, regras)})`
      );
    }
  }
  for (const rel of diretos) {
    if (!esperadosDiretos.includes(rel)) {
      reprovar(`dist/${rel} é liberado sem portão e não está na lista esperada`);
    }
  }

  // 3. api/nucleo é negado
  for (const rel of arquivos.filter((r) => r.startsWith('api/nucleo/'))) {
    if (veredito(rel, regras) !== 'nega') {
      reprovar(`dist/${rel} está em api/nucleo e o .htaccess não o nega`);
    }
  }

  // 5. pastas e arquivos obrigatórios
  for (const pasta of readdirSync(DIST, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)) {
    if (!PASTAS_CONHECIDAS.has(pasta)) {
      reprovar(`dist/${pasta}/ é pasta nova sem decisão no .htaccess (pasta nova)`);
    }
  }
  for (const obrigatorio of OBRIGATORIOS) {
    if (!arquivos.includes(obrigatorio)) {
      reprovar(`dist/${obrigatorio} é obrigatório no pacote e não está lá`);
    }
  }

  if (regras.length === 0 || arquivos.length === 0) {
    reprovar('lista vazia ou pasta sem arquivo é portão quebrado (piso de varredura)');
  }

  console.log(
    `htaccess: regras=${regras.length} / passagens diretas=${diretos.length} / arquivos analisados=${arquivos.length} / divergências=${divergencias}`
  );

  return divergencias > 0 ? 1 : 0;
}

process.exitCode = principal();
