<script setup lang="ts">
import { computed, inject, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { CHAVE_STORE_BUSCA } from '@/app/chaves';
import { deveBuscarNoTextoIntegral } from '@/app/stores/busca';
import PainelResultadosBusca from '../componentes/PainelResultadosBusca.vue';
import AlvoQuadroProva from '../componentes/AlvoQuadroProva.vue';

const storeBusca = inject(CHAVE_STORE_BUSCA)!;
const route = useRoute();

/**
 * O índice do texto integral só desce quando a busca principal não acha nada
 * (aqui, no envio da query) ou quando o aluno pede (botão). Nunca por tecla.
 */
async function buscarDaQuery(): Promise<void> {
  const termo = typeof route.query.q === 'string' ? route.query.q : '';
  await storeBusca.garantirMotorCarregado();
  storeBusca.consultar(termo);
  if (deveBuscarNoTextoIntegral(termo, storeBusca.resultados.value.length)) {
    await storeBusca.buscarNoTextoIntegral();
  }
}

const podeBuscarNoTexto = computed(
  () =>
    storeBusca.termo.value.trim() !== '' &&
    storeBusca.resultados.value.length > 0 &&
    storeBusca.estadoTexto.value === 'parado'
);

onMounted(buscarDaQuery);
watch(() => route.query.q, buscarDaQuery);
</script>

<template>
  <div class="pagina-busca">
    <h1>Busca</h1>
    <AlvoQuadroProva />
    <PainelResultadosBusca
      :resultados="storeBusca.resultados.value"
      :termo="storeBusca.termo.value"
    />
    <button
      v-if="podeBuscarNoTexto"
      type="button"
      class="pagina-busca__botao"
      @click="storeBusca.buscarNoTextoIntegral()"
    >
      Buscar também no texto integral das leis
    </button>
    <section
      v-if="storeBusca.estadoTexto.value !== 'parado'"
      class="pagina-busca__texto"
      aria-labelledby="titulo-texto-integral"
    >
      <h2 id="titulo-texto-integral">No texto integral das leis</h2>
      <p v-if="storeBusca.estadoTexto.value === 'carregando'" aria-live="polite">
        Buscando no texto integral…
      </p>
      <div v-else-if="storeBusca.estadoTexto.value === 'erro'">
        <p role="alert">Não foi possível buscar no texto integral agora.</p>
        <button
          type="button"
          class="pagina-busca__botao"
          @click="storeBusca.buscarNoTextoIntegral()"
        >
          Tentar de novo
        </button>
      </div>
      <PainelResultadosBusca
        v-else
        :resultados="storeBusca.resultadosTexto.value"
        :termo="storeBusca.termo.value"
        rotulo="Resultados no texto integral"
      />
    </section>
  </div>
</template>

<style scoped>
.pagina-busca {
  max-width: var(--largura-conteudo, 1180px);
  margin-inline: auto;
  padding: var(--esp-6, 2rem);
}

/* A caixa do título tem só a largura do texto. Com a caixa cheia, ela chegava sob o botão Home
   flutuante do canto inferior direito a 360 px (LU-F5.1-N1); o texto nunca chegou. */
.pagina-busca h1 {
  width: fit-content;
}

.pagina-busca__botao {
  min-height: 44px;
  margin-block: var(--esp-3, 0.75rem);
  padding-inline: var(--esp-4, 1rem);
}

.pagina-busca__texto {
  margin-block-start: var(--esp-6, 2rem);
}
</style>
