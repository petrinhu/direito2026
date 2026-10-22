import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { validarUnidade } from '@/core/conteudo/validarUnidade';
import {
  montarCurriculo,
  type DescricaoCadeira,
  type DescricaoUnidade
} from '@/core/curriculo/montarCurriculo';
import { ROTULOS_CATEGORIA_QUIZ } from '@/conteudo/quiz/categorias';
import type { ConteudoUnidade, MetaUnidade } from '@/conteudo/tipos';
import { caminhosDoDisco } from '../../scripts/apoio/conteudoDoDisco';
import { executarNovaUnidade } from '../../scripts/apoio/novaUnidade/executar';

/**
 * Ponta a ponta do gerador numa raiz de teste (`--raiz`), em pasta temporária
 * fora do repositório. Cada caso roda o mesmo caminho que o `npm run
 * nova-unidade` percorre, sem subprocesso (L-11: nada de um processo por caso).
 */
let raiz: string;

beforeEach(() => {
  raiz = mkdtempSync(join(process.env.TMPDIR ?? '/var/tmp', 'gerador-nova-unidade-'));
  cadeiraFalsa('p1/filosofia-juridica', 4);
  cadeiraFalsa('p1/interdisciplinar', 5);
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
});

function conteudo(...partes: string[]): string {
  return join(raiz, 'src', 'conteudo', ...partes);
}

function cadeiraFalsa(pasta: string, ordem: number, nome = 'Nome'): void {
  mkdirSync(conteudo(pasta), { recursive: true });
  writeFileSync(
    conteudo(pasta, 'cadeira.ts'),
    `export const cadeira = { nome: ${JSON.stringify(nome)}, ordem: ${ordem}, estado: 'em-breve' };\n`
  );
}

/** Lista todos os arquivos (relativos à raiz) para provar que nada foi criado. */
function arvore(pasta: string = raiz, prefixo = ''): string[] {
  return readdirSync(pasta)
    .flatMap((nome) => {
      const caminho = join(pasta, nome);
      const relativo = prefixo + nome;
      return statSync(caminho).isDirectory() ? arvore(caminho, `${relativo}/`) : [relativo];
    })
    .sort();
}

async function rodar(argv: string[]) {
  return executarNovaUnidade([...argv, '--raiz', raiz]);
}

async function importar<T>(...partes: string[]): Promise<T> {
  return (await import(pathToFileURL(conteudo(...partes)).href)) as T;
}

