import type { RepositorioProgresso } from '@/core/progresso/tipos';

const MENSAGEM_CONFIRMACAO =
  'Apagar o tema escolhido e todo o progresso de leitura e de quiz salvos neste navegador? Essa ação não pode ser desfeita.';

/**
 * Confirma com o leitor antes de apagar (ordem do líder, 22/09/2026: "um
 * link para apagar os dados guardados... com confirmação antes de
 * apagar"). Usado por AvisoArmazenamento.vue e por Rodape.vue, que
 * também precisa do mesmo link — mesmo texto, mesmo comportamento nos
 * dois lugares, para não divergir.
 *
 * Recarrega a página depois de limpar: é o jeito honesto de "devolver o
 * site ao estado inicial" sem ter de coordenar, um por um, todo estado
 * reativo já montado (tema aplicado no <html>, progresso de cada
 * unidade já aberta) — um recarregamento novo lê tudo de novo, vazio.
 */
export function apagarTudoComConfirmacao(repositorio: RepositorioProgresso): void {
  if (typeof window === 'undefined' || !window.confirm(MENSAGEM_CONFIRMACAO)) return;
  repositorio.limparTudo();
  window.location.reload();
}
