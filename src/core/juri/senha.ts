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

/** Conta code points (não unidades UTF-16 nem grafemas). */
export function contarCaracteres(senha: string): number {
  return [...senha].length;
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
