<script setup lang="ts">
/* global Blob */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { ImagemAberta } from '@/app/juri';

/**
 * Imagem do acervo decifrada na tela. Os bytes chegam por `abrir` (a sessão decifra com a
 * CEK em memória) e viram um object URL só deste componente. A URL é revogada ao trocar o
 * id, ao desmontar (trocar de aba, sair, travar) e nunca fica em cache ou em Storage.
 */
const props = defineProps<{
  id: string;
  legenda: string;
  // eslint-disable-next-line no-unused-vars
  abrir: (id: string) => Promise<ImagemAberta>;
}>();

const url = ref<string>();
const carregando = ref(false);
const falhou = ref(false);
let urlAtual: string | undefined;
/** Cada pedido tem uma geração: resposta de pedido antigo não cria URL nova. */
let geracao = 0;

function liberar(): void {
  if (urlAtual !== undefined) {
    URL.revokeObjectURL(urlAtual);
    urlAtual = undefined;
  }
  url.value = undefined;
}

async function carregar(id: string): Promise<void> {
  const minha = ++geracao;
  liberar();
  carregando.value = true;
  falhou.value = false;
  try {
    const imagem = await props.abrir(id);
    if (minha !== geracao) return;
    urlAtual = URL.createObjectURL(new Blob([imagem.bytes], { type: imagem.mime }));
    url.value = urlAtual;
  } catch {
    if (minha === geracao) falhou.value = true;
  } finally {
    if (minha === geracao) carregando.value = false;
  }
}

onMounted(() => void carregar(props.id));
watch(
  () => props.id,
  (novo) => void carregar(novo)
);
onBeforeUnmount(() => {
  geracao += 1;
  liberar();
});
</script>

<template>
  <figure class="juri-imagem">
    <p v-if="carregando" role="status" class="juri-imagem__estado">Abrindo a imagem…</p>
    <p v-else-if="falhou" role="alert" class="juri-imagem__estado">
      Não foi possível mostrar esta imagem.
    </p>
    <img v-else-if="url" :src="url" :alt="legenda" class="juri-imagem__foto" />
    <figcaption class="juri-imagem__legenda">{{ legenda }}</figcaption>
  </figure>
</template>
