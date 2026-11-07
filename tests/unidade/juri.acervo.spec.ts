import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  jpegSintetico,
  pngSintetico,
  SENTINELAS_METADADO,
  webpSintetico
} from './apoio/imagensSinteticas';
import {
  criarDirTeste,
  escreverArquivos,
  lerJson,
  limparDirsTeste,
  rodarFerramenta
} from './apoio/acervoFerramenta';

const LONGO = 120_000;
const NOMES_ORIGINAIS = ['a.png', 'b.jpg', 'c.webp'];
const RE_ID = /^[0-9a-f]{32}$/;

/** Pasta de originais com três formatos: PNG com tEXt, JPEG com EXIF e COM (3 componentes) e WebP com EXIF. */
function originaisBase(): string {
  const origem = join(criarDirTeste(), 'originais');
  mkdirSync(origem, { mode: 0o700 });
  escreverArquivos(origem, {
    'a.png': pngSintetico(),
    'b.jpg': jpegSintetico(3),
    'c.webp': webpSintetico()
  });
  return origem;
}

function novaSaida(): string {
  return join(criarDirTeste(), 'saida');
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/** Nome -> sha256 de cada arquivo de uma pasta (só o primeiro nível). */
function fotografarPasta(pasta: string): Record<string, string> {
  const mapa: Record<string, string> = {};
  for (const nome of readdirSync(pasta).sort()) {
    mapa[nome] = sha256(new Uint8Array(readFileSync(join(pasta, nome))));
  }
  return mapa;
}

async function prepararOk(origem: string, saida: string): Promise<void> {
  const r = await rodarFerramenta(['preparar', '--originais', origem, '--saida', saida]);
  expect(r.codigo, `preparar: ${r.stderr}`).toBe(0);
}

async function conferirCom(saida: string) {
  return rodarFerramenta(['conferir', '--saida', saida]);
}

interface EntradaLida {
  id: string;
  tipo: string;
  bytes: number;
  sha256: string;
}

function indiceDe(saida: string): EntradaLida[] {
  return lerJson(join(saida, 'acervo.json')).indice as EntradaLida[];
}

/**
 * Troca o conteúdo de um arquivo da saída e alinha acervo.json E conferencia.tsv (bytes e sha256),
 * para que a única coisa que reprove seja a etiqueta, e não a divergência entre os dois arquivos.
 */
function trocarConteudoNoIndice(saida: string, id: string, novo: Uint8Array): void {
  writeFileSync(join(saida, 'imagens', id), novo, { mode: 0o600 });
  const caminhoIndice = join(saida, 'acervo.json');
  const acervo = lerJson(caminhoIndice);
  const entrada = (acervo.indice as EntradaLida[]).find((e) => e.id === id);
  if (entrada === undefined) throw new Error('id de teste fora do índice');
  entrada.bytes = novo.byteLength;
  entrada.sha256 = sha256(novo);
  writeFileSync(caminhoIndice, JSON.stringify(acervo), { mode: 0o600 });
  const linhas = (acervo.indice as EntradaLida[])
    .map((e) => `${e.id}\t${e.sha256}\t${e.bytes}`)
    .sort();
  writeFileSync(join(saida, 'conferencia.tsv'), `id\tsha256\tbytes\n${linhas.join('\n')}\n`, {
    mode: 0o600
  });
}

afterEach(() => {
  limparDirsTeste();
});

describe('preparar e conferir: ida e volta', () => {
  it(
    'preparar grava a saída e conferir a aceita, para PNG, JPEG e WebP',
    async () => {
      const origem = originaisBase();
      const saida = novaSaida();
      const p = await rodarFerramenta(['preparar', '--originais', origem, '--saida', saida]);
      expect(p.codigo, p.stderr).toBe(0);
      const c = await conferirCom(saida);
      expect(c.codigo, c.stderr).toBe(0);
      expect(c.stdout).toContain('conferido: 3 imagens');
    },
    LONGO
  );

  it(
    'preparar não escreve nada no stdout: não há senha nem segredo para imprimir',
    async () => {
      const r = await rodarFerramenta([
        'preparar',
        '--originais',
        originaisBase(),
        '--saida',
        novaSaida()
      ]);
      expect(r.codigo, r.stderr).toBe(0);
      expect(r.stdout).toBe('');
    },
    LONGO
  );

  it(
    'a saída tem só acervo.json, conferencia.tsv e a pasta imagens/, sem credencial nem chave',
    async () => {
      const saida = novaSaida();
      await prepararOk(originaisBase(), saida);
      expect(readdirSync(saida).sort()).toEqual(['acervo.json', 'conferencia.tsv', 'imagens']);
    },
    LONGO
  );

  it(
    'acervo.json tem só a raiz indice, sem kid; cada entrada tem exatamente id, tipo, bytes e sha256 verdadeiros',
    async () => {
      const saida = novaSaida();
      await prepararOk(originaisBase(), saida);
      const acervo = lerJson(join(saida, 'acervo.json'));
      expect(Object.keys(acervo)).toEqual(['indice']);
      expect(acervo.indice).toHaveLength(3);
      for (const entrada of indiceDe(saida)) {
        expect(Object.keys(entrada).sort()).toEqual(['bytes', 'id', 'sha256', 'tipo']);
        expect(entrada.id).toMatch(RE_ID);
        expect(['jpeg', 'png', 'webp']).toContain(entrada.tipo);
        const bruto = new Uint8Array(readFileSync(join(saida, 'imagens', entrada.id)));
        expect(entrada.bytes).toBe(bruto.byteLength);
        expect(entrada.sha256).toBe(sha256(bruto));
      }
    },
    LONGO
  );

  it(
    'o arquivo é imagens/<id> sem extensão, em 600; as pastas da saída, em 700',
    async () => {
      const saida = novaSaida();
      await prepararOk(originaisBase(), saida);
      const modo = (p: string) => statSync(p).mode & 0o777;
      expect(modo(saida)).toBe(0o700);
      expect(modo(join(saida, 'imagens'))).toBe(0o700);
      expect(modo(join(saida, 'acervo.json'))).toBe(0o600);
      const nomes = readdirSync(join(saida, 'imagens')).sort();
      expect(nomes).toEqual(
        indiceDe(saida)
          .map((e) => e.id)
          .sort()
      );
      for (const nome of nomes) {
        expect(nome).toMatch(RE_ID);
        expect(modo(join(saida, 'imagens', nome)), nome).toBe(0o600);
      }
    },
    LONGO
  );

  it(
    'os arquivos gravados não têm nenhum sentinela de metadado, lidos direto (sem decifrar)',
    async () => {
      const origem = originaisBase();
      const originaisBrutos = NOMES_ORIGINAIS.map((n) =>
        Buffer.from(readFileSync(join(origem, n))).toString('latin1')
      );
      // Pré-condição (L-36): o original TEM o metadado, senão a prova abaixo não prova nada.
      for (const bruto of originaisBrutos) {
        expect(SENTINELAS_METADADO.some((s) => bruto.includes(s))).toBe(true);
      }
      const saida = novaSaida();
      await prepararOk(origem, saida);
      for (const entrada of indiceDe(saida)) {
        const texto = Buffer.from(readFileSync(join(saida, 'imagens', entrada.id))).toString(
          'latin1'
        );
        for (const sentinela of SENTINELAS_METADADO) {
          expect(texto.includes(sentinela), `sentinela sobrou (${entrada.tipo})`).toBe(false);
        }
        expect(texto.includes('Exif\0\0')).toBe(false);
      }
    },
    LONGO
  );
});

describe('preparar não toca a pasta de originais', () => {
  it(
    'segunda rodada deixa os originais exatamente como estavam (nomes e conteúdo)',
    async () => {
      const origem = originaisBase();
      await prepararOk(origem, novaSaida());
      const antes = fotografarPasta(origem);
      await prepararOk(origem, novaSaida());
      expect(fotografarPasta(origem)).toEqual(antes);
    },
    LONGO
  );

  it(
    'repetir preparar com outra saída reusa os mesmos ids e não acrescenta linha ao ids.tsv',
    async () => {
      const origem = originaisBase();
      const saida1 = novaSaida();
      const saida2 = novaSaida();
      await prepararOk(origem, saida1);
      const tsvAntes = readFileSync(join(origem, 'ids.tsv'), 'utf8');
      await prepararOk(origem, saida2);
      const ids = (s: string) =>
        indiceDe(s)
          .map((e) => e.id)
          .sort();
      expect(ids(saida2)).toEqual(ids(saida1));
      expect(readFileSync(join(origem, 'ids.tsv'), 'utf8')).toBe(tsvAntes);
    },
    LONGO
  );

  it(
    'imagem nova entre as rodadas ganha id novo e os ids antigos não mudam',
    async () => {
      const origem = originaisBase();
      const saida1 = novaSaida();
      await prepararOk(origem, saida1);
      const antigos = indiceDe(saida1).map((e) => e.id);
      // Conteúdo diferente dos já existentes (um JPEG de 1 componente, não um PNG repetido).
      escreverArquivos(origem, { 'novo.jpg': jpegSintetico(1) });
      const saida2 = novaSaida();
      await prepararOk(origem, saida2);
      const novos = indiceDe(saida2).map((e) => e.id);
      expect(novos).toHaveLength(antigos.length + 1);
      for (const id of antigos) expect(novos).toContain(id);
    },
    LONGO
  );

  it(
    'recusa a segunda rodada quando uma imagem listada no ids.tsv sumiu da pasta, sem nomear o arquivo',
    async () => {
      const origem = originaisBase();
      await prepararOk(origem, novaSaida());
      unlinkSync(join(origem, 'c.webp'));
      const saida2 = novaSaida();
      const r = await rodarFerramenta(['preparar', '--originais', origem, '--saida', saida2]);
      expect(r.codigo).toBe(1);
      expect(r.stderr).toContain('ids.tsv');
      expect(r.stderr).not.toContain('c.webp');
      expect(() => readdirSync(saida2)).toThrow();
    },
    LONGO
  );

  it(
    'recusa a segunda rodada quando um nome igual traz conteúdo diferente',
    async () => {
      const origem = originaisBase();
      await prepararOk(origem, novaSaida());
      // Mesmo nome, outro conteúdo: um JPEG gravado sob o nome do PNG antigo.
      writeFileSync(join(origem, 'a.png'), jpegSintetico(1), { mode: 0o600 });
      const r = await rodarFerramenta(['preparar', '--originais', origem, '--saida', novaSaida()]);
      expect(r.codigo).toBe(1);
      expect(r.stderr).toContain('mudou de conteúdo');
    },
    LONGO
  );
});

describe('preparar: recusas de borda', () => {
  it('recusa saída que já tem conteúdo (não mistura acervo de chave diferente)', async () => {
    const origem = originaisBase();
    const saida = novaSaida();
    mkdirSync(saida, { mode: 0o700 });
    writeFileSync(join(saida, 'resto.txt'), 'x', { mode: 0o600 });
    const r = await rodarFerramenta(['preparar', '--originais', origem, '--saida', saida]);
    expect(r.codigo).toBe(1);
    expect(r.stderr).toContain('não está vazia');
  });

  it('recusa originais dentro de um repositório git (L-28: nada de dado no repositório)', async () => {
    const raiz = criarDirTeste();
    mkdirSync(join(raiz, 'repo', '.git'), { recursive: true });
    const origem = join(raiz, 'repo', 'originais');
    mkdirSync(origem);
    escreverArquivos(origem, { 'a.png': pngSintetico() });
    const r = await rodarFerramenta([
      'preparar',
      '--originais',
      origem,
      '--saida',
      join(raiz, 'saida')
    ]);
    expect(r.codigo).toBe(1);
    expect(r.stderr).toContain('repositório');
  });

  it('recusa original que não é imagem e não cria saída nenhuma', async () => {
    const origem = originaisBase();
    writeFileSync(join(origem, 'documento.pdf'), '%PDF-1.4 sintetico', { mode: 0o600 });
    const saida = novaSaida();
    const r = await rodarFerramenta(['preparar', '--originais', origem, '--saida', saida]);
    expect(r.codigo).toBe(1);
    expect(r.stderr).toContain('não é imagem');
    expect(r.stderr).not.toContain('documento');
    expect(() => statSync(saida)).toThrow();
  });

  it('conferir não aceita --senha: a senha saiu da ferramenta (uso incorreto, código 2)', async () => {
    const saida = novaSaida();
    await prepararOk(originaisBase(), saida);
    const r = await rodarFerramenta(['conferir', '--saida', saida, '--senha', 'qualquer']);
    expect(r.codigo).toBe(2);
  });
});

describe('conferir reprova o que não está limpo ou não confere com o índice', () => {
  it(
    'reprova etiqueta plantada em imagens/ mesmo com bytes e sha256 batendo com o índice',
    async () => {
      const saida = novaSaida();
      await prepararOk(originaisBase(), saida);
      const png = indiceDe(saida).find((e) => e.tipo === 'png');
      if (png === undefined) throw new Error('fixture sem PNG');
      trocarConteudoNoIndice(saida, png.id, pngSintetico());
      const r = await conferirCom(saida);
      expect(r.codigo).toBe(1);
      expect(r.stderr).toContain('fora da lista permitida');
      expect(r.stderr).not.toContain('não confere');
    },
    LONGO
  );

  it(
    'reprova um byte adulterado num arquivo de imagens/',
    async () => {
      const saida = novaSaida();
      await prepararOk(originaisBase(), saida);
      const alvo = join(saida, 'imagens', indiceDe(saida)[0]?.id ?? '');
      const bytes = new Uint8Array(readFileSync(alvo));
      bytes[bytes.length - 1] = (bytes[bytes.length - 1] ?? 0) ^ 0x01;
      writeFileSync(alvo, bytes);
      const r = await conferirCom(saida);
      expect(r.codigo).toBe(1);
      expect(r.stderr).toContain('não confere');
    },
    LONGO
  );

  it(
    'reprova um arquivo sobrando em imagens/ que não está no índice',
    async () => {
      const saida = novaSaida();
      await prepararOk(originaisBase(), saida);
      writeFileSync(join(saida, 'imagens', 'f'.repeat(32)), 'x', { mode: 0o600 });
      const r = await conferirCom(saida);
      expect(r.codigo).toBe(1);
      expect(r.stderr).toContain('sobra ou falta');
    },
    LONGO
  );

  it(
    'reprova um arquivo do índice que falta em imagens/',
    async () => {
      const saida = novaSaida();
      await prepararOk(originaisBase(), saida);
      unlinkSync(join(saida, 'imagens', indiceDe(saida)[0]?.id ?? ''));
      const r = await conferirCom(saida);
      expect(r.codigo).toBe(1);
      expect(r.stderr).toContain('sobra ou falta');
    },
    LONGO
  );

  it(
    'reprova acervo.json com o contrato antigo (campo kid)',
    async () => {
      const saida = novaSaida();
      await prepararOk(originaisBase(), saida);
      const caminho = join(saida, 'acervo.json');
      const acervo = lerJson(caminho);
      acervo.kid = 'a'.repeat(32);
      writeFileSync(caminho, JSON.stringify(acervo), { mode: 0o600 });
      const r = await conferirCom(saida);
      expect(r.codigo).toBe(1);
      expect(r.stderr).toContain('fora do esperado');
    },
    LONGO
  );

  it(
    'nenhum nome de original aparece em stdout nem stderr, com sucesso ou com falha',
    async () => {
      const saida = novaSaida();
      const origem = originaisBase();
      const p = await rodarFerramenta(['preparar', '--originais', origem, '--saida', saida]);
      const c = await conferirCom(saida);
      writeFileSync(join(saida, 'imagens', 'f'.repeat(32)), 'x', { mode: 0o600 });
      const falha = await conferirCom(saida);
      for (const texto of [p.stdout, p.stderr, c.stdout, c.stderr, falha.stderr]) {
        for (const nome of NOMES_ORIGINAIS) {
          expect(texto.includes(nome), `nome de original vazou: ${nome}`).toBe(false);
        }
      }
    },
    LONGO
  );
});
