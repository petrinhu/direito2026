import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  APP_ESPERADO,
  RAIZ_CONTEUDO_SINTETICO,
  TERMO_SINTETICO,
  WEBROOT_ESPERADO,
  novidadesJson,
  plantar,
  plantarDist,
  type EntradaSintetica
} from './apoio/pacoteSintetico';

/**
 * Separador do pacote (scripts/separar-pacote.ts, LU-F4.2, plano 1.1 e 7.1). Cada
 * caso planta um dist sintético e prova o critério que a sabotagem quebra (L-36).
 * Toda asserção negativa confere também a MENSAGEM da razão: rc 1 sozinho pode vir
 * de um script ausente e não provaria nada.
 *
 * O aviso de versão (AV-F4) acrescenta o versao.json do pacote, montado de
 * docs/versoes/novidades.json. Tudo que vem de fora é sintético aqui: currículo
 * (RAIZ_CONTEUDO_SINTETICO), termos (TERMO_SINTETICO) e novidades. A lista privada
 * nunca é aberta pelos testes.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SEPARADOR = join(RAIZ, 'scripts/separar-pacote.ts');
const BUILD = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf-8')) as {
  scripts: Record<string, string>;
  version: string;
};

let tmp: string;
let dist: string;
let saida: string;

function rodar(distCaminho: string = dist, saidaCaminho: string = saida) {
  return spawnSync(process.execPath, ['--import', 'tsx', SEPARADOR], {
    cwd: RAIZ,
    encoding: 'utf-8',
    env: {
      ...process.env,
      DIST_PATH: distCaminho,
      PACOTE_SAIDA: saidaCaminho,
      NOVIDADES_JSON: join(tmp, 'novidades.json'),
      CONTEUDO_RAIZ: RAIZ_CONTEUDO_SINTETICO,
      VERIFICAR_PROIBICOES_TERMOS: join(tmp, 'termos.txt')
    }
  });
}

function saidaCompleta(r: { stdout: string; stderr: string }): string {
  return r.stdout + r.stderr;
}

/** Caminhos relativos (com `/`) de todos os arquivos de uma pasta, ordenados. */
function listar(pasta: string, base: string = pasta): string[] {
  return readdirSync(pasta, { withFileTypes: true })
    .flatMap((entrada) => {
      const caminho = join(pasta, entrada.name);
      if (entrada.isDirectory()) return listar(caminho, base);
      return [relative(base, caminho).split(sep).join('/')];
    })
    .sort();
}

function md5(caminho: string): string {
  return createHash('md5').update(readFileSync(caminho)).digest('hex');
}

function escreverNovidades(versoes: readonly EntradaSintetica[]): void {
  writeFileSync(join(tmp, 'novidades.json'), novidadesJson(versoes));
}

