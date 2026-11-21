/**
 * Linha de base da altura do cabeçalho no modo normal (E2E-A2-SERRA, revisão da fatia 5 da 1.16.3.0,
 * achado I-R1). Medida na versão no ar, 5a500eb, no blink, tema claro, relógio em 14/11/2026 ao
 * meio-dia, janela de 640 px de altura, uma medida por largura inteira de 641 a 1279 px nas 3 rotas de
 * cabecalho-normal-641-1023.spec.ts: 1917 medidas, arquivo de medidas com md5 8cf821a664a4187f4eb28188b8b4f772. Cada trecho junta
 * as larguras seguidas com a mesma altura, em px. Estes números são a altura que já está no ar: só se
 * trocam por decisão registrada sobre a altura do cabeçalho, com nova medida na versão de referência,
 * nunca a partir da versão que está sendo testada.
 */
export interface TrechoDaBase {
  readonly de: number;
  readonly ate: number;
  readonly altura: number;
}

export const LINHA_DE_BASE_CABECALHO_NORMAL: Readonly<Record<string, readonly TrechoDaBase[]>> = {
  '/': [
    { de: 641, ate: 675, altura: 125.78125 },
    { de: 676, ate: 1279, altura: 70.890625 }
  ],
  '/p/p1/intr-direito/u1': [
    { de: 641, ate: 882, altura: 166.890625 },
    { de: 883, ate: 1249, altura: 112 },
    { de: 1250, ate: 1279, altura: 84 }
  ],
  '/p/p1/redacao-juridica-1/u3-material-peticao-consumidor/peticao': [
    { de: 641, ate: 678, altura: 167.265625 },
    { de: 679, ate: 782, altura: 167.078125 },
    { de: 783, ate: 798, altura: 166.890625 },
    { de: 799, ate: 862, altura: 167.265625 },
    { de: 863, ate: 882, altura: 167.078125 },
    { de: 883, ate: 945, altura: 112.375 },
    { de: 946, ate: 1049, altura: 112.1875 },
    { de: 1050, ate: 1249, altura: 112 },
    { de: 1250, ate: 1250, altura: 134.46875 },
    { de: 1251, ate: 1279, altura: 84 }
  ]
};

/** Altura da linha de base na rota e na largura; undefined se a tabela não cobre o par. */
export function alturaDaBase(caminho: string, largura: number): number | undefined {
  return LINHA_DE_BASE_CABECALHO_NORMAL[caminho]?.find((t) => t.de <= largura && largura <= t.ate)
    ?.altura;
}
