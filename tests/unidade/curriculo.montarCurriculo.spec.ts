import { describe, expect, it } from 'vitest';
import { ErroDeConteudo } from '@/core/curriculo/erroDeConteudo';
import {
  montarCurriculo,
  type DescricaoCadeira,
  type DescricaoUnidade,
  type EntradasDoCurriculo
} from '@/core/curriculo/montarCurriculo';
import type { GrupoDeTopicos } from '@/core/curriculo/tipos';

/**
 * Montagem do currículo a partir de descrições sintéticas (pasta a pasta, D1).
 * Sem glob e sem disco: prova a regra de forma, ordem, ausências e erros.
 */
const ATALHO = { rotulo: 'Interdisciplinar', apos: 'u1', cadeiraId: 'interdisciplinar' };

const CADEIRA_A: DescricaoCadeira = {
  nome: 'Cadeira A',
  ordem: 2,
  estado: 'publicado',
  atalhoUnidade: ATALHO
};
const CADEIRA_B: DescricaoCadeira = { nome: 'Cadeira B', ordem: 1, estado: 'publicado' };
const RESTRITA: DescricaoCadeira = {
  nome: 'Restrita',
  ordem: 3,
  estado: 'publicado',
  restrita: true
};

const UNIDADE_U1: DescricaoUnidade = {
  titulo: 'Título u1',
  estado: 'publicado'
};

function entradas(parcial: Partial<EntradasDoCurriculo> = {}): EntradasDoCurriculo {
  return {
    caminhos: [
      'p1/cadeira-a/u1/meta.ts',
      'p1/cadeira-a/u1/resumo.ts',
      'p1/cadeira-a/u1/quiz/index.ts',
      'p1/cadeira-a/u1/quiz/parte.ts',
      'p1/cadeira-b/u1/meta.ts',
      'p1/cadeira-b/u1/resumo.ts'
    ],
    cadeiras: {
      'p1/cadeira-a/cadeira.ts': CADEIRA_A,
      'p1/cadeira-b/cadeira.ts': CADEIRA_B,
      'p1/restrita/cadeira.ts': RESTRITA
    },
    metas: {
      'p1/cadeira-a/u1/meta.ts': UNIDADE_U1,
      'p1/cadeira-b/u1/meta.ts': { ...UNIDADE_U1, titulo: 'Título B' }
    },
    ...parcial
  };
}

