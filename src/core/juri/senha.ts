/** Alfabeto da senha provisória: o mesmo de contas.php:20, sem I, O, i, l, o, 0 e 1 (55 símbolos). */
export const ALFABETO_PROVISORIA = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
export const MINIMO_SENHA = 15;
export const TAMANHO_PROVISORIA = 20;

/** Maior múltiplo de 55 até 255: bytes acima dele são descartados para não haver viés de módulo. */
export const LIMITE_SEM_VIES = 256 - (256 % ALFABETO_PROVISORIA.length);

export interface ResultadoValidacaoSenha {
  valida: boolean;
  caracteres: number;
  minimo: number;
}

/**
 * NFC antes de tudo que toca a senha (NIST SP 800-63B): o mesmo texto digitado em
 * aparelhos que compõem o acento de jeito diferente vira os mesmos bytes e o mesmo AUTH.
 */
export function normalizarSenha(senha: string): string {
  return senha.normalize('NFC');
}

/** Conta code points após NFC (não unidades UTF-16 nem grafemas). */
export function contarCaracteres(senha: string): number {
  return [...normalizarSenha(senha)].length;
}

/**
 * Mesma senha depois de NFC. Senha igual escrita de outro jeito (acento composto
 * ou não) não conta como troca: o AUTH sairia igual para o mesmo texto.
 */
export function senhasIguais(a: string, b: string): boolean {
  return normalizarSenha(a) === normalizarSenha(b);
}

/** Só o tamanho: a regra da senha nova não impõe composição (SP 800-63B-4 §3.1.1.2). */
export function validarSenhaNova(senha: string): ResultadoValidacaoSenha {
  const caracteres = contarCaracteres(senha);
  return { valida: caracteres >= MINIMO_SENHA, caracteres, minimo: MINIMO_SENHA };
}

/** Índice no alfabeto para um byte sorteado, ou null se o byte deve ser descartado. */
export function indiceSemVies(byte: number): number | null {
  if (byte >= LIMITE_SEM_VIES) {
    return null;
  }
  return byte % ALFABETO_PROVISORIA.length;
}

/** Senha provisória com amostragem por rejeição sobre getRandomValues. */
export function gerarSenhaProvisoria(): string {
  let senha = '';
  while (senha.length < TAMANHO_PROVISORIA) {
    const sorteio = new Uint8Array(TAMANHO_PROVISORIA);
    globalThis.crypto.getRandomValues(sorteio);
    for (const byte of sorteio) {
      const indice = indiceSemVies(byte);
      if (indice !== null && senha.length < TAMANHO_PROVISORIA) {
        senha += ALFABETO_PROVISORIA.charAt(indice);
      }
    }
  }
  return senha;
}
