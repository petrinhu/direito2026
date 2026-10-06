export const LIMITE_MINIMO_SENHA = 10;
export const LIMITE_MAXIMO_SENHA = 128;

export type ProblemaSenha = 'atual-vazia' | 'curta' | 'longa' | 'confirmacao' | 'igual-atual';

export interface DadosTrocaDeSenha {
  readonly atual: string;
  readonly nova: string;
  readonly confirmacao: string;
}

/**
 * Checagem de conforto antes de enviar (o servidor repete a validação e é
 * quem decide). Regra do NIST SP 800-63B: só tamanho, 10 a 128 caracteres
 * (pontos de código, como o servidor conta), sem regra de composição.
 */
export function validarTrocaDeSenha(dados: DadosTrocaDeSenha): ProblemaSenha[] {
  const problemas: ProblemaSenha[] = [];
  const tamanho = [...dados.nova].length;
  if (dados.atual.length === 0) problemas.push('atual-vazia');
  if (tamanho < LIMITE_MINIMO_SENHA) problemas.push('curta');
  if (tamanho > LIMITE_MAXIMO_SENHA) problemas.push('longa');
  if (dados.nova !== dados.confirmacao) problemas.push('confirmacao');
  if (dados.atual.length > 0 && dados.nova === dados.atual) problemas.push('igual-atual');
  return problemas;
}
