import { describe, expect, it } from 'vitest';
import { validarConteudoRestrito } from '@/core/restrito/validar';
import { conteudoRestritoFalso, notasFalsas, slideFalso } from './apoio/conteudoRestritoFalso';

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

describe('validarConteudoRestrito: slides (texto puro)', () => {
  it('aceita 10 a 14 slides e devolve os campos conhecidos', () => {
    const r = validarConteudoRestrito(conteudoRestritoFalso());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.conteudo.slides).toHaveLength(10);
      expect(r.conteudo.slides[4]!.colunas).toHaveLength(2);
    }
    expect(
      codigos(com((x) => x.slides.push(...[11, 12, 13, 14].map((i) => slideFalso(i, 'topicos')))))
    ).toEqual([]);
  });

  it('exige de 10 a 14 slides', () => {
    expect(codigos(com((x) => x.slides.pop()))).toContain('quantidade');
    expect(
      codigos(
        com((x) => x.slides.push(...[11, 12, 13, 14, 15].map((i) => slideFalso(i, 'topicos'))))
      )
    ).toContain('quantidade');
    expect(codigos(com((x) => delete x.slides))).not.toEqual([]);
  });

  it('ids sequenciais e a capa é o primeiro slide', () => {
    expect(codigos(com((x) => (x.slides[3].id = 9)))).toContain('id-invalido');
    expect(codigos(com((x) => (x.slides[0].layout = 'topicos')))).toContain('layout');
    expect(codigos(com((x) => (x.slides[2].layout = 'galaxia')))).toContain('layout');
  });

  it('nenhum HTML em slide, nem tag nem entidade', () => {
    expect(codigos(com((x) => (x.slides[1].titulo = '<b>x</b>')))).toContain('texto-com-marcacao');
    expect(codigos(com((x) => (x.slides[1].itens[0] = '<i>x</i>')))).toContain(
      'texto-com-marcacao'
    );
    expect(codigos(com((x) => (x.slides[3].destaque = '<p>x</p>')))).toContain(
      'texto-com-marcacao'
    );
    expect(codigos(com((x) => (x.slides[1].notas = notasFalsas(70) + ' <script>')))).toContain(
      'texto-com-marcacao'
    );
    expect(codigos(com((x) => (x.slides[4].colunas[0].titulo = '<b>c</b>')))).toContain(
      'texto-com-marcacao'
    );
    expect(codigos(com((x) => (x.slides[4].colunas[0].itens[0] = '<b>c</b>')))).toContain(
      'texto-com-marcacao'
    );
  });

  it('limites de tamanho: título 90, subtítulo 140, item 120, destaque 200, até 5 itens', () => {
    expect(codigos(com((x) => (x.slides[1].titulo = 'a'.repeat(90))))).toEqual([]);
    expect(codigos(com((x) => (x.slides[1].titulo = 'a'.repeat(91))))).toContain('campo-longo');
    expect(codigos(com((x) => (x.slides[0].subtitulo = 'a'.repeat(141))))).toContain('campo-longo');
    expect(codigos(com((x) => (x.slides[1].itens[0] = 'a'.repeat(121))))).toContain('campo-longo');
    expect(codigos(com((x) => (x.slides[3].destaque = 'a'.repeat(201))))).toContain('campo-longo');
    expect(
      codigos(com((x) => (x.slides[1].itens = Array.from({ length: 6 }, () => 'i'))))
    ).toContain('quantidade');
  });

  it('notas com 60 a 160 palavras', () => {
    expect(codigos(com((x) => (x.slides[1].notas = notasFalsas(59))))).toContain('palavras');
    expect(codigos(com((x) => (x.slides[1].notas = notasFalsas(161))))).toContain('palavras');
    expect(codigos(com((x) => (x.slides[1].notas = notasFalsas(60))))).toEqual([]);
    expect(codigos(com((x) => (x.slides[1].notas = notasFalsas(160))))).toEqual([]);
  });

  it('colunas só no comparativo, com 2 ou 3 colunas de até 4 itens', () => {
    expect(codigos(com((x) => (x.slides[1].colunas = [])))).toContain('colunas');
    expect(codigos(com((x) => x.slides[4].colunas.pop()))).toContain('colunas');
    expect(
      codigos(
        com(
          (x) =>
            (x.slides[4].colunas = Array.from({ length: 4 }, () => ({ titulo: 't', itens: ['i'] })))
        )
      )
    ).toContain('colunas');
    expect(
      codigos(com((x) => (x.slides[4].colunas[0].itens = ['1', '2', '3', '4', '5'])))
    ).toContain('quantidade');
    expect(codigos(com((x) => delete x.slides[4].colunas))).toContain('campo-ausente');
  });

  it('cada layout exige o campo que o desenha', () => {
    expect(codigos(com((x) => delete x.slides[1].itens))).toContain('campo-ausente');
    expect(codigos(com((x) => delete x.slides[3].destaque))).toContain('campo-ausente');
  });
});