describe('criação da unidade', () => {
  it('cria os cinco modelos e devolve código 0 com os próximos passos', async () => {
    const resultado = await rodar(['p1', 'filosofia-juridica', 'u4', 'Título da unidade']);
    expect(resultado.codigo).toBe(0);
    expect(arvore().filter((a) => a.includes('/u4/'))).toEqual([
      'src/conteudo/p1/filosofia-juridica/u4/mapaFichamento.ts',
      'src/conteudo/p1/filosofia-juridica/u4/meta.ts',
      'src/conteudo/p1/filosofia-juridica/u4/mnemonicos.ts',
      'src/conteudo/p1/filosofia-juridica/u4/quiz/index.ts',
      'src/conteudo/p1/filosofia-juridica/u4/resumo.ts'
    ]);
    expect(resultado.linhas.join('\n')).toContain('Próximos passos');
    expect(resultado.linhas.join('\n')).toContain("'publicado'");
  });

  it('com --peticao cria também peticao.ts', async () => {
    const resultado = await rodar(['p1', 'filosofia-juridica', 'u5', 'T', '--peticao']);
    expect(resultado.codigo).toBe(0);
    expect(existe('p1/filosofia-juridica/u5/peticao.ts')).toBe(true);
  });

  it('o esqueleto passa em validarUnidade e tem os exports que o carregador lê', async () => {
    await rodar(['p1', 'filosofia-juridica', 'u4', 'Título da unidade', '--peticao']);
    const meta = await importar<{ meta: MetaUnidade }>('p1/filosofia-juridica/u4/meta.ts');
    const unidade: ConteudoUnidade = {
      meta: meta.meta,
      resumo: (
        await importar<{ resumo: ConteudoUnidade['resumo'] }>('p1/filosofia-juridica/u4/resumo.ts')
      ).resumo,
      mapaFichamento: (
        await importar<{ mapaFichamento: ConteudoUnidade['mapaFichamento'] }>(
          'p1/filosofia-juridica/u4/mapaFichamento.ts'
        )
      ).mapaFichamento,
      mnemonicos: (
        await importar<{ mnemonicos: ConteudoUnidade['mnemonicos'] }>(
          'p1/filosofia-juridica/u4/mnemonicos.ts'
        )
      ).mnemonicos,
      quiz: (
        await importar<{ quiz: ConteudoUnidade['quiz'] }>('p1/filosofia-juridica/u4/quiz/index.ts')
      ).quiz,
      peticao: (
        await importar<{ peticao: ConteudoUnidade['peticao'] }>(
          'p1/filosofia-juridica/u4/peticao.ts'
        )
      ).peticao
    };
    expect(meta.meta.estado).toBe('em-breve');
    expect(validarUnidade(unidade, ROTULOS_CATEGORIA_QUIZ)).toEqual([]);
  });

  it('a cadeira e a unidade novas montam o currículo sem erro', async () => {
    await rodar([
      'p1',
      'sociologia-juridica',
      'u1',
      'Primeiro tema',
      '--cadeira',
      'Sociologia Jurídica'
    ]);
    const cadeiras: Record<string, DescricaoCadeira> = {};
    const metas: Record<string, DescricaoUnidade> = {};
    const caminhos = caminhosDoDisco(join(raiz, 'src', 'conteudo'));
    // caminhosDoDisco só lista arquivos de unidade; as descrições de cadeira entram à parte.
    for (const caminho of [
      'p1/filosofia-juridica/cadeira.ts',
      'p1/interdisciplinar/cadeira.ts',
      'p1/sociologia-juridica/cadeira.ts'
    ]) {
      cadeiras[caminho] = (await importar<{ cadeira: DescricaoCadeira }>(caminho)).cadeira;
    }
    for (const caminho of caminhos.filter((c) => c.endsWith('/meta.ts'))) {
      metas[caminho] = (await importar<{ meta: DescricaoUnidade }>(caminho)).meta;
    }
    const curriculo = montarCurriculo({ caminhos, cadeiras, metas });
    const cadeiraNova = curriculo[0]?.cadeiras.find((c) => c.id === 'sociologia-juridica');
    expect(cadeiraNova?.estado).toBe('em-breve');
    expect(cadeiraNova?.unidades.map((u) => u.id)).toEqual(['u1']);
  });
});

describe('recusa de sobrescrita e de pasta parcial', () => {
  it('unidade já existente é recusada e meta.ts fica intacto', async () => {
    await rodar(['p1', 'filosofia-juridica', 'u4', 'T']);
    writeFileSync(conteudo('p1/filosofia-juridica/u4/meta.ts'), 'SENTINELA\n');
    const resultado = await rodar(['p1', 'filosofia-juridica', 'u4', 'Outro']);
    expect(resultado.codigo).toBe(1);
    expect(resultado.erros.join('\n')).toContain('já existe');
    expect(readFileSync(conteudo('p1/filosofia-juridica/u4/meta.ts'), 'utf8')).toBe('SENTINELA\n');
  });

  it('pasta de unidade parcial é recusada e nada novo é criado', async () => {
    mkdirSync(conteudo('p1/filosofia-juridica/u6'), { recursive: true });
    writeFileSync(conteudo('p1/filosofia-juridica/u6/resumo.ts'), 'export const resumo = [];\n');
    const antes = arvore();
    const resultado = await rodar(['p1', 'filosofia-juridica', 'u6', 'T']);
    expect(resultado.codigo).toBe(1);
    expect(arvore()).toEqual(antes);
  });
});

