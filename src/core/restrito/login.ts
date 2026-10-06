const PADRAO_LOGIN = /^[A-Za-z0-9._-]{3,32}$/;

/** Mesma regra do servidor para criar usuário. Comparação exata, nada é normalizado. */
export function loginValido(login: string): boolean {
  return PADRAO_LOGIN.test(login);
}
