import { mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { base64ParaBytes, bytesParaBase64Url } from '@/core/juri/base64';
import { decifrarImagem, derivar } from '@/core/juri/cifra';
import { idDeHex } from '@/core/juri/idImagem';
import {
  jpegSintetico,
  pngSintetico,
  SENTINELAS_METADADO,
  webpSintetico
} from './apoio/imagensSinteticas';
import {
  abrirSaida,
  criarDirTeste,
  escreverArquivos,
  lerJson,
  limparDirsTeste,
  rodarFerramenta
} from './apoio/acervoFerramenta';

const LONGO = 120_000;

/** Pasta de originais com três formatos: PNG, JPEG com EXIF (3 componentes) e WebP. */
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

async function iniciarOk(origem: string, saida: string): Promise<string> {
  const r = await rodarFerramenta(['iniciar', '--originais', origem, '--saida', saida]);
  expect(r.codigo, `iniciar: ${r.stderr}`).toBe(0);
  return r.stdout.replace(/\n$/, '');
}

afterEach(() => {
  limparDirsTeste();
});

describe('ferramenta do acervo: ida e volta', () => {
  it(
    'iniciar gera a saída e conferir a abre com a senha impressa, para PNG, JPEG e WebP',
    async () => {
      const origem = originaisBase();
      const saida = novaSaida();
      const senha = await iniciarOk(origem, saida);
      const c = await rodarFerramenta(['conferir', '--saida', saida, '--senha', senha]);
      expect(c.codigo, c.stderr).toBe(0);
      expect(c.stdout).toContain('conferido: 3 imagens');
    },
    LONGO
  );

  it(
    'a credencial tem exatamente os campos login, salt, auth e embrulho, com os tamanhos do contrato',
    async () => {
      const origem = originaisBase();
      const saida = novaSaida();
      await iniciarOk(origem, saida);
      const cred = lerJson(join(saida, 'credencial-admin.json'));
      expect(Object.keys(cred).sort()).toEqual(['auth', 'embrulho', 'login', 'salt']);
      expect(cred.login).toBe('admin');
      expect(base64ParaBytes(cred.salt).byteLength).toBe(16);
      expect(cred.auth).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(Buffer.from(cred.auth, 'base64url').byteLength).toBe(32);
      expect(Object.keys(cred.embrulho).sort()).toEqual(['ct', 'iv', 'v']);
      expect(cred.embrulho.v).toBe(1);
      expect(base64ParaBytes(cred.embrulho.iv).byteLength).toBe(12);
      expect(base64ParaBytes(cred.embrulho.ct).byteLength).toBe(48);
    },
    LONGO
  );

  it(
    'o AUTH da credencial é exatamente derivar(senha, salt) do módulo de navegador',
    async () => {
      const origem = originaisBase();
      const saida = novaSaida();
      const senha = await iniciarOk(origem, saida);
      const cred = lerJson(join(saida, 'credencial-admin.json'));
      const { auth } = await derivar(senha, base64ParaBytes(cred.salt));
      expect(bytesParaBase64Url(auth)).toBe(cred.auth);
    },
    LONGO
  );
});

describe('ferramenta do acervo: reuso de ids e kid novo ("esqueci a senha")', () => {
  it(
    'repetir iniciar com outra saída reusa os mesmos ids, troca o kid e não acrescenta linha ao ids.tsv',
    async () => {
      const origem = originaisBase();
      const saida1 = novaSaida();
      const saida2 = novaSaida();
      await iniciarOk(origem, saida1);
      const tsvAntes = readFileSync(join(origem, 'ids.tsv'), 'utf8');
      await iniciarOk(origem, saida2);
      const a1 = lerJson(join(saida1, 'acervo.json'));
      const a2 = lerJson(join(saida2, 'acervo.json'));
      const ids = (a: Record<string, any>): string[] =>
        (a.indice as { id: string }[]).map((i) => i.id).sort();
      expect(ids(a2)).toEqual(ids(a1));
      expect(a2.kid).not.toBe(a1.kid);
      expect(readFileSync(join(origem, 'ids.tsv'), 'utf8')).toBe(tsvAntes);
    },
    LONGO
  );

  it(
    'imagem nova entre as rodadas ganha id novo e os ids antigos não mudam',
    async () => {
      const origem = originaisBase();
      const saida1 = novaSaida();
      await iniciarOk(origem, saida1);
      const antigos = lerJson(join(saida1, 'acervo.json')).indice.map((i: { id: string }) => i.id);
      // Conteúdo diferente dos já existentes (um JPEG de 1 componente, não um PNG repetido).
      escreverArquivos(origem, { 'novo.jpg': jpegSintetico(1) });
      const saida2 = novaSaida();
      await iniciarOk(origem, saida2);
      const novos = lerJson(join(saida2, 'acervo.json')).indice.map((i: { id: string }) => i.id);
      expect(novos).toHaveLength(antigos.length + 1);
      for (const id of antigos) expect(novos).toContain(id);
    },
    LONGO
  );

  it(
    'recusa a segunda rodada quando uma imagem listada no ids.tsv sumiu da pasta, sem nomear o arquivo',
    async () => {
      const origem = originaisBase();
      await iniciarOk(origem, novaSaida());
      unlinkSync(join(origem, 'c.webp'));
      const saida2 = novaSaida();
      const r = await rodarFerramenta(['iniciar', '--originais', origem, '--saida', saida2]);
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
      await iniciarOk(origem, novaSaida());
      // Mesmo nome, outro conteúdo: um JPEG gravado sob o nome do PNG antigo.
      writeFileSync(join(origem, 'a.png'), jpegSintetico(1), { mode: 0o600 });
      const r = await rodarFerramenta(['iniciar', '--originais', origem, '--saida', novaSaida()]);
      expect(r.codigo).toBe(1);
      expect(r.stderr).toContain('mudou de conteúdo');
    },
    LONGO
  );
});

describe('ferramenta do acervo: recusas de borda', () => {
  it('recusa saída que já tem conteúdo (não mistura kid antigo com novo)', async () => {
    const origem = originaisBase();
    const saida = novaSaida();
    mkdirSync(saida, { mode: 0o700 });
    writeFileSync(join(saida, 'resto.txt'), 'x', { mode: 0o600 });
    const r = await rodarFerramenta(['iniciar', '--originais', origem, '--saida', saida]);
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
      'iniciar',
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
    const r = await rodarFerramenta(['iniciar', '--originais', origem, '--saida', saida]);
    expect(r.codigo).toBe(1);
    expect(r.stderr).toContain('não é imagem');
    expect(r.stderr).not.toContain('documento');
    expect(() => statSync(saida)).toThrow();
  });
});

describe('ferramenta do acervo: metadados e segredo', () => {
  it(
    'o EXIF, o COM, o tEXt e o chunk EXIF saem do arquivo cifrado (sentinelas somem do decifrado)',
    async () => {
      const origem = originaisBase();
      const originaisBrutos = ['b.jpg', 'a.png', 'c.webp'].map((n) =>
        Buffer.from(readFileSync(join(origem, n))).toString('latin1')
      );
      // Pré-condição (L-36): o original TEM o metadado, senão a prova abaixo não prova nada.
      for (const bruto of originaisBrutos) {
        expect(SENTINELAS_METADADO.some((s) => bruto.includes(s))).toBe(true);
      }
      const saida = novaSaida();
      const senha = await iniciarOk(origem, saida);
      const { acervo, cek } = await abrirSaida(saida, senha);
      const kid = idDeHex(acervo.kid);
      for (const entrada of acervo.indice) {
        const arquivo = new Uint8Array(readFileSync(join(saida, 'imagens', `${entrada.id}.juri`)));
        const { bytes } = await decifrarImagem(arquivo, cek, kid, idDeHex(entrada.id));
        const texto = Buffer.from(bytes).toString('latin1');
        for (const sentinela of SENTINELAS_METADADO) {
          expect(
            texto.includes(sentinela),
            `sentinela ${sentinela} sobrou no arquivo ${entrada.tipo}`
          ).toBe(false);
        }
        expect(texto.includes('Exif\0\0')).toBe(false);
        expect(texto.includes('JFIF')).toBe(false);
      }
    },
    LONGO
  );

  it(
    'stdout tem só a senha; nenhum AUTH, salt, iv, ct ou kid aparece em stdout nem stderr',
    async () => {
      const origem = originaisBase();
      const saida = novaSaida();
      const r = await rodarFerramenta(['iniciar', '--originais', origem, '--saida', saida]);
      expect(r.codigo, r.stderr).toBe(0);
      expect(r.stdout).toMatch(/^[A-Za-z2-9]{20}\n$/);
      const cred = lerJson(join(saida, 'credencial-admin.json'));
      const acervo = lerJson(join(saida, 'acervo.json'));
      const segredos = [cred.auth, cred.salt, cred.embrulho.iv, cred.embrulho.ct, acervo.kid];
      for (const s of segredos) {
        expect(r.stdout.includes(s)).toBe(false);
        expect(r.stderr.includes(s)).toBe(false);
      }
      expect(r.stderr.includes(r.stdout.trim())).toBe(false);
    },
    LONGO
  );

  it(
    'permissões: pastas 700, todos os arquivos da saída e o ids.tsv em 600',
    async () => {
      const origem = originaisBase();
      const saida = novaSaida();
      await iniciarOk(origem, saida);
      const modo = (p: string) => statSync(p).mode & 0o777;
      expect(modo(saida)).toBe(0o700);
      expect(modo(join(saida, 'imagens'))).toBe(0o700);
      for (const nome of ['credencial-admin.json', 'acervo.json', 'conferencia.tsv']) {
        expect(modo(join(saida, nome)), nome).toBe(0o600);
      }
      for (const nome of readdirSync(join(saida, 'imagens'))) {
        expect(modo(join(saida, 'imagens', nome)), nome).toBe(0o600);
      }
      expect(modo(join(origem, 'ids.tsv'))).toBe(0o600);
    },
    LONGO
  );
});

describe('ferramenta do acervo: conferir falha fechado', () => {
  it(
    'senha errada recusa e não ecoa a senha digitada',
    async () => {
      const origem = originaisBase();
      const saida = novaSaida();
      await iniciarOk(origem, saida);
      const errada = 'SenhaErradaSintetica2026';
      const r = await rodarFerramenta(['conferir', '--saida', saida, '--senha', errada]);
      expect(r.codigo).toBe(1);
      expect(r.stderr).not.toContain(errada);
      expect(r.stdout).not.toContain(errada);
    },
    LONGO
  );

  it(
    'um byte adulterado num .juri recusa',
    async () => {
      const origem = originaisBase();
      const saida = novaSaida();
      const senha = await iniciarOk(origem, saida);
      const alvo = join(saida, 'imagens', readdirSync(join(saida, 'imagens'))[0] ?? '');
      const bytes = new Uint8Array(readFileSync(alvo));
      bytes[bytes.length - 1] = (bytes[bytes.length - 1] ?? 0) ^ 0x01;
      writeFileSync(alvo, bytes);
      const r = await rodarFerramenta(['conferir', '--saida', saida, '--senha', senha]);
      expect(r.codigo).toBe(1);
    },
    LONGO
  );

  it(
    'um .juri sobrando fora do índice recusa',
    async () => {
      const origem = originaisBase();
      const saida = novaSaida();
      const senha = await iniciarOk(origem, saida);
      writeFileSync(join(saida, 'imagens', 'ffffffffffffffffffffffffffffffff.juri'), 'x', {
        mode: 0o600
      });
      const r = await rodarFerramenta(['conferir', '--saida', saida, '--senha', senha]);
      expect(r.codigo).toBe(1);
    },
    LONGO
  );
});
