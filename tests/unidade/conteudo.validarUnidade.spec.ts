import { describe, expect, it } from 'vitest';
import { validarUnidade } from '@/core/conteudo/validarUnidade';
import type {
  AlternativasQuiz,
  ConteudoUnidade,
  PerguntaMultiplaEscolha,
  PerguntaVerdadeiroOuFalso
} from '@/core/unidade/tipos';

/**
 * Um teste sintético por regra (L-35, TDD): cada caso monta uma unidade mínima
 * válida e quebra uma coisa. A varredura de todas as unidades reais fica em
 * tests/unidade/conteudo.varredura.spec.ts.
 */
const ROTULOS = { teoria: 'Teoria', outra: 'Outra' };

function mc(sobrescrita: Partial<PerguntaMultiplaEscolha> = {}): PerguntaMultiplaEscolha {
  return {
    id: 1,
    categoria: 'teoria',
    enunciadoHtml: 'Qual é a regra geral?',
    fonteExtra: false,
    explicacaoHtml: 'A lei fixa a regra porque protege a segurança das relações.',
    alternativasHtml: ['Uma regra', 'Outra regra', 'Terceira regra', 'Quarta regra'] as const,
    correta: 0,
    ...sobrescrita
  };
}

function unidade(sobrescrita: Partial<ConteudoUnidade> = {}): ConteudoUnidade {
  return {
    meta: {
      rotulo: 'Unidade 1',
      estado: 'publicado',
      titulo: 'Título da unidade',
      subtitulo: 'Subtítulo',
      descricao: 'Descrição curta'
    },
    resumo: [
      {
        id: 'bloco-0',
        numero: 1,
        titulo: 'Conceito básico',
        fonte: 'Autor, Obra, 2020',
        corpoHtml: 'Texto do bloco.',
        resumo: ['Item do quadro'],
        exemploHtml: 'Exemplo na prática.'
      }
    ],
    quiz: [mc()],
    ...sobrescrita
  };
}

function regras(conteudo: ConteudoUnidade): string[] {
  return validarUnidade(conteudo, ROTULOS).map((erro) => erro.regra);
}

describe('unidade válida', () => {
  it('não devolve erro nenhum', () => {
    expect(validarUnidade(unidade(), ROTULOS)).toEqual([]);
  });
});

describe('ids-unicos', () => {
  it('reprova id de pergunta repetido no mesmo quiz', () => {
    expect(regras(unidade({ quiz: [mc({ id: 1 }), mc({ id: 1 })] }))).toEqual(['ids-unicos']);
  });
});

describe('alternativas', () => {
  it('reprova pergunta com três alternativas', () => {
    const tres = ['A', 'B', 'C'] as unknown as AlternativasQuiz;
    expect(regras(unidade({ quiz: [mc({ alternativasHtml: tres, correta: 0 })] }))).toContain(
      'alternativas'
    );
  });

  it('aceita cinco alternativas', () => {
    const cinco = ['A', 'B', 'C', 'D', 'E'] as const;
    expect(regras(unidade({ quiz: [mc({ alternativasHtml: cinco, correta: 4 })] }))).toEqual([]);
  });

  it('reprova alternativa vazia', () => {
    const comVazia = ['Uma', '   ', 'Três', 'Quatro'] as const;
    expect(regras(unidade({ quiz: [mc({ alternativasHtml: comVazia })] }))).toEqual(['vazio']);
  });

  it('reprova quiz que mistura quatro e cinco alternativas', () => {
    const cinco = ['A', 'B', 'C', 'D', 'E'] as const;
    const quiz = [mc({ id: 1 }), mc({ id: 2, alternativasHtml: cinco, correta: 0 })];
    expect(regras(unidade({ quiz }))).toEqual(['alternativas-homogeneas']);
  });

  it('não exige homogeneidade entre verdadeiro ou falso e múltipla escolha', () => {
    const vf: PerguntaVerdadeiroOuFalso = {
      id: 2,
      tipo: 'verdadeiro-ou-falso',
      categoria: 'teoria',
      enunciadoHtml: 'A regra vale para todos.',
      fonteExtra: false,
      explicacaoHtml: 'Vale para todos porque a lei é geral.',
      correta: true
    };
    expect(regras(unidade({ quiz: [mc({ id: 1 }), vf] }))).toEqual([]);
  });
});

