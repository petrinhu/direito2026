import { ErroUso } from './erro';

/*
 * Linha de comando: dois comandos, flags com valor. Não há senha: a ferramenta só limpa e
 * confere; o acervo sai em claro e a proteção dele é o portão do site (LU-F4.1).
 */

export type Comando =
  { nome: 'preparar'; originais: string; saida: string } | { nome: 'conferir'; saida: string };

const USO =
  'uso: acervo.ts preparar --originais <pasta> --saida <pasta-nova> | acervo.ts conferir --saida <pasta>';

const FLAGS = {
  preparar: ['--originais', '--saida'],
  conferir: ['--saida']
} as const;

export function lerArgumentos(argv: readonly string[]): Comando {
  const [nome, ...resto] = argv;
  if (nome !== 'preparar' && nome !== 'conferir') {
    throw new ErroUso(USO);
  }
  const permitidas: readonly string[] = FLAGS[nome];
  const valores = new Map<string, string>();
  for (let i = 0; i < resto.length; i += 2) {
    const flag = resto[i];
    const valor = resto[i + 1];
    if (flag === undefined || !permitidas.includes(flag)) {
      throw new ErroUso(USO);
    }
    if (valor === undefined || valor.startsWith('--')) {
      throw new ErroUso(`${flag} precisa de um valor`);
    }
    if (valores.has(flag)) {
      throw new ErroUso(`${flag} repetido`);
    }
    valores.set(flag, valor);
  }
  const obter = (flag: string): string => {
    const valor = valores.get(flag);
    if (valor === undefined) {
      throw new ErroUso(`falta ${flag}\n${USO}`);
    }
    return valor;
  };
  if (nome === 'preparar') {
    return { nome, originais: obter('--originais'), saida: obter('--saida') };
  }
  return { nome, saida: obter('--saida') };
}
