import { describe, expect, it } from 'vitest';
import { validarConteudoJuri } from '@/core/juri/validar';
import { conteudoJuriFalso, idFalso, idsFalsos } from './apoio/conteudoJuriFalso';

type Json = Record<string, any>;

function codigos(json: unknown, ids = idsFalsos()): string[] {
  const r = validarConteudoJuri(json, ids);
  return r.ok ? [] : r.erros.map((e) => e.codigo);
}

/** Aceitação exige `ok: true`: lista de erros vazia não basta (o stub devolve vazia). */
function aceita(json: unknown): boolean {
  return validarConteudoJuri(json, idsFalsos()).ok === true;
}

function com(mutar: (c: Json) => void): Json {
  const c = conteudoJuriFalso() as Json;
  mutar(c);
  return c;
}

describe('validarConteudoJuri: caminho feliz', () => {
  it('aceita a fixture falsa bem formada', () => {
    const r = validarConteudoJuri(conteudoJuriFalso(), idsFalsos());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.conteudo.quiz).toHaveLength(40);
      expect(r.conteudo.quadroTermos).toHaveLength(3);
    }
  });

  it('o erro nunca carrega o valor, só código e caminho', () => {
    const c = com((x) => {
      x.resumo[0].corpoHtml = '<p onclick="SEGREDO()">x</p>';
    });
    const r = validarConteudoJuri(c, idsFalsos());
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(JSON.stringify(r.erros)).not.toContain('SEGREDO');
      expect(r.erros[0]!.caminho).toBe('resumo[0].corpoHtml');
    }
  });
});

describe('quiz: 40 perguntas no formato das páginas de estudo', () => {
  it('reprova 39 perguntas', () => {
    expect(codigos(com((x) => x.quiz.pop()))).toContain('quantidade');
  });

  it('reprova 41 perguntas', () => {
    expect(codigos(com((x) => x.quiz.push({ ...x.quiz[0], id: 41 })))).toContain('quantidade');
  });

  it('aceita o quiz inteiro com cinco alternativas', () => {
    const c = com((x) => {
      for (const p of x.quiz) {
        if (p.alternativasHtml) p.alternativasHtml.push('Resposta fictícia cinco');
      }
    });
    expect(aceita(c)).toBe(true);
  });

  it('reprova quiz que mistura quatro e cinco alternativas', () => {
    const c = com((x) => x.quiz[0].alternativasHtml.push('Resposta fictícia cinco'));
    expect(codigos(c)).toContain('alternativas-homogeneas');
  });

  it('reprova correta fora das alternativas', () => {
    expect(codigos(com((x) => (x.quiz[0].correta = 4)))).toContain('correta-fora');
  });

  it('reprova verdadeiro ou falso com correta que não é booleana', () => {
    expect(codigos(com((x) => (x.quiz[4].correta = 1)))).toContain('correta-fora');
  });

  it('reprova tipo desconhecido', () => {
    expect(codigos(com((x) => (x.quiz[0].tipo = 'associacao')))).toContain('tipo-invalido');
  });

  it('reprova id fora da ordem', () => {
    expect(codigos(com((x) => (x.quiz[0].id = 7)))).toContain('id-invalido');
  });

  it('reprova fonteExtra, que não faz parte do formato da Júri', () => {
    expect(codigos(com((x) => (x.quiz[0].fonteExtra = false)))).toContain('campo-proibido');
  });
});

describe('quiz: explicação e enunciado não citam letra nem posição', () => {
  it('reprova explicação que cita "alternativa B"', () => {
    const c = com((x) => (x.quiz[0].explicacaoHtml = '<p>A alternativa B está certa.</p>'));
    expect(codigos(c)).toContain('citacao-de-alternativa');
  });

  it('reprova explicação que aponta posição ("acima")', () => {
    const c = com((x) => (x.quiz[0].explicacaoHtml = '<p>Veja a resposta acima.</p>'));
    expect(codigos(c)).toContain('citacao-de-alternativa');
  });

  it('reprova enunciado que cita letra', () => {
    const c = com((x) => (x.quiz[0].enunciadoHtml = '<p>Marque a letra C.</p>'));
    expect(codigos(c)).toContain('citacao-de-alternativa');
  });

  it('o erro de letra não ecoa o trecho citado', () => {
    const c = com((x) => (x.quiz[0].explicacaoHtml = '<p>A alternativa B está certa.</p>'));
    const r = validarConteudoJuri(c, idsFalsos());
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.erros.map((e) => e.codigo)).toContain('citacao-de-alternativa');
      expect(JSON.stringify(r.erros)).not.toContain('alternativa B');
    }
  });
});

