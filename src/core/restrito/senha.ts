export const LIMITE_MINIMO_SENHA = 15;
export const LIMITE_MAXIMO_SENHA = 128;

export type ProblemaSenha = 'atual-vazia' | 'curta' | 'longa' | 'confirmacao' | 'igual-atual';

export interface DadosTrocaDeSenha {
  readonly atual: string;
  readonly nova: string;
  readonly confirmacao: string;
}

/**
 * Checagem de conforto antes de enviar (o servidor repete a validação e é
 * quem decide). Só tamanho, 15 a 128 caracteres (pontos de código, como o
 * servidor conta, contas.php), sem regra de composição. O 15 é decisão D3 do
 * líder (07/11/2026); sem MFA, abaixo disso a senha fica fraca.
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
