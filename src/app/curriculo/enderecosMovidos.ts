/**
 * Endereços de unidade que mudaram de pasta (ordem do líder, 25/10/2026): o endereço
 * antigo leva ao novo, e o progresso guardado sob a chave antiga é lido pela nova.
 * Chave e valor no formato "periodo/cadeira/unidade", o de progresso e de carregadores.
 */
export const ENDERECOS_MOVIDOS: Readonly<Record<string, string>> = {
  'p1/sociologia-juridica/u3': 'p1/sociologia-juridica/u3-artigos-infancia-digital'
};
