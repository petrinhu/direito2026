import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

/**
 * Portão verificar-particao (plano do CTO, 6.1 linha 385, E6 e F1.2b). Reprova
 * janela de 40 caracteres de TEXTO DE ESTUDO cifrado que apareça em arquivo em
 * claro. Só o valor das strings de src/conteudo conta como fonte; comentário,
 * import e chave de objeto não contam. Fixtures descartáveis, com chave gerada
 * dentro de cada uma; nada aqui lê a chave real.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ_REPO = resolve(AQUI, '../..');
const SCRIPT = join(RAIZ_REPO, 'scripts/verificar-particao.ts');
const UNIDADE = 'src/conteudo/p1/cad/u1';
const ATRIBUTOS = 'src/conteudo/** filter=git-crypt diff=git-crypt\n.gitattributes !filter !diff\n';

const RESUMO = [
  "import { describe, expect, it } from 'vitest';",
  "export const r = ['<p>A cadeira estuda a função social da propriedade urbana e seus limites legais na prática.</p>'];",
  '// comentário longo o bastante para ter mais de quarenta caracteres aqui',
  "export const dica = 'Leia bem: Procure a legislação aplicável a cada fato.';",
  ''
].join('\n');

const META_TEXTO = 'Meta sintetica da unidade para o teste de exclusao';
const PADRAO = {
  [`${UNIDADE}/resumo.ts`]: RESUMO,
  [`${UNIDADE}/meta.ts`]: `export const meta = '${META_TEXTO}';\n`
};

const temporarios: string[] = [];
afterEach(() => {
  for (const pasta of temporarios.splice(0)) rmSync(pasta, { recursive: true, force: true });
});

function git(cwd: string, args: string[]): void {
  const vazio = join(cwd, '.git', 'sem-hooks');
  mkdirSync(vazio, { recursive: true });
  execFileSync(
    'git',
    [
      '-c',
      `core.hooksPath=${vazio}`,
      '-c',
      'user.email=teste@exemplo.invalido',
      '-c',
      'user.name=teste',
      ...args
    ],
    { cwd, stdio: 'ignore' }
  );
}

/** Repositório descartável: git-crypt com chave gerada aqui, arquivos e atributos escritos, um commit. */
function fixture(arquivos: Record<string, string>, atributos: string = ATRIBUTOS): string {
  const raiz = mkdtempSync(join(tmpdir(), 'portao-particao-'));
  temporarios.push(raiz);
  git(raiz, ['init', '-q', '.']);
  execFileSync('git-crypt', ['init'], { cwd: raiz, stdio: 'ignore' });
  const todos: Record<string, string> = { ...arquivos, '.gitattributes': atributos };
  for (const [caminho, conteudo] of Object.entries(todos)) {
    mkdirSync(dirname(join(raiz, caminho)), { recursive: true });
    writeFileSync(join(raiz, caminho), conteudo);
  }
  git(raiz, ['add', ...Object.keys(todos)]);
  git(raiz, ['commit', '-q', '-m', 'teste: particao']);
  return raiz;
}

/** Cópia do script com seis frases permitidas (teto é 5). A mutação é conferida antes de rodar. */
function scriptComSeisFrases(): string {
  const pasta = mkdtempSync(join(tmpdir(), 'portao-particao-teto-'));
  temporarios.push(pasta);
  mkdirSync(join(pasta, 'scripts'));
  const extras = Array.from(
    { length: 4 },
    (_, i) => `  'Frase sintetica extra ${i + 1} para estourar o teto.',`
  );
  const original = readFileSync(SCRIPT, 'utf-8');
  const cabeca = 'const FRASES_PERMITIDAS = [\n';
  const codigo = original
    .replace(
      "'../src/core/restrito/termosVazamento'",
      `'${join(RAIZ_REPO, 'src/core/restrito/termosVazamento')}'`
    )
    .replace(cabeca, `${cabeca}${extras.join('\n')}\n`);
  if (!codigo.includes(extras[3] ?? '')) {
    throw new Error('sabotagem não chegou ao script copiado');
  }
  writeFileSync(join(pasta, 'scripts/verificar-particao.ts'), codigo);
  // node_modules só para resolver typescript e tsx na cópia; nada é escrito no repositório.
  symlinkSync(join(RAIZ_REPO, 'node_modules'), join(pasta, 'node_modules'), 'dir');
  return join(pasta, 'scripts/verificar-particao.ts');
}

