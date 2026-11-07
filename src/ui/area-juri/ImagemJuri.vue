<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue';
import { CHAVE_SESSAO } from '@/app/chaves';
import { ehIdImagem } from '@/app/juri';

/**
 * Imagem do acervo da Júri como `<img>` comum: o servidor entrega em claro, e o navegador
 * manda o cookie da sessão do site (plano do CTO do login único, seção 5.3). Não há
 * decifração nem object URL.
 *
 * O `<img>` não expõe o status HTTP: 401, 404 e 503 chegam todos como `error`. Por isso,
 * na falha, a própria sessão é conferida. Se ela venceu, a conferência leva à tela de
 * entrada (mesmo aviso da área restrita); se não venceu, fica a mensagem de erro.
 */
const props = defineProps<{
  id: string;
  legenda: string;
}>();

const sessao = inject(CHAVE_SESSAO, undefined);
const carregando = ref(true);
const falhou = ref(false);

/** Só o formato exato do id chega ao `src`: nada que não seja o hex vira caminho ou query. */
const src = computed(() =>
  ehIdImagem(props.id) ? `/api/juri/imagem.php?id=${props.id}` : undefined
);

function aoCarregar(): void {
  carregando.value = false;
}

function aoFalhar(): void {
  carregando.value = false;
  falhou.value = true;
  void sessao?.conferirAoVoltar();
}

watch(
  () => props.id,
  () => {
    carregando.value = true;
    falhou.value = false;
  }
);
</script>

<template>
  <figure class="juri-imagem">
    <p v-if="falhou || src === undefined" role="alert" class="juri-imagem__estado">
      Não foi possível mostrar esta imagem.
    </p>
    <template v-else>
      <p v-if="carregando" role="status" class="juri-imagem__estado">Abrindo a imagem…</p>
      <img
        :src="src"
        :alt="legenda"
        loading="lazy"
        class="juri-imagem__foto"
        @load="aoCarregar"
        @error="aoFalhar"
      />
    </template>
    <figcaption class="juri-imagem__legenda">{{ legenda }}</figcaption>
  </figure>
</template>
