import type { ConteudoRestrito } from './tipos';

export type RegraDeConteudo = 'cita-letra-ou-posicao' | 'cita-aula-ou-slide' | 'travessao';

export interface AvisoDeConteudo {
  readonly regra: RegraDeConteudo;
  readonly caminho: string;
}

// Mesmas expressões de tests/unidade/conteudo.quizzes.spec.ts (regras de
// conteúdo do líder: o motor embaralha, então explicação nunca aponta letra
// nem posição; texto ao aluno nunca cita aula nem slide).
const CITA_LETRA =
  /\b(?:[Aa]lternativa|[Ll]etra|[Oo]p[çc][ãa]o)s?\s*\(?[A-E]\)?\b|\([A-E]\)|\b[Aa]s? [B-D]\b|\b[Ee] a [A-E]\b|\b[B-D] e [A-E]\b|\b[A-E] e [B-D]\b|\b(?:[Pp]rimeira|[Ss]egunda|[Tt]erceira|[Qq]uarta|[Qq]uinta|[Úú]ltima) (?:alternativa|op[çc][ãa]o)/;
const CITA_POSICAO = /\b(acima|abaixo)\b(?! do)/i;
const CITA_AULA_OU_SLIDE =
  /\b(?:aulas?|slides?)\b|\bquadro d[ao]s? aulas?|\bna atividade d[aeo]\b|\batividade de \d/i;
const TRAVESSAO = /[–—]/;

/**
 * Regras de conteúdo do líder, em forma de aviso (não bloqueiam a
 * renderização, ao contrário do validador). Só devolve regra e caminho,
 * nunca o texto.
 */
export function avisosDeRegrasDeConteudo(conteudo: ConteudoRestrito): AvisoDeConteudo[] {
  const avisos: AvisoDeConteudo[] = [];
  const checar = (regra: RegraDeConteudo, ok: boolean, caminho: string): void => {
    if (ok) avisos.push({ regra, caminho });
  };
  const textoCorrido = (texto: string, caminho: string): void => {
    checar('cita-aula-ou-slide', CITA_AULA_OU_SLIDE.test(texto), caminho);
    checar('travessao', TRAVESSAO.test(texto), caminho);
  };

  conteudo.resumo.forEach((bloco, i) => {
    const base = `resumo[${i}]`;
    textoCorrido(bloco.titulo, `${base}.titulo`);
    textoCorrido(bloco.corpoHtml, `${base}.corpoHtml`);
    textoCorrido(bloco.exemploHtml, `${base}.exemploHtml`);
    bloco.resumo.forEach((item, j) => textoCorrido(item, `${base}.resumo[${j}]`));
  });
  conteudo.quiz.forEach((pergunta, i) => {
    const base = `quiz[${i}]`;
    textoCorrido(pergunta.enunciadoHtml, `${base}.enunciadoHtml`);
    textoCorrido(pergunta.explicacaoHtml, `${base}.explicacaoHtml`);
    pergunta.alternativasHtml.forEach((alt, j) =>
      textoCorrido(alt, `${base}.alternativasHtml[${j}]`)
    );
    const semAcimaDoHomem = pergunta.explicacaoHtml.replace(/acima do homem/g, '');
    checar(
      'cita-letra-ou-posicao',
      CITA_LETRA.test(pergunta.explicacaoHtml) ||
        CITA_POSICAO.test(semAcimaDoHomem) ||
        CITA_LETRA.test(pergunta.enunciadoHtml),
      base
    );
  });
  conteudo.mapa.filhos?.forEach((filho, i) => {
    checar('travessao', TRAVESSAO.test(filho.rotulo), `mapa.filhos[${i}].rotulo`);
  });
  return avisos;
}
