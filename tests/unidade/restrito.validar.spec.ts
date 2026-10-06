import { describe, expect, it } from 'vitest';
import { validarConteudoRestrito } from '@/core/restrito/validar';
import { conteudoRestritoFalso } from './apoio/conteudoRestritoFalso';

type Json = Record<string, any>;

function codigos(json: unknown): string[] {
  const r = validarConteudoRestrito(json);
  return r.ok ? [] : r.erros.map((e) => e.codigo);
}

function com(mutar: (c: Json) => void): Json {
  const c = conteudoRestritoFalso() as Json;
  mutar(c);
  return c;
}

describe('validarConteudoRestrito: caminho feliz', () => {
  it('aceita o conteúdo falso bem formado', () => {
    const r = validarConteudoRestrito(conteudoRestritoFalso());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.conteudo.quiz).toHaveLength(40);
      expect(r.conteudo.equipe.integrantes).toHaveLength(2);
    }
  });

  it('aceita as tags e entidades do allowlist, incluindo br e tabela', () => {
    const c = com((x) => {
      x.resumo[0].corpoHtml =
        '<h3>t</h3><h4>t</h4><blockquote><p>a<br>b<br/>c &lt; &gt; &quot; &#39; &nbsp; &amp;</p></blockquote>' +
        '<ol><li>1</li></ol><table><thead><tr><th>h</th></tr></thead><tbody><tr><td>d</td></tr></tbody></table>';
    });
    expect(codigos(c)).toEqual([]);
  });

  it('o erro nunca carrega o valor, só código e caminho', () => {
    const c = com((x) => {
      x.resumo[0].corpoHtml = '<p onclick="SEGREDO()">x</p>';
    });
    const r = validarConteudoRestrito(c);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(JSON.stringify(r.erros)).not.toContain('SEGREDO');
      expect(r.erros[0]!.caminho).toBe('resumo[0].corpoHtml');
    }
  });
});

describe('validarConteudoRestrito: HTML fora do allowlist rejeita o payload inteiro', () => {
  const ruins: Array<[string, string]> = [
    ['script', '<p>a</p><script>alert(1)</script>'],
    ['atributo', '<p class="x">a</p>'],
    ['atributo de evento', '<p onclick="x()">a</p>'],
    ['link', '<a href="https://x">a</a>'],
    ['imagem', '<img src=x>'],
    ['svg', '<svg onload=x>'],
    ['iframe', '<iframe></iframe>'],
    ['maiúscula', '<P>a</P>'],
    ['tag com espaço', '<p >a</p>'],
    ['tag incompleta', '<p'],
    ['comentário', '<!-- x --><p>a</p>'],
    ['cdata', '<![CDATA[x]]>'],
    ['sinal de menor solto', 'a < b'],
    ['entidade numérica fora da lista', '&#60;script&#62;'],
    ['entidade nomeada fora da lista', '&copy;'],
    ['e comercial solto', 'P&D']
  ];
  for (const [nome, html] of ruins) {
    it(`rejeita ${nome}`, () => {
      const c = com((x) => {
        x.quiz[3].explicacaoHtml = html;
      });
      expect(codigos(c).length).toBeGreaterThan(0);
    });
  }

  it('rejeita em alternativa, enunciado, exemplo e corpo', () => {
    expect(codigos(com((x) => (x.quiz[0].alternativasHtml[2] = '<b>x</b>')))).not.toEqual([]);
    expect(codigos(com((x) => (x.quiz[0].enunciadoHtml = '<u>x</u>')))).not.toEqual([]);
    expect(codigos(com((x) => (x.resumo[0].exemploHtml = '<p style=x>x</p>')))).not.toEqual([]);
    expect(codigos(com((x) => (x.resumo[1].corpoHtml = '<a>x</a>')))).not.toEqual([]);
  });

  it('texto puro (título, rótulo, item de resumo) não pode ter marcação', () => {
    expect(codigos(com((x) => (x.resumo[0].titulo = '<b>x</b>')))).not.toEqual([]);
    expect(codigos(com((x) => (x.resumo[0].resumo[0] = '<b>x</b>')))).not.toEqual([]);
    expect(codigos(com((x) => (x.mapa.filhos[0].rotulo = '<b>x</b>')))).not.toEqual([]);
    expect(codigos(com((x) => (x.meta.titulo = '<b>x</b>')))).not.toEqual([]);
    expect(codigos(com((x) => (x.equipe.integrantes[0] = '<b>x</b>')))).not.toEqual([]);
  });
});

