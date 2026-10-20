/**
 * Expressões de conteúdo do líder, em um só lugar. O motor de quiz embaralha
 * as alternativas: explicação nunca aponta letra nem posição. Texto ao aluno
 * nunca cita aula, slide nem "o material" (a fonte do conteúdo é o caderno).
 */

// Letras de alternativa em maiúscula, por isso sem a flag i (com ela, "de a"
// ou "o e a" seriam lidos como letras).
export const CITA_LETRA =
  /\b(?:[Aa]lternativa|[Ll]etra|[Oo]p[çc][ãa]o)s?\s*\(?[A-E]\)?\b|\([A-E]\)|\b[Aa]s? [B-D]\b|\b[Ee] a [A-E]\b|\b[B-D] e [A-E]\b|\b[A-E] e [B-D]\b|\b(?:[Pp]rimeira|[Ss]egunda|[Tt]erceira|[Qq]uarta|[Qq]uinta|[Úú]ltima) (?:alternativa|op[çc][ãa]o)/;

// "acima"/"abaixo" apontariam para a ordem sorteada das respostas. A expressão
// "acima do homem" é da matéria e é retirada antes do teste.
export const CITA_POSICAO = /\b(acima|abaixo)\b(?! do)/i;
export const EXPRESSAO_ACIMA_DO_HOMEM = /acima do homem/g;

export const CITA_AULA_OU_SLIDE =
  /\b(?:aulas?|slides?)\b|\bquadro d[ao]s? aulas?|\bna atividade d[aeo]\b|\batividade de \d/i;

// Fronteira Unicode (lookbehind/lookahead), não \b: o \b do JavaScript é ASCII
// e tomava "ã" por fronteira, então "demonstração material" casava com "o material".
// "o materialista" e "Aguardando material do professor" continuam sem casar.
export const APONTA_PARA_MATERIAL =
  /(?<![\p{L}\p{N}_])(?:segundo o|fora do|o|no|do) material(?![\p{L}\p{N}_])|(?<![\p{L}\p{N}_])(?:a|vale) conferir(?![\p{L}\p{N}_])/iu;

/**
 * Travessão longo (U+2014) e médio (U+2013): proibidos em todo texto de conteúdo,
 * em qualquer campo da unidade, sem isenção. Substitutos: vírgula, dois-pontos
 * ou hífen comum.
 */
export const TRAVESSAO = /[\u2013\u2014]/;

/**
 * Textos de espera que o gerador escreve nos modelos (meta.ts e petição). São
 * válidos só em unidade em-breve; publicada com algum deles reprova. A
 * comparação é do texto inteiro, sem tags, nunca por trecho.
 */
export const TEXTO_PENDENTE_META = 'A escrever antes da publicação.';
export const TEXTO_PENDENTE_CURTO = 'A escrever.';

/** Referência genérica da lista de fontes: não tem número de aula nem data. */
export const REFERENCIA_GENERICA_DE_MATERIAL = /Material de aula da disciplina/g;
export const FONTE_COM_AULA_OU_DATA = /\b(?:aulas?|slides?)\b|\b\d{1,2}\/\d{1,2}\b/i;
