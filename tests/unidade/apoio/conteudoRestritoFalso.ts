/**
 * Fixture FALSA e sintética do conteúdo restrito (L-28: nunca texto do
 * relatório real). Todos os textos são inventados e genéricos.
 */
export function perguntaFalsa(id: number): Record<string, unknown> {
  return {
    id,
    categoria: (['conceitos', 'aplicacao', 'fundamentos'] as const)[id % 3],
    enunciadoHtml: `<p>Enunciado fictício número ${id}.</p>`,
    alternativasHtml: [
      `Alternativa fictícia um da pergunta ${id}`,
      `Alternativa fictícia dois da pergunta ${id}`,
      `Alternativa fictícia três da pergunta ${id}`,
      `Alternativa fictícia quatro da pergunta ${id}`
    ],
    correta: id % 4,
    fonteExtra: false,
    explicacaoHtml: `<p>Explicação fictícia <strong>${id}</strong>.</p>`
  };
}

export function blocoFalso(n: number): Record<string, unknown> {
  return {
    id: `bloco-${n}`,
    numero: n,
    titulo: `Bloco fictício ${n}`,
    fonte: 'Fonte fictícia',
    corpoHtml: `<p>Texto fictício do bloco ${n} com <em>ênfase</em> &amp; mais.</p><ul><li>item</li></ul>`,
    resumo: [`Item de revisão fictício ${n}`],
    exemploHtml: ''
  };
}

export function conteudoRestritoFalso(): Record<string, unknown> {
  return {
    versao: 1,
    meta: {
      titulo: 'Título fictício',
      subtitulo: 'Subtítulo fictício',
      descricao: 'Descrição fictícia'
    },
    equipe: {
      instituicao: 'Instituição Fictícia',
      integrantes: ['Pessoa Fictícia Um', 'Pessoa Fictícia Dois']
    },
    resumo: [blocoFalso(1), blocoFalso(2)],
    mapa: {
      rotulo: 'Tema central fictício',
      filhos: [
        {
          rotulo: 'Ramo um',
          filhos: [{ rotulo: 'Folha um' }, { rotulo: 'Folha dois', filhos: [{ rotulo: 'Neta' }] }]
        },
        { rotulo: 'Ramo dois' }
      ]
    },
    quiz: Array.from({ length: 40 }, (_, i) => perguntaFalsa(i + 1))
  };
}
