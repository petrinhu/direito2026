import { trechosDe } from './termosVazamento';

/**
 * Trechos distintivos de TODO texto do JSON privado da Júri, em qualquer
 * profundidade. Núcleo puro do gêmeo scripts/verificar-conteudo-restrito-juri.ts.
 *
 * Diferente do Interdisciplinar, não lê campos nomeados: o schema da Júri pode
 * crescer, e um campo novo com texto não pode ficar de fora do portão. Chave
 * não entra (só valor de string). A janela de trechos é a mesma do portão do
 * Interdisciplinar (trechosDe), para os dois portões medirem igual.
 */
export function extrairTermosDeVazamentoJuri(json: unknown): string[] {
  const textos: string[] = [];
  const percorrer = (no: unknown): void => {
    if (typeof no === 'string') textos.push(no);
    else if (Array.isArray(no)) no.forEach(percorrer);
    else if (no !== null && typeof no === 'object') Object.values(no).forEach(percorrer);
  };
  percorrer(json);
  return [...new Set(textos.flatMap(trechosDe))];
}
