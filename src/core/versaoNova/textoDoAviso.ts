import type { ResumoNovidades } from './novidadesDesde';

export interface EntradaTextoAviso {
  nome: string;
  resumo: ResumoNovidades;
  sessaoTerminou: boolean;
  continuaConectado: boolean;
  avisoQuiz: string | null;
}

export interface TextoAviso {
  /** A frase principal: "<Nome>, o site foi atualizado: <resumo>." */
  frase: string;
  acao: string;
  promessa: string;
  avisoQuiz: string | null;
}

/**
 * Textos do banner. A redação é do agente e vai à revisão do líder; as partes que vêm de
 * dados (nome, resumo) entram por interpolação de texto, nunca como HTML.
 */
export function textoDoAviso(entrada: EntradaTextoAviso): TextoAviso {
  const { nome, resumo, sessaoTerminou, continuaConectado, avisoQuiz } = entrada;
  if (sessaoTerminou) {
    return {
      frase: 'Sua sessão terminou.',
      acao: 'Entrar de novo',
      promessa: 'para ver a versão nova.',
      avisoQuiz
    };
  }
  const continuidade = continuaConectado
    ? 'Você volta para a página inicial e continua conectado, sem precisar digitar login e senha de novo.'
    : 'Você volta para a página inicial, sem precisar digitar login e senha de novo.';
  const cabeca = nome === '' ? 'O site foi atualizado' : `${nome}, o site foi atualizado`;
  const lista = resumoDaVersao(resumo);
  return {
    frase: lista === null ? `${cabeca}.` : `${cabeca}: ${lista}.`,
    acao: 'Recarregar a página',
    promessa: `para ver a versão nova. ${continuidade}`,
    avisoQuiz
  };
}

function resumoDaVersao(resumo: ResumoNovidades): string | null {
  if (resumo.rollback || resumo.itens.length === 0) return null;
  const partes = [...resumo.itens];
  if (resumo.mais > 0) partes.push(`e mais ${resumo.mais} novidades`);
  if (resumo.foraDoHistorico) partes.push('e outras novidades');
  return partes.join('; ');
}