describe('validarConteudoRestrito: slide de fotos (imagens embutidas)', () => {
  // Imagens sintéticas mínimas: só o formato do data URI é validado, nunca o pixel.
  const JPEG = 'data:image/jpeg;base64,QUJDRA==';
  const WEBP = 'data:image/webp;base64,QUJDRA==';
  const ALT = 'Imagem sintética de teste';
  // Notas curtas: o slide de fotos dispensa o mínimo de palavras (ver validar.ts).
  const NOTAS_CURTAS = 'Registro fictício.';

  function comFotos(imagens: unknown, notas: string = NOTAS_CURTAS): Json {
    return com((x) => {
      x.slides[8] = { id: 9, layout: 'fotos', titulo: 'Fotos fictícias', notas, imagens };
    });
  }

  it('aceita uma ou duas imagens webp ou jpeg, com legenda opcional', () => {
    expect(codigos(comFotos([{ src: JPEG, alt: ALT }]))).toEqual([]);
    expect(
      codigos(
        comFotos([
          { src: WEBP, alt: ALT, legenda: 'Legenda sintética' },
          { src: JPEG, alt: ALT }
        ])
      )
    ).toEqual([]);
  });

  it('aceita notas curtas no slide de fotos, mas não notas vazias nem longas demais', () => {
    expect(codigos(comFotos([{ src: JPEG, alt: ALT }], ''))).toEqual(['campo-ausente']);
    expect(codigos(comFotos([{ src: JPEG, alt: ALT }], notasFalsas(161)))).toEqual(['palavras']);
  });

  it('o mínimo de 60 palavras continua valendo para os demais layouts', () => {
    expect(codigos(com((x) => (x.slides[1].notas = NOTAS_CURTAS)))).toContain('palavras');
  });

  it('recusa URL externa, http ou https, no lugar do data URI', () => {
    expect(codigos(comFotos([{ src: 'https://exemplo.invalido/f.jpg', alt: ALT }]))).toContain(
      'imagem'
    );
    expect(codigos(comFotos([{ src: 'http://exemplo.invalido/f.jpg', alt: ALT }]))).toContain(
      'imagem'
    );
  });

  it('recusa SVG, mesmo em data URI', () => {
    expect(codigos(comFotos([{ src: 'data:image/svg+xml;base64,QUJDRA==', alt: ALT }]))).toContain(
      'imagem'
    );
  });

  it('recusa mime que não seja webp ou jpeg', () => {
    expect(codigos(comFotos([{ src: 'data:image/png;base64,QUJDRA==', alt: ALT }]))).toContain(
      'imagem'
    );
    expect(codigos(comFotos([{ src: 'data:text/html;base64,QUJDRA==', alt: ALT }]))).toContain(
      'imagem'
    );
  });

  it('recusa base64 malformado (caractere fora do alfabeto ou comprimento que não fecha)', () => {
    expect(codigos(comFotos([{ src: 'data:image/jpeg;base64,QU#D', alt: ALT }]))).toContain(
      'imagem'
    );
    expect(codigos(comFotos([{ src: 'data:image/jpeg;base64,QUJDR', alt: ALT }]))).toContain(
      'imagem'
    );
  });

  it('recusa alt vazio ou só com espaço', () => {
    expect(codigos(comFotos([{ src: JPEG, alt: '' }]))).toContain('campo-ausente');
    expect(codigos(comFotos([{ src: JPEG, alt: '   ' }]))).toContain('campo-ausente');
  });

  it('limite de 400 KB decodificados por imagem: 409600 bytes passam, um byte a mais não', () => {
    const noLimite = 'A'.repeat(546132); // 546132 * 3 / 4 = 409599 bytes
    const acima = 'A'.repeat(546136); // 409602 bytes
    expect(codigos(comFotos([{ src: `data:image/jpeg;base64,${noLimite}`, alt: ALT }]))).toEqual(
      []
    );
    expect(codigos(comFotos([{ src: `data:image/jpeg;base64,${acima}`, alt: ALT }]))).toContain(
      'imagem-grande'
    );
  });

  it('exige de 1 a 2 imagens', () => {
    expect(codigos(comFotos([]))).toContain('quantidade');
    const tres = [1, 2, 3].map(() => ({ src: JPEG, alt: ALT }));
    expect(codigos(comFotos(tres))).toContain('quantidade');
  });

  it('imagens só no layout fotos, e o layout fotos exige imagens', () => {
    expect(codigos(com((x) => (x.slides[1].imagens = [{ src: JPEG, alt: ALT }])))).toContain(
      'campo-proibido'
    );
    expect(codigos(comFotos(undefined))).toContain('campo-ausente');
  });

  it('o erro não carrega o src nem o alt, só código e caminho', () => {
    const r = validarConteudoRestrito(
      comFotos([{ src: 'https://segredo.invalido/x.jpg', alt: ALT }])
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(JSON.stringify(r.erros)).not.toContain('segredo.invalido');
      expect(r.erros[0]!.caminho).toMatch(/^slides\[8\]\.imagens\[0\]/);
    }
  });
});
