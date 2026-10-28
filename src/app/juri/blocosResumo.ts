import type { BlocoResumo } from '@/core/unidade/tipos';
import type { BlocoResumoJuri } from '@/core/juri/tipos';

/**
 * Adapta o bloco da Júri ao contrato do VisorResumo (o mesmo das páginas de estudo). A
 * Júri não tem quadro-resumo nem parágrafo "na prática": esses campos saem vazios, e as
 * linhas A e B e as fontes entram pelo slot do bloco, não por este contrato.
 */
export function paraBlocosResumo(blocos: readonly BlocoResumoJuri[]): BlocoResumo[] {
  return blocos.map((bloco, indice) => ({
    id: bloco.id,
    numero: indice + 1,
    titulo: bloco.titulo,
    fonte: '',
    corpoHtml: bloco.corpoHtml,
    resumo: [],
    exemploHtml: ''
  }));
}