describe('validarConteudoRestrito: limites e forma', () => {
  it('rejeita entradas que não são objeto', () => {
    for (const ruim of [null, undefined, 3, 'x', [], true]) {
      expect(codigos(ruim)).not.toEqual([]);
    }
  });

  it('exige versão 1', () => {
    expect(codigos(com((x) => (x.versao = 2)))).toContain('versao');
  });

  it('exige exatamente 40 perguntas', () => {
    expect(codigos(com((x) => x.quiz.pop()))).toContain('quantidade');
    expect(codigos(com((x) => x.quiz.push({ ...x.quiz[0], id: 41 })))).toContain('quantidade');
  });

  it('exige ids de 1 a 40 sem repetição', () => {
    expect(codigos(com((x) => (x.quiz[5].id = 1)))).toContain('id-invalido');
    expect(codigos(com((x) => (x.quiz[5].id = '6')))).toContain('id-invalido');
  });

  it('exige quatro alternativas', () => {
    expect(codigos(com((x) => x.quiz[0].alternativasHtml.pop()))).toContain('quantidade');
    expect(codigos(com((x) => x.quiz[0].alternativasHtml.push('e')))).toContain('quantidade');
  });

  it('correta entre 0 e 3, inteiro', () => {
    for (const ruim of [4, -1, 1.5, '2', null]) {
      expect(codigos(com((x) => (x.quiz[0].correta = ruim)))).toContain('correta-fora');
    }
  });

  it('categoria só conceitos, aplicacao ou fundamentos', () => {
    expect(codigos(com((x) => (x.quiz[0].categoria = 'teoria')))).toContain('categoria');
  });

  it('fonteExtra tem de ser false; origem, gabaritoDoCaderno e componenteExtra são proibidos', () => {
    expect(codigos(com((x) => (x.quiz[0].fonteExtra = true)))).toContain('campo-proibido');
    expect(codigos(com((x) => (x.quiz[0].origem = 'professor')))).toContain('campo-proibido');
    expect(codigos(com((x) => (x.quiz[0].gabaritoDoCaderno = true)))).toContain('campo-proibido');
    expect(codigos(com((x) => (x.resumo[0].componenteExtra = 'checklist-art-319')))).toContain(
      'campo-proibido'
    );
  });

  it('rótulo do mapa com até 90 caracteres', () => {
    expect(codigos(com((x) => (x.mapa.filhos[0].rotulo = 'a'.repeat(90))))).toEqual([]);
    expect(codigos(com((x) => (x.mapa.filhos[0].rotulo = 'a'.repeat(91))))).toContain(
      'rotulo-longo'
    );
  });

  it('profundidade do mapa: raiz mais quatro níveis', () => {
    const cadeia = (n: number): Json => ({
      rotulo: 'r',
      filhos: n > 0 ? [cadeia(n - 1)] : undefined
    });
    expect(codigos(com((x) => (x.mapa = cadeia(4))))).toEqual([]);
    expect(codigos(com((x) => (x.mapa = cadeia(5))))).toContain('profundidade');
  });

  it('exige ao menos um bloco de resumo e um nó filho no mapa', () => {
    expect(codigos(com((x) => (x.resumo = [])))).toContain('quantidade');
    expect(codigos(com((x) => (x.mapa = { rotulo: 'só raiz' })))).toContain('quantidade');
  });

  it('exige integrantes como lista de textos e instituição', () => {
    expect(codigos(com((x) => (x.equipe.integrantes = 'x')))).not.toEqual([]);
    expect(codigos(com((x) => (x.equipe.instituicao = '')))).not.toEqual([]);
  });

  it('o resultado aprovado é imutável e não aliasa o JSON de entrada', () => {
    const entrada = conteudoRestritoFalso();
    const r = validarConteudoRestrito(entrada);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(Object.isFrozen(r.conteudo)).toBe(true);
      expect(Object.isFrozen(r.conteudo.quiz[0])).toBe(true);
      expect(r.conteudo).not.toBe(entrada);
    }
  });

  it('descarta campos desconhecidos em vez de repassá-los', () => {
    const c = com((x) => (x.quiz[0].extra = '<script>'));
    const r = validarConteudoRestrito(c);
    expect(r.ok).toBe(true);
    if (r.ok) expect('extra' in r.conteudo.quiz[0]!).toBe(false);
  });
});