function versaoPublicada(): {
  versao: string;
  historico: { versao: string; novidades: string[] }[];
} {
  return JSON.parse(readFileSync(join(saida, 'app/versao.json'), 'utf-8')) as {
    versao: string;
    historico: { versao: string; novidades: string[] }[];
  };
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'separar-pacote-'));
  dist = join(tmp, 'dist');
  saida = join(tmp, 'saida');
  plantarDist(dist);
  escreverNovidades([]);
  writeFileSync(join(tmp, 'termos.txt'), `${TERMO_SINTETICO}\n`);
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('separador do pacote', () => {
  it('webroot recebe só a lista fechada; app recebe o resto, com o versao.json gerado', () => {
    const r = rodar();
    expect(r.status).toBe(0);
    expect(listar(join(saida, 'webroot'))).toEqual([...WEBROOT_ESPERADO].sort());
    expect(listar(join(saida, 'app'))).toEqual(
      ['manifesto.json', 'versao.json', ...APP_ESPERADO].sort()
    );
  });

  it('manifesto cobre o app, sem ele mesmo, com tipo, bytes e md5 certos', () => {
    const r = rodar();
    expect(r.status).toBe(0);
    // Formato que o portão lê (portao.php, d26_portao_manifesto): {"versao", "arquivos": {...}} (LU-F4.3, L-15).
    const manifesto = JSON.parse(readFileSync(join(saida, 'app/manifesto.json'), 'utf-8')) as {
      versao: string;
      arquivos: Record<string, { tipo: string; bytes: number; md5: string }>;
    };
    expect(manifesto.versao).toBe(BUILD.version);
    const arquivos = manifesto.arquivos;
    expect(Object.keys(arquivos).sort()).toEqual(['versao.json', ...APP_ESPERADO].sort());
    for (const caminho of ['versao.json', ...APP_ESPERADO]) {
      const entrada = arquivos[caminho];
      expect(Object.keys(entrada ?? {}).sort()).toEqual(['bytes', 'md5', 'tipo']);
      expect(entrada?.md5).toBe(md5(join(saida, 'app', caminho)));
      expect(entrada?.bytes).toBe(statSync(join(saida, 'app', caminho)).size);
    }
    expect(arquivos['index.html']?.tipo).toBe('text/html');
    expect(arquivos['assets/busca-indice.json']?.tipo).toBe('application/json');
    expect(arquivos['assets/fonte-abc123.woff2']?.tipo).toBe('font/woff2');
    expect(arquivos['versao.json']?.tipo).toBe('application/json');
  });

  it('saída informa a contagem da varredura e falharam=0', () => {
    const r = rodar();
    expect(r.status).toBe(0);
    expect(saidaCompleta(r)).toContain(
      `encontrados=${WEBROOT_ESPERADO.length + APP_ESPERADO.length} analisados=${WEBROOT_ESPERADO.length + APP_ESPERADO.length} falharam=0`
    );
  });

  it.each([
    ['assets/x.zzz', 'extensão não prevista'],
    ['assets/x.js.map', 'extensão não prevista'],
    ['assets/x.php', 'extensão não prevista'],
    ['404.html', '404 estático saiu'],
    ['manifesto.json', 'nome reservado'],
    ['api/nucleo/notas.txt', 'api fora da regra']
  ])('%s no dist reprova com a razão, sem escrever nada', (arquivo, razao) => {
    plantar(dist, arquivo, 'sintetico');
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain(razao);
    expect(existsSync(join(saida, 'webroot'))).toBe(false);
    expect(existsSync(join(saida, 'app'))).toBe(false);
  });

  it.each(['.htaccess', 'sw.js', 'robots.txt', 'api/nucleo/.htaccess', 'index.html'])(
    'sem %s o separador reprova e nomeia o que falta',
    (arquivo) => {
      rmSync(join(dist, arquivo));
      const r = rodar();
      expect(r.status).toBe(1);
      expect(saidaCompleta(r)).toContain(arquivo);
    }
  );

  it('dist vazio reprova (piso de varredura, L-36)', () => {
    rmSync(dist, { recursive: true, force: true });
    mkdirSync(dist);
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('encontrados=0');
  });

  it('dist ausente reprova (falha fechada)', () => {
    const r = rodar(join(tmp, 'nao-existe'));
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('pasta ausente');
  });

  it('saída igual ao dist reprova e não apaga o dist', () => {
    const r = rodar(dist, dist);
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('saída não pode ser o dist');
    expect(existsSync(join(dist, 'index.html'))).toBe(true);
  });

  it('nova execução limpa a saída anterior (sem arquivo velho sobrando)', () => {
    plantar(saida, 'app/velho.js', 'antigo');
    plantar(saida, 'webroot/assets/velho.js', 'antigo');
    const r = rodar();
    expect(r.status).toBe(0);
    expect(existsSync(join(saida, 'app/velho.js'))).toBe(false);
    expect(existsSync(join(saida, 'webroot/assets/velho.js'))).toBe(false);
  });

  it('o build separa o pacote entre o vite build e o portão da Júri, sem cp 404', () => {
    const build = BUILD.scripts.build ?? '';
    expect(build).not.toContain('dist/404.html');
    const posVite = build.indexOf('vite build');
    const posSeparar = build.indexOf('scripts/separar-pacote.ts');
    const posJuri = build.indexOf('scripts/verificar-juri-fora-do-pacote.ts');
    expect(posVite).toBeGreaterThan(-1);
    expect(posSeparar).toBeGreaterThan(posVite);
    expect(posJuri).toBeGreaterThan(posSeparar);
    expect(build).toContain('VERIFICAR_JURI_PACOTES=dist-pacote/webroot,dist-pacote/app');
  });
});

