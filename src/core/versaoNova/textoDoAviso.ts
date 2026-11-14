import type { ResumoNovidades } from './novidadesDesde';

export interface EntradaTextoAviso {
  nome: string;
  resumo: ResumoNovidades;
  sessaoTerminou: boolean;
  continuaConectado: boolean;
  avisoQuiz: string | null;
}

export interface TextoAviso {
  titulo: string;
  oQueMudou: string | null;
  acao: string;
  promessa: string;
  avisoQuiz: string | null;
}

/**
 * Textos do banner, nas variantes da seção 3.6 do plano. [PREENCHIMENTO DO AGENTE]: a
 * redação é do agente e vai à revisão do líder; as partes que vêm de dados são fixas.
 */
export function textoDoAviso(entrada: EntradaTextoAviso): TextoAviso {
  const { nome, resumo, sessaoTerminou, continuaConectado, avisoQuiz } = entrada;
  if (sessaoTerminou) {
    return {
      titulo: 'Sua sessão terminou.',
      oQueMudou: oQueMudou(resumo),
      acao: 'Entrar de novo',
      promessa: 'para ver a versão nova.',
      avisoQuiz
    };
  }
  const continuidade = continuaConectado
    ? 'Você volta para a página inicial e continua conectado, sem precisar digitar login e senha de novo.'
    : 'Você volta para a página inicial, sem precisar digitar login e senha de novo.';
  return {
    titulo: nome === '' ? 'O site foi atualizado.' : `${nome}, o site foi atualizado.`,
    oQueMudou: oQueMudou(resumo),
    acao: 'Recarregar a página',
    promessa: `para ver a versão nova. ${continuidade}`,
    avisoQuiz
  };
}

function oQueMudou(resumo: ResumoNovidades): string | null {
  if (resumo.rollback || resumo.itens.length === 0) return null;
  const partes = [...resumo.itens];
  if (resumo.mais > 0) partes.push(`e mais ${resumo.mais} novidades`);
  if (resumo.foraDoHistorico) partes.push('e outras novidades');
  return `O que mudou: ${partes.join('; ')}.`;
}