function rodar(raiz: string, script: string = SCRIPT): { rc: number; saida: string } {
  try {
    const saida = execFileSync(process.execPath, ['--import', 'tsx', script], {
      cwd: RAIZ_REPO,
      env: { ...process.env, REPO_RAIZ: raiz },
      encoding: 'utf-8',
      timeout: 120_000,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return { rc: 0, saida };
  } catch (erro) {
    const e = erro as { status?: number; stdout?: string; stderr?: string };
    return { rc: e.status ?? -1, saida: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

describe('verificar-particao: fixture', () => {
  it('o texto de meta tem exatamente 50 caracteres, como a ordem pede', () => {
    expect(META_TEXTO).toHaveLength(50);
  });
});

describe('verificar-particao: caminho verde', () => {
  it('texto em claro sem nenhuma janela de 40 caracteres do cifrado: sai 0', () => {
    const { rc, saida } = rodar(
      fixture({
        ...PADRAO,
        'LEIA.md': 'Projeto de teste, sem nenhuma relação com o conteúdo.\n'
      })
    );
    expect(rc, saida).toBe(0);
    expect(saida).toMatch(/encontrados=0 analisados=\d+ falharam=0 fontes=1 permitidas=2/);
  });

  it('import idêntico nos dois lados não é trecho de estudo: sai 0 (caso a)', () => {
    const { rc, saida } = rodar(
      fixture({
        ...PADRAO,
        'LEIA.md': "import { describe, expect, it } from 'vitest';\n"
      })
    );
    expect(rc, saida).toBe(0);
  });

  it('comentário do cifrado copiado para o texto em claro não é fonte: sai 0 (caso b)', () => {
    const { rc, saida } = rodar(
      fixture({
        ...PADRAO,
        'LEIA.md': '// comentário longo o bastante para ter mais de quarenta caracteres aqui\n'
      })
    );
    expect(rc, saida).toBe(0);
  });

  it('string de meta.ts copiada não é fonte: sai 0 (caso c)', () => {
    const { rc, saida } = rodar(
      fixture({
        ...PADRAO,
        'LEIA.md': `Anotação: ${META_TEXTO}.\n`
      })
    );
    expect(rc, saida).toBe(0);
  });

  it('frase permitida copiada inteira sai 0 (caso f, primeira metade)', () => {
    const { rc, saida } = rodar(
      fixture({
        ...PADRAO,
        'LEIA.md': 'Procure a legislação aplicável a cada fato.\n'
      })
    );
    expect(rc, saida).toBe(0);
  });
});

describe('verificar-particao: sabotagens vermelhas (L-36)', () => {
  it('trecho copiado inteiro do cifrado, com caixa e acento diferentes: sai 1', () => {
    const { rc, saida } = rodar(
      fixture({
        ...PADRAO,
        'LEIA.md':
          'Anotação: A FUNCAO SOCIAL DA PROPRIEDADE URBANA e seus limites legais, copiado.\n'
      })
    );
    expect(rc).toBe(1);
    expect(saida).toContain('LEIA.md');
  });

  it('janela de exatamente 40 caracteres no meio de uma linha: sai 1', () => {
    // O trecho tem mais de 40 caracteres normalizados, então contém uma janela inteira de 40.
    const trecho = 'a função social da propriedade urbana e seus limites';
    const { rc, saida } = rodar(fixture({ ...PADRAO, 'LEIA.md': `ver ${trecho} ver\n` }));
    expect(rc).toBe(1);
    expect(saida).toContain('LEIA.md');
  });

  it('trecho da string em maiúsculas e sem acento, em claro: sai 1 (caso d)', () => {
    const { rc, saida } = rodar(
      fixture({
        ...PADRAO,
        'LEIA.md': 'A CADEIRA ESTUDA A FUNCAO SOCIAL DA PROPRIEDADE URBANA E SEUS LIMITES\n'
      })
    );
    expect(rc).toBe(1);
    expect(saida).toContain('LEIA.md');
  });

  it('trecho da string dentro de um comentário // num .ts em claro: sai 1 (caso e)', () => {
    const { rc, saida } = rodar(
      fixture({
        ...PADRAO,
        'src/ui/x.ts':
          '// a função social da propriedade urbana e seus limites\nexport const x = 1;\n'
      })
    );
    expect(rc).toBe(1);
    expect(saida).toContain('src/ui/x.ts');
  });

  it('frase permitida com 10 caracteres vizinhos do fragmento: sai 1 (caso f, segunda metade)', () => {
    const { rc, saida } = rodar(
      fixture({
        ...PADRAO,
        'LEIA.md': 'Leia bem: Procure a legislação aplicável a cada fato.\n'
      })
    );
    expect(rc).toBe(1);
    expect(saida).toContain('LEIA.md');
  });

  it('seis frases permitidas, por sabotagem numa cópia do script: sai 1 pelo teto (caso g)', () => {
    const { rc, saida } = rodar(fixture({ ...PADRAO }), scriptComSeisFrases());
    expect(rc, saida).toBe(1);
    expect(saida).toMatch(/teto/);
  });

  it('piso: nenhuma fonte de estudo é varredura quebrada, sai 1', () => {
    const raiz = fixture(
      { ...PADRAO, 'LEIA.md': 'texto qualquer em claro, longo o bastante para uma janela.\n' },
      '.gitattributes !filter !diff\n'
    );
    const { rc, saida } = rodar(raiz);
    expect(rc).toBe(1);
    expect(saida).toMatch(/fontes=0/);
  });
});

// Texto sintético, sem relação com conteúdo de estudo: só serve para medir marcação e entidade.
const DENSO =
  '<p>Frase <strong>sintetica</strong> com <em>marcacao</em> inline <strong>densa</strong> para o <em>teste</em> do portao de particao.</p>';
const SOLTO =
  'Regra sintetica: quando o prazo e < 30 dias e a janela de teste segue aberta, aplica-se a regra > fim.';
const PLANA = 'Frase sintetica sem marcas para o teste de entidade do portao de particao.';

describe('verificar-particao: marcação inline e entidade (F1.2c, E6)', () => {
  it('parágrafo denso em tags inline, copiado com as mesmas tags em claro: sai 1', () => {
    const { rc, saida } = rodar(
      fixture({
        ...PADRAO,
        [`${UNIDADE}/resumo.ts`]: `export const r = ['${DENSO}'];\n`,
        'LEIA.md': `Anotação: ${DENSO}\n`
      })
    );
    expect(rc, saida).toBe(1);
    expect(saida).toContain('LEIA.md');
  });

  it('o mesmo parágrafo denso, copiado sem as tags, em claro: sai 1', () => {
    const semTags = DENSO.replace(/<\/?[a-z][^<>]*>/gi, '');
    const { rc, saida } = rodar(
      fixture({
        ...PADRAO,
        [`${UNIDADE}/resumo.ts`]: `export const r = ['${DENSO}'];\n`,
        'LEIA.md': `Anotação: ${semTags}\n`
      })
    );
    expect(rc, saida).toBe(1);
    expect(saida).toContain('LEIA.md');
  });

  it('sinal de menor solto no cifrado não engole o texto até o próximo maior: sai 1', () => {
    const { rc, saida } = rodar(
      fixture({
        ...PADRAO,
        [`${UNIDADE}/resumo.ts`]: `export const r = ['${SOLTO}'];\n`,
        'LEIA.md': 'Anotação: a janela de teste segue aberta, aplica-se a regra.\n'
      })
    );
    expect(rc, saida).toBe(1);
    expect(saida).toContain('LEIA.md');
  });

  it('entidade HTML no claro (&nbsp;) é decodificada antes de comparar: sai 1', () => {
    const copia = PLANA.replace(/ /g, '&nbsp;');
    const { rc, saida } = rodar(
      fixture({
        ...PADRAO,
        [`${UNIDADE}/resumo.ts`]: `export const r = ['${PLANA}'];\n`,
        'LEIA.md': `Anotação: ${copia}\n`
      })
    );
    expect(rc, saida).toBe(1);
    expect(saida).toContain('LEIA.md');
  });
});

describe('verificar-particao: classificação fechada (L-17)', () => {
  it('caminho cifrado sem classe reprova, sai 1 e aponta o caminho', () => {
    const { rc, saida } = rodar(
      fixture(
        { ...PADRAO, 'novo/x.md': 'Arquivo sintetico cifrado sem classe declarada.\n' },
        `${ATRIBUTOS}novo/** filter=git-crypt diff=git-crypt\n`
      )
    );
    expect(rc, saida).toBe(1);
    expect(saida).toMatch(/SEM CLASSE.*novo\/x\.md/);
  });

  it('docs/ cifrado fica fora da fonte com classe declarada: sai 0 e imprime fora_da_fonte=1', () => {
    const { rc, saida } = rodar(
      fixture(
        { ...PADRAO, 'docs/nota.md': 'Nota interna sintetica, sem trecho de estudo.\n' },
        `${ATRIBUTOS}docs/** filter=git-crypt diff=git-crypt\n`
      )
    );
    expect(rc, saida).toBe(0);
    // resumo.ts é fonte; meta.ts (do PADRAO) e docs/nota.md são fora da fonte.
    expect(saida).toMatch(/fontes=1 permitidas=2 fora_da_fonte=2 sem_classe=0/);
  });
});

describe('verificar-particao: literais concatenados no claro (LU-F1.2, bypass A)', () => {
  it('trecho de 40 caracteres partido em dois literais com +, cada um abaixo de 40, em .ts claro: sai 1', () => {
    const literais = ['A cadeira estuda a função social da ', 'propriedade urbana e seus limites'];
    // Pré-condição do caso: cada literal abaixo de 40, e a junção acima de 40.
    expect(literais.every((l) => l.length < 40)).toBe(true);
    const { rc, saida } = rodar(
      fixture({
        ...PADRAO,
        'src/ui/x.ts': `export const x = '${literais[0]}' + '${literais[1]}';\n`
      })
    );
    expect(rc, saida).toBe(1);
    expect(saida).toContain('src/ui/x.ts');
  });

  it('o mesmo trecho em .vue, dentro do bloco script, partido em dois literais: sai 1', () => {
    const { rc, saida } = rodar(
      fixture({
        ...PADRAO,
        'src/ui/X.vue':
          "<template><p>oi</p></template>\n<script setup lang=\"ts\">\nconst x = 'A cadeira estuda a função social da ' + 'propriedade urbana e seus limites';\n</script>\n"
      })
    );
    expect(rc, saida).toBe(1);
    expect(saida).toContain('src/ui/X.vue');
  });
});

describe('verificar-particao: NUL em extensão textual é falha, nunca saída silenciosa (LU-F1.2, bypass B)', () => {
  it('NUL no byte inicial de .md em claro: sai 1 pela regra de NUL, com o caminho', () => {
    const { rc, saida } = rodar(
      fixture({
        ...PADRAO,
        'LEIA.md': `\u0000Anotação: A FUNCAO SOCIAL DA PROPRIEDADE URBANA e seus limites legais, copiado.\n`
      })
    );
    expect(rc, saida).toBe(1);
    expect(saida).toMatch(/CAMINHO COM NUL.*LEIA\.md/);
  });

  it('NUL depois dos 8000 primeiros bytes de .md em claro: sai 1 pela regra de NUL', () => {
    const { rc, saida } = rodar(
      fixture({
        ...PADRAO,
        'LEIA.md': `${'x'.repeat(9000)}\u0000\n`
      })
    );
    expect(rc, saida).toBe(1);
    expect(saida).toMatch(/CAMINHO COM NUL.*LEIA\.md/);
  });

  it('extensão fora da lista de binários, com NUL: sai 1 (fechado por padrão)', () => {
    const { rc, saida } = rodar(
      fixture({
        ...PADRAO,
        'src/ui/dados.bin': `\u0000Anotação: A FUNCAO SOCIAL DA PROPRIEDADE URBANA e seus limites.\n`
      })
    );
    expect(rc, saida).toBe(1);
    expect(saida).toMatch(/CAMINHO COM NUL.*dados\.bin/);
  });

  it('imagem PNG com NUL e trecho copiado: sai 0, binário de verdade fica fora por extensão', () => {
    const { rc, saida } = rodar(
      fixture({
        ...PADRAO,
        'src/ui/img.png': `\u0000A FUNCAO SOCIAL DA PROPRIEDADE URBANA e seus limites\n`
      })
    );
    expect(rc, saida).toBe(0);
    expect(saida).toMatch(/nul=0/);
  });
});
