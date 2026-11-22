import { onBeforeUnmount, onMounted, ref } from 'vue';
import { formatarHora } from '@/app/calendario/dataHoraDoSite';
import { podeReler } from '@/app/usuarios/releituraAdmin';

/**
 * Releitura da lista de usuários. Guarda a hora da última leitura bem-sucedida (o texto "Atualizado às") e,
 * na volta da aba, chama `reler` de novo, no máximo 1 vez a cada 30 s (podeReler). Quem chama marca a leitura
 * só quando ela dá certo: uma falha não conta como leitura.
 *
 * Os ouvintes são registrados no setup, para o componente que chama: a chamada tem de ser síncrona no setup.
 */
export function usarReleituraDaLista(reler: () => void) {
  let ultimaLeitura = 0;
  const atualizadoEm = ref('');

  function marcarLeitura(): void {
    ultimaLeitura = Date.now();
    atualizadoEm.value = formatarHora(new Date(ultimaLeitura));
  }

  function aoVoltarAba(): void {
    if (document.visibilityState === 'visible' && podeReler(Date.now(), ultimaLeitura)) reler();
  }

  onMounted(() => document.addEventListener('visibilitychange', aoVoltarAba));
  onBeforeUnmount(() => document.removeEventListener('visibilitychange', aoVoltarAba));

  return { atualizadoEm, marcarLeitura };
}