describe('correta', () => {
  it('reprova índice da correta fora do intervalo', () => {
    expect(regras(unidade({ quiz: [mc({ correta: 4 })] }))).toEqual(['correta']);
  });

  it('reprova verdadeiro ou falso cuja correta não é booleana', () => {
    const vf = {
      id: 3,
      tipo: 'verdadeiro-ou-falso',
      categoria: 'teoria',
      enunciadoHtml: 'Afirmação.',
      fonteExtra: false,
      explicacaoHtml: 'Porque sim.',
      correta: 'sim'
    } as unknown as PerguntaVerdadeiroOuFalso;
    expect(regras(unidade({ quiz: [vf] }))).toEqual(['correta']);
  });
});

describe('citacao-de-alternativa', () => {
  it('reprova explicação que cita "alternativa B"', () => {
    const explicacao = 'A alternativa B é a certa porque a lei diz isso.';
    expect(regras(unidade({ quiz: [mc({ explicacaoHtml: explicacao })] }))).toEqual([
      'citacao-de-alternativa'
    ]);
  });

  it('reprova explicação que aponta "acima"', () => {
    expect(
      regras(unidade({ quiz: [mc({ explicacaoHtml: 'A resposta está acima, na lista.' })] }))
    ).toEqual(['citacao-de-alternativa']);
  });

  it('aceita "acima do homem", que é expressão da matéria', () => {
    expect(
      regras(unidade({ quiz: [mc({ explicacaoHtml: 'O poder acima do homem é de Deus.' })] }))
    ).toEqual([]);
  });

  it('reprova enunciado que cita letra', () => {
    expect(regras(unidade({ quiz: [mc({ enunciadoHtml: 'Marque a letra C.' })] }))).toEqual([
      'citacao-de-alternativa'
    ]);
  });
});

describe('texto-proibido', () => {
  it('reprova "na aula" num resumo', () => {
    const resumo = unidade().resumo.map((bloco) => ({
      ...bloco,
      corpoHtml: 'Como visto na aula 3, a lei é geral.'
    }));
    expect(regras(unidade({ resumo }))).toEqual(['texto-proibido']);
  });

  it('reprova "o material" no enunciado de pergunta comum', () => {
    expect(
      regras(unidade({ quiz: [mc({ enunciadoHtml: 'Segundo o material, qual a regra?' })] }))
    ).toEqual(['texto-proibido']);
  });

  it('reprova "vale conferir" e "a conferir"', () => {
    const quiz = [mc({ explicacaoHtml: 'Vale conferir a fonte antes de usar.' })];
    expect(regras(unidade({ quiz }))).toEqual(['texto-proibido']);
  });

  it('reprova "slide" na explicação de qualquer pergunta', () => {
    const quiz = [mc({ explicacaoHtml: 'Está no slide do professor.' })];
    expect(regras(unidade({ quiz }))).toEqual(['texto-proibido']);
  });

  it('não confunde "materialista" com "o material"', () => {
    const resumo = unidade().resumo.map((bloco) => ({
      ...bloco,
      corpoHtml: 'O materialista discute o direito como fenômeno histórico.'
    }));
    expect(regras(unidade({ resumo }))).toEqual([]);
  });

  it('isenta enunciado de pergunta do professor da regra de aula, mas não da de material', () => {
    const doProfessor = mc({
      origem: 'professor',
      enunciadoHtml: 'Na aula 2, o que o autor disse?'
    });
    expect(regras(unidade({ quiz: [doProfessor] }))).toEqual([]);
  });

  it('não confunde "demonstração material" (termo de prova) com "o material"', () => {
    // O \b do JavaScript é ASCII: "ã" conta como fronteira, então o "o" final de
    // "demonstração" casava com "o material". Fronteira Unicode corrige isso.
    const resumo = unidade().resumo.map((bloco) => ({
      ...bloco,
      corpoHtml: 'A prova consiste na demonstração material dos fatos, com documentos.'
    }));
    expect(regras(unidade({ resumo }))).toEqual([]);
  });

  it('não isenta a explicação de pergunta do professor', () => {
    const doProfessor = mc({
      origem: 'professor',
      explicacaoHtml: 'Como no slide da aula 2.'
    });
    expect(regras(unidade({ quiz: [doProfessor] }))).toEqual(['texto-proibido']);
  });
});

