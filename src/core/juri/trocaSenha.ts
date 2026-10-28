import { senhasIguais, validarSenhaNova } from './senha';

/**
 * Problemas da troca de senha da Júri, na ordem em que a tela os mostra. Só código:
 * a mensagem em pt-br mora na interface.
 */
export type ProblemaTrocaSenhaJuri = 'atual-vazia' | 'curta' | 'igual-atual' | 'confirmacao';

export interface EntradaTrocaSenhaJuri {
  readonly atual: string;
  readonly nova: string;
  readonly confirmacao: string;
}

/**
 * Validação local da troca, feita antes de qualquer chamada ao servidor. A sessão
 * reconfere as mesmas regras (fail closed): esta função existe para a tela avisar
 * antes de gastar a derivação de chave.
 */
export function validarTrocaSenhaJuri(entrada: EntradaTrocaSenhaJuri): ProblemaTrocaSenhaJuri[] {
  const problemas: ProblemaTrocaSenhaJuri[] = [];
  if (entrada.atual.length === 0) problemas.push('atual-vazia');
  if (!validarSenhaNova(entrada.nova).valida) problemas.push('curta');
  if (senhasIguais(entrada.atual, entrada.nova)) problemas.push('igual-atual');
  if (!senhasIguais(entrada.nova, entrada.confirmacao)) problemas.push('confirmacao');
  return problemas;
}
