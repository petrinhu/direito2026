/**
 * Nome do usuário como aparece no banner de versão nova (regra do líder, 14/11/2026).
 * Ponto, sublinhado e hífen viram espaço; cada parte começa com maiúscula. A maiúscula
 * vai na primeira letra da parte, e um dígito ou sinal antes dela fica como está.
 */
const SEPARADORES = /[._-]+/g;

export function nomeDeExibicao(login: string): string {
  return login
    .replace(SEPARADORES, ' ')
    .trim()
    .split(/\s+/)
    .filter((parte) => parte !== '')
    .map(capitalizarParte)
    .join(' ');
}

function capitalizarParte(parte: string): string {
  const inicioDaLetra = parte.search(/\p{L}/u);
  if (inicioDaLetra < 0) return parte;
  const letra = [...parte.slice(inicioDaLetra)][0]!;
  return (
    parte.slice(0, inicioDaLetra) +
    letra.toLocaleUpperCase('pt-BR') +
    parte.slice(inicioDaLetra + letra.length)
  );
}