describe('fonte-proibida', () => {
  it('aceita a referência genérica "Material de aula da disciplina"', () => {
    const resumo = unidade().resumo.map((bloco) => ({
      ...bloco,
      fonte: 'Material de aula da disciplina'
    }));
    expect(regras(unidade({ resumo }))).toEqual([]);
  });

  it('reprova fonte com número de aula ou data', () => {
    const resumo = unidade().resumo.map((bloco) => ({ ...bloco, fonte: 'Aula 3, 12/03' }));
    expect(regras(unidade({ resumo }))).toEqual(['fonte-proibida']);
  });
});

describe('referencia-de-ficha', () => {
  it('reprova mnemônico que aponta para bloco inexistente', () => {
    const mnemonicos = [
      {
        id: 'm1',
        titulo: 'Título',
        tecnica: 'frase' as const,
        dica: 'Dica',
        desafio: 'Desafio',
        guarda: [],
        comoFunciona: 'Porque ajuda.',
        blocoResumo: 'bloco-9'
      }
    ];
    expect(regras(unidade({ mnemonicos }))).toEqual(['referencia-de-ficha']);
  });

  it('aceita ficha que aponta para bloco existente', () => {
    const mnemonicos = [
      {
        id: 'm1',
        titulo: 'Título',
        tecnica: 'frase' as const,
        dica: 'Dica',
        desafio: 'Desafio',
        guarda: [],
        comoFunciona: 'Porque ajuda.',
        blocoResumo: 'bloco-0'
      }
    ];
    expect(regras(unidade({ mnemonicos }))).toEqual([]);
  });
});

describe('vazio e meta', () => {
  it('reprova campo de meta vazio', () => {
    const meta = { ...unidade().meta, descricao: '  ' };
    expect(regras(unidade({ meta }))).toEqual(['vazio']);
  });

  it('reprova explicação vazia', () => {
    expect(regras(unidade({ quiz: [mc({ explicacaoHtml: '' })] }))).toEqual(['vazio']);
  });

  it('reprova gabaritoDoCaderno diferente de true', () => {
    const quiz = [{ ...mc(), gabaritoDoCaderno: false as unknown as true }];
    expect(regras(unidade({ quiz }))).toEqual(['gabarito-do-caderno']);
  });
});

describe('categoria-sem-rotulo', () => {
  it('reprova categoria que não tem rótulo e lista a órfã', () => {
    const erros = validarUnidade(unidade({ quiz: [mc({ categoria: 'inventada' })] }), ROTULOS);
    expect(erros.map((erro) => erro.regra)).toEqual(['categoria-sem-rotulo']);
    expect(erros[0]?.detalhe).toContain('inventada');
  });
});

describe('forma do erro', () => {
  it('cada erro diz a regra, o caminho e o detalhe', () => {
    // O tipo trava correta em 0 a 4; o caso de teste força o valor fora do intervalo.
    const [erro] = validarUnidade(unidade({ quiz: [mc({ correta: 9 as never })] }), ROTULOS);
    expect(erro).toMatchObject({ regra: 'correta', caminho: 'quiz[0].correta' });
    expect(erro?.detalhe).toContain('9');
  });
});