describe('montarCurriculo: forma dos períodos', () => {
  it('monta exatamente dez períodos, p1 a p10, com rótulo de ordinal', () => {
    const curriculo = montarCurriculo(entradas());
    expect(curriculo.map((p) => p.id)).toEqual([
      'p1',
      'p2',
      'p3',
      'p4',
      'p5',
      'p6',
      'p7',
      'p8',
      'p9',
      'p10'
    ]);
    expect(curriculo.map((p) => p.numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(curriculo[0]?.rotulo).toBe('1º período');
    expect(curriculo[9]?.rotulo).toBe('10º período');
  });

  it('período sem pasta fica vazio, sem cadeira inventada', () => {
    const curriculo = montarCurriculo(entradas());
    expect(curriculo[1]?.cadeiras).toEqual([]);
  });

  it('reprova pasta de período que não é pN (não some em silêncio por NaN)', () => {
    expect(() =>
      montarCurriculo(
        entradas({ cadeiras: { ...entradas().cadeiras, 'provas/x/cadeira.ts': CADEIRA_A } })
      )
    ).toThrow(/fora de 1 a 10.*provas/);
  });

  it('reprova pasta de período fora de 1 a 10', () => {
    expect(() =>
      montarCurriculo(
        entradas({
          caminhos: ['p11/x/u1/meta.ts', 'p11/x/u1/resumo.ts'],
          metas: { 'p11/x/u1/meta.ts': UNIDADE_U1 },
          cadeiras: { 'p11/x/cadeira.ts': CADEIRA_A }
        })
      )
    ).toThrow(/fora de 1 a 10.*p11/);
  });
});

describe('montarCurriculo: ordem', () => {
  it('ordena as cadeiras pelo campo ordem, não pela ordem da entrada', () => {
    const [periodo] = montarCurriculo(entradas()).slice(0, 1);
    expect(periodo?.cadeiras.map((c) => c.id)).toEqual(['cadeira-b', 'cadeira-a', 'restrita']);
  });

  it('ordena as unidades pelo número do id (u10 depois de u2)', () => {
    const caminhos = [
      'p1/cadeira-b/u10/meta.ts',
      'p1/cadeira-b/u10/resumo.ts',
      'p1/cadeira-b/u2/meta.ts',
      'p1/cadeira-b/u2/resumo.ts'
    ];
    const metas = { 'p1/cadeira-b/u10/meta.ts': UNIDADE_U1, 'p1/cadeira-b/u2/meta.ts': UNIDADE_U1 };
    const [periodo] = montarCurriculo(
      entradas({ caminhos, metas, cadeiras: { 'p1/cadeira-b/cadeira.ts': CADEIRA_B } })
    ).slice(0, 1);
    expect(periodo?.cadeiras[0]?.unidades.map((u) => u.id)).toEqual(['u2', 'u10']);
  });

  it('reprova duas cadeiras com a mesma ordem no mesmo período', () => {
    expect(() =>
      montarCurriculo(
        entradas({
          cadeiras: {
            'p1/cadeira-a/cadeira.ts': CADEIRA_A,
            'p1/cadeira-b/cadeira.ts': { ...CADEIRA_B, ordem: 2 },
            'p1/restrita/cadeira.ts': RESTRITA
          }
        })
      )
    ).toThrow(/ordem repetida em p1/);
  });
});

describe('montarCurriculo: unidade, abas e atalho', () => {
  it('unidade recebe rótulo, título e estado do meta, e as abas dos arquivos presentes', () => {
    const [periodo] = montarCurriculo(entradas()).slice(0, 1);
    const unidade = periodo?.cadeiras.find((c) => c.id === 'cadeira-a')?.unidades[0];
    expect(unidade).toEqual({
      id: 'u1',
      rotulo: 'AV1',
      titulo: 'Título u1',
      estado: 'publicado',
      abas: ['resumo', 'quiz']
    });
  });

  it('unidade em-breve não tem abas, mesmo com arquivos presentes (u2 publicada segura a cadeira)', () => {
    const emBreve: DescricaoUnidade = { ...UNIDADE_U1, estado: 'em-breve' };
    const caminhos = [
      'p1/cadeira-b/u1/meta.ts',
      'p1/cadeira-b/u1/resumo.ts',
      'p1/cadeira-b/u2/meta.ts',
      'p1/cadeira-b/u2/resumo.ts'
    ];
    const metas = {
      'p1/cadeira-b/u1/meta.ts': emBreve,
      'p1/cadeira-b/u2/meta.ts': { ...UNIDADE_U1, rotulo: 'Unidade 2' }
    };
    const [periodo] = montarCurriculo(
      entradas({ caminhos, metas, cadeiras: { 'p1/cadeira-b/cadeira.ts': CADEIRA_B } })
    ).slice(0, 1);
    const [u1, u2] = periodo?.cadeiras[0]?.unidades ?? [];
    expect(u1?.abas).toEqual([]);
    expect(u2?.abas).toEqual(['resumo']);
  });

  it('cadeira restrita sem unidade traz restrita true e lista vazia', () => {
    const curriculo = montarCurriculo(entradas());
    const restrita = curriculo[0]?.cadeiras.find((c) => c.id === 'restrita');
    expect(restrita?.restrita).toBe(true);
    expect(restrita?.unidades).toEqual([]);
  });

  it('atalho aparece só quando a descrição o traz; sem ele, a chave não existe', () => {
    const curriculo = montarCurriculo(entradas());
    const cadeiraA = curriculo[0]?.cadeiras.find((c) => c.id === 'cadeira-a');
    const cadeiraB = curriculo[0]?.cadeiras.find((c) => c.id === 'cadeira-b');
    expect(cadeiraA?.atalhoUnidade).toEqual(ATALHO);
    expect('atalhoUnidade' in (cadeiraB ?? {})).toBe(false);
    expect('restrita' in (cadeiraB ?? {})).toBe(false);
  });

  it('o currículo montado não traz função nenhuma (carregar fica para src/app)', () => {
    const unidade = montarCurriculo(entradas())[0]?.cadeiras[0]?.unidades[0];
    expect('carregar' in (unidade ?? {})).toBe(false);
  });
});

describe('montarCurriculo: erros explícitos de descrição inconsistente', () => {
  it('reprova pasta de cadeira sem cadeira.ts, nomeando a cadeira', () => {
    const cadeiras = { 'p1/cadeira-b/cadeira.ts': CADEIRA_B, 'p1/restrita/cadeira.ts': RESTRITA };
    expect(() => montarCurriculo(entradas({ cadeiras }))).toThrow(
      new RegExp(`${'sem descrição'}.*p1/cadeira-a`)
    );
  });

  it('reprova cadeira publicada e não restrita sem nenhuma unidade publicada', () => {
    const cadeiras = {
      'p1/cadeira-b/cadeira.ts': CADEIRA_B,
      'p1/cadeira-a/cadeira.ts': CADEIRA_A,
      'p1/vazia/cadeira.ts': { nome: 'Vazia', ordem: 9, estado: 'publicado' as const }
    };
    expect(() => montarCurriculo(entradas({ cadeiras }))).toThrow(
      /sem unidade publicada.*p1\/vazia/
    );
  });

  it('reprova unidade publicada que não tem nenhuma aba', () => {
    const caminhos = ['p1/cadeira-b/u1/meta.ts'];
    expect(() =>
      montarCurriculo(
        entradas({
          caminhos,
          metas: { 'p1/cadeira-b/u1/meta.ts': UNIDADE_U1 },
          cadeiras: { 'p1/cadeira-b/cadeira.ts': CADEIRA_B }
        })
      )
    ).toThrow(/sem nenhuma aba.*p1\/cadeira-b\/u1/);
  });

  it('reprova arquivo de unidade sem descrição de meta (meta.ts ausente em metas)', () => {
    expect(() => montarCurriculo(entradas({ metas: {} }))).toThrow(ErroDeConteudo);
    expect(() => montarCurriculo(entradas({ metas: {} }))).toThrow(/sem descrição de unidade/);
  });
});

/**
 * AV com tópicos agrupados (D7): cadeira.ts declara os grupos, e a pasta uN-grupo-topico
 * é um tópico. Os erros cobrem os casos que o conteúdo não pode ter.
 */
const GRUPOS_U3: GrupoDeTopicos[] = [
  { unidade: 'u3', id: 'livro', rotulo: 'Livro' },
  { unidade: 'u3', id: 'material', rotulo: 'Material de estudo' }
];
const CAMINHOS_TOPICO = [
  'p1/cadeira-b/u3-livro-textura/meta.ts',
  'p1/cadeira-b/u3-livro-textura/resumo.ts'
];
const METAS_TOPICO = { 'p1/cadeira-b/u3-livro-textura/meta.ts': UNIDADE_U1 };

function cadeiraBComGrupos(
  caminhos: readonly string[],
  metas: Readonly<Record<string, DescricaoUnidade>>,
  grupos: GrupoDeTopicos[] | undefined
) {
  return montarCurriculo(
    entradas({
      caminhos,
      metas,
      cadeiras: { 'p1/cadeira-b/cadeira.ts': { ...CADEIRA_B, grupos } }
    })
  )[0]!.cadeiras[0]!;
}

describe('montarCurriculo: tópicos agrupados (AV com grupos)', () => {
  it('o tópico do grupo declarado entra na cadeira com rótulo AV do número, e os grupos chegam à cadeira', () => {
    const cadeira = cadeiraBComGrupos(CAMINHOS_TOPICO, METAS_TOPICO, GRUPOS_U3);
    expect(cadeira.unidades.map((u) => u.id)).toEqual(['u3-livro-textura']);
    expect(cadeira.unidades[0]?.rotulo).toBe('AV3');
    expect(cadeira.grupos).toEqual(GRUPOS_U3);
  });

  it('ordena por número e, no mesmo número, pelo id', () => {
    const caminhos = [
      'p1/cadeira-b/u1/meta.ts',
      'p1/cadeira-b/u1/resumo.ts',
      'p1/cadeira-b/u3-livro-b/meta.ts',
      'p1/cadeira-b/u3-livro-b/resumo.ts',
      'p1/cadeira-b/u3-livro-a/meta.ts',
      'p1/cadeira-b/u3-livro-a/resumo.ts'
    ];
    const metas = {
      'p1/cadeira-b/u1/meta.ts': UNIDADE_U1,
      'p1/cadeira-b/u3-livro-a/meta.ts': UNIDADE_U1,
      'p1/cadeira-b/u3-livro-b/meta.ts': UNIDADE_U1
    };
    const cadeira = cadeiraBComGrupos(caminhos, metas, GRUPOS_U3);
    expect(cadeira.unidades.map((u) => u.id)).toEqual(['u1', 'u3-livro-a', 'u3-livro-b']);
  });

  it('o rótulo é AV pelo número da pasta, mesmo que a unidade traga rotulo antigo', () => {
    const caminhos = ['p1/cadeira-b/u2/meta.ts', 'p1/cadeira-b/u2/resumo.ts'];
    const metas = {
      'p1/cadeira-b/u2/meta.ts': { ...UNIDADE_U1, rotulo: 'Unidade 2' } as DescricaoUnidade
    };
    const cadeira = cadeiraBComGrupos(caminhos, metas, undefined);
    expect(cadeira.unidades[0]?.rotulo).toBe('AV2');
  });

  it('reprova unidade u3 simples junto com grupo de tópicos da mesma AV', () => {
    const caminhos = [...CAMINHOS_TOPICO, 'p1/cadeira-b/u3/meta.ts', 'p1/cadeira-b/u3/resumo.ts'];
    const metas = { ...METAS_TOPICO, 'p1/cadeira-b/u3/meta.ts': UNIDADE_U1 };
    expect(() => cadeiraBComGrupos(caminhos, metas, GRUPOS_U3)).toThrow(/u3.*junto com grupo/);
  });

  it('reprova tópico cuja AV não declara o grupo, nomeando o tópico', () => {
    const caminhos = ['p1/cadeira-b/u3-revisao-x/meta.ts', 'p1/cadeira-b/u3-revisao-x/resumo.ts'];
    const metas = { 'p1/cadeira-b/u3-revisao-x/meta.ts': UNIDADE_U1 };
    expect(() => cadeiraBComGrupos(caminhos, metas, GRUPOS_U3)).toThrow(
      /não declarado.*u3-revisao-x/
    );
  });

  it('reprova id de grupo com hífen, nomeando o grupo', () => {
    const grupos: GrupoDeTopicos[] = [{ unidade: 'u3', id: 'meu-livro', rotulo: 'Livro' }];
    expect(() => cadeiraBComGrupos(CAMINHOS_TOPICO, METAS_TOPICO, grupos)).toThrow(/meu-livro/);
  });

  it('reprova qualquer unidade na vaga 2 (u2-*), que é do atalho', () => {
    const caminhos = ['p1/cadeira-b/u2-livro-x/meta.ts', 'p1/cadeira-b/u2-livro-x/resumo.ts'];
    const metas = { 'p1/cadeira-b/u2-livro-x/meta.ts': UNIDADE_U1 };
    expect(() => cadeiraBComGrupos(caminhos, metas, GRUPOS_U3)).toThrow(/vaga 2 reservada/);
  });
});