describe('versao.json do pacote (AV-F4, plano do aviso de versão)', () => {
  it('pacote sem versao.json (o build nunca traz um): o separador grava o dele, com histórico vazio', () => {
    expect(existsSync(join(dist, 'versao.json'))).toBe(false);
    const r = rodar();
    expect(r.status).toBe(0);
    expect(versaoPublicada()).toEqual({ versao: BUILD.version, historico: [] });
  });

  it('versao.json vindo do build é recusado como nome reservado, sem escrever nada', () => {
    plantar(dist, 'versao.json', '{"versao":"0.0.0.0","historico":[]}');
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('nome reservado');
    expect(saidaCompleta(r)).toContain('versao.json');
    expect(existsSync(join(saida, 'app'))).toBe(false);
  });

  it('entrada do histórico mais nova que o package.json reprova', () => {
    escreverNovidades([{ versao: '1.13.0.0', novidades: ['tecnica'] }]);
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('1.13.0.0');
    expect(saidaCompleta(r)).toContain('package.json');
    expect(existsSync(join(saida, 'app'))).toBe(false);
  });

  it('entrada da versão do package.json entra no topo do histórico (gêmeo positivo)', () => {
    escreverNovidades([
      { versao: '1.12.0.0', novidades: ['tecnica'] },
      { versao: BUILD.version, novidades: ['tecnica'] }
    ]);
    const r = rodar();
    expect(r.status).toBe(0);
    expect(versaoPublicada().historico.map((e) => e.versao)).toEqual([BUILD.version, '1.12.0.0']);
  });

  it('histórico com mais de 10 corta nas 10 mais novas, em ordem numérica (1.11.0.10 vem antes de 1.11.0.9)', () => {
    const versoes = Array.from({ length: 12 }, (_, i) => ({
      versao: `1.11.0.${i + 1}`,
      novidades: ['tecnica']
    })).reverse();
    escreverNovidades(versoes);
    const r = rodar();
    expect(r.status).toBe(0);
    const historico = versaoPublicada().historico.map((e) => e.versao);
    expect(historico).toHaveLength(10);
    expect(historico[0]).toBe('1.11.0.12');
    expect(historico[9]).toBe('1.11.0.3');
    expect(historico).not.toContain('1.11.0.1');
    expect(historico).not.toContain('1.11.0.2');
  });

  it('arquivo acima de 4 KB reprova, com a razão do teto', () => {
    // 10 versões, 5 novidades cada, com letras acentuadas (2 bytes em UTF-8): passa de 4096 bytes.
    const versoes = Array.from({ length: 10 }, (_, v) => ({
      versao: `1.11.0.${v + 1}`,
      novidades: Array.from(
        { length: 5 },
        (_, n) => `usabilidade:${'é'.repeat(37)}${String(v * 5 + n).padStart(2, '0')}`
      )
    }));
    escreverNovidades(versoes);
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('4 KB');
  });

  it('o mesmo formato com texto ASCII curto cabe no teto (gêmeo positivo do teto de 4 KB)', () => {
    const versoes = Array.from({ length: 10 }, (_, v) => ({
      versao: `1.11.0.${v + 1}`,
      novidades: Array.from(
        { length: 5 },
        (_, n) => `usabilidade:Tocador de radio ${String(v * 5 + n).padStart(2, '0')}`
      )
    }));
    escreverNovidades(versoes);
    const r = rodar();
    expect(r.status).toBe(0);
    expect(statSync(join(saida, 'app/versao.json')).size).toBeLessThan(4096);
  });

  it('texto que falha nas travas reprova (dupla barreira), sem escrever nada', () => {
    escreverNovidades([{ versao: BUILD.version, novidades: [`usabilidade:${TERMO_SINTETICO}`] }]);
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('não passa nas travas');
    expect(existsSync(join(saida, 'app'))).toBe(false);
  });

  it('texto limpo do mesmo formato passa e aparece com o prefixo "Novo:" (gêmeo positivo das travas)', () => {
    escreverNovidades([{ versao: BUILD.version, novidades: ['usabilidade:Tocador de radio'] }]);
    const r = rodar();
    expect(r.status).toBe(0);
    expect(versaoPublicada().historico[0]?.novidades).toEqual(['Novo: Tocador de radio']);
  });

  it('novidades.json ausente reprova com mensagem clara', () => {
    rmSync(join(tmp, 'novidades.json'));
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('novidades.json ausente');
    expect(existsSync(join(saida, 'app'))).toBe(false);
  });

  it('novidades.json com JSON inválido reprova com mensagem clara', () => {
    writeFileSync(join(tmp, 'novidades.json'), '{"versoes": [');
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('JSON inválido');
    expect(existsSync(join(saida, 'app'))).toBe(false);
  });

  it('novidades.json ainda cifrado (cabeçalho GITCRYPT, árvore sem chave) reprova com mensagem clara', () => {
    writeFileSync(
      join(tmp, 'novidades.json'),
      Buffer.concat([Buffer.from('\0GITCRYPT\0', 'binary'), Buffer.from([1, 2, 3, 4])])
    );
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('cifrado');
    expect(saidaCompleta(r)).toContain('git-crypt');
    expect(existsSync(join(saida, 'app'))).toBe(false);
  });

  it('sem entrada para a versão do package.json: o histórico não inventa a versão nova (aviso sem lista)', () => {
    escreverNovidades([{ versao: '1.12.0.0', novidades: ['tecnica'] }]);
    const r = rodar();
    expect(r.status).toBe(0);
    const publicado = versaoPublicada();
    expect(publicado.versao).toBe(BUILD.version);
    expect(publicado.historico.map((e) => e.versao)).toEqual(['1.12.0.0']);
    expect(publicado.historico.some((e) => e.versao === BUILD.version)).toBe(false);
  });

  it('cadeira e usabilidade viram o texto final que o aluno vê, e tecnica vira "Melhoria técnica"', () => {
    escreverNovidades([
      {
        versao: BUILD.version,
        novidades: ['cadeira:p1/filosofia-sintetica', 'usabilidade:Tocador de radio', 'tecnica']
      }
    ]);
    const r = rodar();
    expect(r.status).toBe(0);
    const [cadeira, usabilidade, tecnica] = versaoPublicada().historico[0]?.novidades ?? [];
    expect(cadeira).toMatch(/^Cadeira Sintética \(.+\) atualizada$/);
    expect(usabilidade).toBe('Novo: Tocador de radio');
    expect(tecnica).toBe('Melhoria técnica');
  });

  it('cadeira de área restrita não é anunciada por nome', () => {
    escreverNovidades([{ versao: BUILD.version, novidades: ['cadeira:p1/area-sintetica'] }]);
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('não é anunciada por nome');
  });

  it('cadeira que não existe no currículo reprova', () => {
    escreverNovidades([{ versao: BUILD.version, novidades: ['cadeira:p1/nao-existe'] }]);
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('cadeira não existe no currículo');
  });

  it('versão com zero novidades reprova (publicar exige ao menos uma)', () => {
    escreverNovidades([{ versao: BUILD.version, novidades: [] }]);
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('sem novidade');
  });

  it('versão com mais de 5 novidades reprova', () => {
    escreverNovidades([{ versao: BUILD.version, novidades: Array(6).fill('tecnica') }]);
    const r = rodar();
    expect(r.status).toBe(1);
    expect(saidaCompleta(r)).toContain('no máximo 5');
  });

  it('versões vazias geram histórico vazio (estado inicial do repositório)', () => {
    const r = rodar();
    expect(r.status).toBe(0);
    expect(versaoPublicada()).toEqual({ versao: BUILD.version, historico: [] });
  });
});