describe('referencias de ficha seguem a regra de fonte', () => {
  function comReferencias(referencias: readonly string[]): ConteudoUnidade {
    const mapaFichamento = {
      titulo: 'Mapa',
      eras: [],
      pensadores: [
        {
          id: 'platao',
          nome: 'Platão',
          faseId: 'fase-1',
          obras: [],
          modoDePensar: 'Modo de pensar.',
          conceitos: [],
          paraODireito: 'Importa porque.',
          referencias,
          blocoResumo: 'bloco-0'
        }
      ]
    };
    return unidade({ mapaFichamento });
  }

  it('aceita a referência genérica "Material de aula da disciplina." junto de obras', () => {
    expect(
      regras(comReferencias(['Material de aula da disciplina.', 'Autor, Obra, 2020']))
    ).toEqual([]);
  });

  it('reprova referência que traz número de aula', () => {
    expect(regras(comReferencias(['Aula 3, Autor, Obra']))).toEqual(['fonte-proibida']);
  });
});

describe('blocos do resumo', () => {
  it('reprova fonte que aparece também dentro do corpo do próprio bloco', () => {
    const resumo = unidade().resumo.map((bloco) => ({
      ...bloco,
      corpoHtml: 'Texto que cita <em>Autor, Obra, 2020</em> logo no corpo.'
    }));
    expect(regras(unidade({ resumo }))).toEqual(['fonte-repetida-no-corpo']);
  });

  it('reprova título que começa com "Bloco N", pois a página já numera os blocos', () => {
    const resumo = unidade().resumo.map((bloco) => ({ ...bloco, titulo: 'Bloco 2: Estado' }));
    expect(regras(unidade({ resumo }))).toEqual(['titulo-com-numero-de-bloco']);
  });
});

/**
 * Exceção do texto fiel (ordem do líder, 21/10/2026: "OCR pressupõe texto
 * fiel. Pode manter como estiver"). O corpo de textoIntegral.blocos não passa
 * pelas regras de redação nem pela de travessão; título e fonte passam.
 */
describe('texto integral: corpo fiel de OCR fica fora das regras de redação', () => {
  const textoFiel = {
    titulo: 'A textura aberta do direito',
    fonte: 'Autor, Obra, 2010. Números entre colchetes: páginas do PDF.',
    blocos: [
      { tipo: 'subtitulo' as const, texto: 'Seção — com travessão original' },
      {
        tipo: 'paragrafo' as const,
        trechos: [
          { tipo: 'texto' as const, texto: 'A regra — vista no material do autor' },
          { tipo: 'italico' as const, texto: 'conveyance' },
          { tipo: 'pagina' as const, numero: 138 }
        ]
      }
    ]
  };

  it('aceita travessão e "o material" dentro do corpo do texto fiel', () => {
    expect(regras(unidade({ textoIntegral: textoFiel }))).toEqual([]);
  });

  it('reprova travessão na fonte do texto integral', () => {
    expect(
      regras(unidade({ textoIntegral: { ...textoFiel, fonte: 'Autor — Obra, 2010' } }))
    ).toEqual(['travessao']);
  });

  it('reprova número de aula na fonte do texto integral', () => {
    expect(
      regras(unidade({ textoIntegral: { ...textoFiel, fonte: 'Autor, Obra, aula 3' } }))
    ).toEqual(['fonte-proibida']);
  });

  it('o mesmo travessão fora do texto fiel continua reprovando', () => {
    expect(
      regras(
        unidade({
          resumo: [
            {
              id: 'bloco-0',
              numero: 1,
              titulo: 'Conceito básico',
              fonte: 'Autor, Obra, 2020',
              corpoHtml: 'Texto — com travessão.',
              resumo: ['Item do quadro'],
              exemploHtml: 'Exemplo na prática.'
            }
          ]
        })
      )
    ).toContain('travessao');
  });
});