describe('cadeira nova', () => {
  it('cadeira sem pasta e sem --cadeira: erro claro, nada criado', async () => {
    const antes = arvore();
    const resultado = await rodar(['p1', 'direito-civil', 'u1', 'T']);
    expect(resultado.codigo).toBe(1);
    expect(resultado.erros.join('\n')).toContain('--cadeira');
    expect(arvore()).toEqual(antes);
  });

  it('com --cadeira cria cadeira.ts em-breve, com a próxima ordem livre do período', async () => {
    const resultado = await rodar([
      'p1',
      'sociologia-juridica',
      'u1',
      'T',
      '--cadeira',
      'Sociologia Jurídica'
    ]);
    expect(resultado.codigo).toBe(0);
    const texto = readFileSync(conteudo('p1/sociologia-juridica/cadeira.ts'), 'utf8');
    expect(texto).toContain('ordem: 6');
    expect(texto).toContain("estado: 'em-breve'");
    expect(texto).toContain("nome: 'Sociologia Jurídica'");
  });

  it('período sem nenhuma cadeira começa a ordem em 1', async () => {
    const resultado = await rodar([
      'p2',
      'direito-romano',
      'u1',
      'T',
      '--cadeira',
      'Direito Romano'
    ]);
    expect(resultado.codigo).toBe(0);
    expect(readFileSync(conteudo('p2/direito-romano/cadeira.ts'), 'utf8')).toContain('ordem: 1');
  });

  it('nome com apóstrofo gera cadeira.ts que importa', async () => {
    await rodar(['p2', 'direito-do-agua', 'u1', 'T', '--cadeira', "Direito d'Água"]);
    const cadeira = await importar<{ cadeira: DescricaoCadeira }>('p2/direito-do-agua/cadeira.ts');
    expect(cadeira.cadeira.nome).toBe("Direito d'Água");
  });

  it('--cadeira em cadeira que já tem descrição é recusado', async () => {
    const antes = arvore();
    const resultado = await rodar(['p1', 'filosofia-juridica', 'u9', 'T', '--cadeira', 'Outro']);
    expect(resultado.codigo).toBe(1);
    expect(arvore()).toEqual(antes);
  });
});

describe('formatos inválidos', () => {
  it.each([
    ['p0', 'x-y', 'u1'],
    ['p1', 'Filosofia Jurídica', 'u1'],
    ['p1', 'filosofia-juridica', 'u0'],
    ['p1', 'filosofia-juridica', '3']
  ])('%s %s %s é recusado sem criar nada', async (periodo, cadeira, unidade) => {
    const antes = arvore();
    const resultado = await rodar([periodo, cadeira, unidade, 'T', '--cadeira', 'X']);
    expect(resultado.codigo).toBe(1);
    expect(arvore()).toEqual(antes);
  });
});

function existe(relativo: string): boolean {
  try {
    return statSync(conteudo(relativo)).isFile();
  } catch {
    return false;
  }
}

describe('tópico de grupo: criação e conflito com a unidade simples', () => {
  it('cria um tópico uN-grupo-topico numa cadeira existente, com código 0', async () => {
    const resultado = await rodar(['p1', 'filosofia-juridica', 'u3-material-apostila', 'Apostila']);
    expect(resultado.codigo).toBe(0);
    expect(arvore().filter((a) => a.includes('/u3-material-apostila/'))).toContain(
      'src/conteudo/p1/filosofia-juridica/u3-material-apostila/meta.ts'
    );
  });

  it('recusa uN simples quando já existe tópico de grupo da mesma AV, e nada novo é criado', async () => {
    await rodar(['p1', 'filosofia-juridica', 'u3-material-apostila', 'Apostila']);
    const antes = arvore();
    const resultado = await rodar(['p1', 'filosofia-juridica', 'u3', 'T']);
    expect(resultado.codigo).not.toBe(0);
    expect(resultado.erros.join('\n')).toMatch(/não convive/);
    expect(arvore()).toEqual(antes);
  });

  it('recusa tópico de grupo quando a AV já tem unidade simples, e nada novo é criado', async () => {
    await rodar(['p1', 'filosofia-juridica', 'u3', 'T']);
    const antes = arvore();
    const resultado = await rodar(['p1', 'filosofia-juridica', 'u3-material-apostila', 'Apostila']);
    expect(resultado.codigo).not.toBe(0);
    expect(resultado.erros.join('\n')).toMatch(/não convive/);
    expect(arvore()).toEqual(antes);
  });
});