describe('fontes: todo item tem fonte', () => {
  it('reprova item com lista de fontes vazia', () => {
    expect(codigos(com((x) => (x.resumo[0].fontes = [])))).toContain('fontes');
  });

  it('reprova item sem o campo fontes', () => {
    expect(codigos(com((x) => delete x.mnemonicos[0].fontes))).toContain('campo-ausente');
  });

  it('reprova fonte vazia dentro da lista', () => {
    expect(codigos(com((x) => (x.quadroTermos[1].fontes = [''])))).toContain('fontes');
  });

  it('reprova pergunta sem fontes', () => {
    expect(codigos(com((x) => (x.quiz[9].fontes = [])))).toContain('fontes');
  });
});

describe('resumo: linhaA e linhaB vêm em par', () => {
  it('reprova linhaA sem linhaB', () => {
    expect(codigos(com((x) => delete x.resumo[0].linhaB))).toContain('linha-impar');
  });

  it('reprova linhaB sem linhaA', () => {
    expect(codigos(com((x) => (x.resumo[1].linhaB = '<p>Linha B sozinha.</p>')))).toContain(
      'linha-impar'
    );
  });

  it('aceita bloco sem nenhuma linha', () => {
    expect(aceita(com(() => {}))).toBe(true);
  });
});

describe('imagens: referenciadas só se estão no índice do acervo', () => {
  it('reprova imagem fora do índice', () => {
    expect(codigos(com((x) => (x.imagens[0].id = idFalso(9))))).toContain('imagem-fora-do-indice');
  });

  it('reprova id que não é 32 hex minúsculos', () => {
    expect(codigos(com((x) => (x.imagens[0].id = 'ABC')))).toContain('imagem-id-invalido');
    expect(codigos(com((x) => (x.imagens[0].id = 'A'.repeat(32))))).toContain('imagem-id-invalido');
  });
});

describe('quadro de termos', () => {
  it('reprova com menos de 3 termos', () => {
    expect(codigos(com((x) => x.quadroTermos.splice(2, 1)))).toContain('quantidade');
  });
});

describe('mapa mental', () => {
  it('aceita folha no nível 4', () => {
    const c = com((x) => {
      x.mapa = {
        rotulo: 'Raiz',
        filhos: [
          {
            rotulo: 'n1',
            filhos: [{ rotulo: 'n2', filhos: [{ rotulo: 'n3', filhos: [{ rotulo: 'n4' }] }] }]
          }
        ]
      };
    });
    expect(aceita(c)).toBe(true);
  });

  it('reprova filho no nível 5', () => {
    const c = com((x) => {
      x.mapa = {
        rotulo: 'Raiz',
        filhos: [
          {
            rotulo: 'n1',
            filhos: [
              {
                rotulo: 'n2',
                filhos: [{ rotulo: 'n3', filhos: [{ rotulo: 'n4', filhos: [{ rotulo: 'n5' }] }] }]
              }
            ]
          }
        ]
      };
    });
    expect(codigos(c)).toContain('profundidade');
  });

  it('reprova mapa sem filhos', () => {
    expect(codigos(com((x) => (x.mapa = { rotulo: 'Raiz' })))).toContain('quantidade');
  });
});

describe('HTML proibido reprova o payload inteiro', () => {
  const ruins: Array<[string, string]> = [
    ['script', '<p>a</p><script>alert(1)</script>'],
    ['atributo', '<p class="x">a</p>'],
    ['atributo de evento', '<p onclick="x()">a</p>'],
    ['imagem', '<img src=x>'],
    ['comentário', '<!-- x --><p>a</p>'],
    ['sinal de menor solto', 'a < b'],
    ['entidade fora da lista', '&copy;'],
    ['e comercial solto', 'P&D']
  ];
  const campos: Array<[string, (x: Json, html: string) => void]> = [
    ['resumo.corpoHtml', (x, h) => (x.resumo[0].corpoHtml = h)],
    ['resumo.linhaA', (x, h) => (x.resumo[0].linhaA = h)],
    ['quadroTermos.definicaoHtml', (x, h) => (x.quadroTermos[0].definicaoHtml = h)],
    ['fichamento.oQueEHtml', (x, h) => (x.fichamento[0].oQueEHtml = h)],
    ['respostasDefesa.teseHtml', (x, h) => (x.respostasDefesa[0].teseHtml = h)],
    ['mnemonicos.dicaHtml', (x, h) => (x.mnemonicos[0].dicaHtml = h)],
    ['quiz.enunciadoHtml', (x, h) => (x.quiz[0].enunciadoHtml = h)],
    ['quiz.explicacaoHtml', (x, h) => (x.quiz[0].explicacaoHtml = h)],
    ['quiz.alternativasHtml', (x, h) => (x.quiz[0].alternativasHtml[2] = h)]
  ];
  for (const [campo, aplicar] of campos) {
    for (const [nome, html] of ruins) {
      it(`rejeita ${nome} em ${campo}`, () => {
        expect(codigos(com((x) => aplicar(x, html))).length).toBeGreaterThan(0);
      });
    }
  }

  it('texto puro com marcação reprova', () => {
    expect(codigos(com((x) => (x.titulo = '<b>Título</b>')))).toContain('texto-com-marcacao');
  });
});
