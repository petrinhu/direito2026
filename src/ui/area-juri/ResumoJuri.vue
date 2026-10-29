<script setup lang="ts">
import { computed } from 'vue';
import { paraBlocosResumo, type ImagemAberta } from '@/app/juri';
import type { ConteudoJuriValidado } from '@/core/juri/tipos';
import VisorResumo from '../componentes/VisorResumo.vue';
import FontesJuri from './FontesJuri.vue';
import ImagemCifrada from './ImagemCifrada.vue';
import QuadroTermosJuri from './QuadroTermosJuri.vue';
import ReferenciasJuri from './ReferenciasJuri.vue';
import RespostasDefesaJuri from './RespostasDefesaJuri.vue';

const props = defineProps<{
  conteudo: ConteudoJuriValidado;
  // eslint-disable-next-line no-unused-vars
  abrirImagem: (id: string) => Promise<ImagemAberta>;
}>();

const blocos = computed(() => paraBlocosResumo(props.conteudo.resumo));
const blocoPorId = computed(() => new Map(props.conteudo.resumo.map((bloco) => [bloco.id, bloco])));

/** Linha A e B só existem em par; sem o par, o bloco não tem a comparação e não mostra nada. */
function linhasDe(id: string): { readonly aHtml: string; readonly bHtml: string } | undefined {
  const bloco = blocoPorId.value.get(id);
  if (bloco?.linhaA === undefined || bloco.linhaB === undefined) return undefined;
  return { aHtml: bloco.linhaA, bHtml: bloco.linhaB };
}

function fontesDe(id: string): readonly string[] {
  return blocoPorId.value.get(id)?.fontes ?? [];
}
</script>

<template>
  <div class="juri-resumo">
    <QuadroTermosJuri :termos="conteudo.quadroTermos" :nota-html="conteudo.notaQuadroHtml" />

    <VisorResumo :blocos="blocos">
      <template #depois-do-corpo="{ bloco }">
        <div v-if="linhasDe(bloco.id)" class="juri-linhas">
          <section class="juri-linhas__coluna" :aria-labelledby="`juri-laudo-${bloco.id}`">
            <h3 :id="`juri-laudo-${bloco.id}`">Laudo dos autos</h3>
            <div v-html="linhasDe(bloco.id)!.aHtml" />
          </section>
          <section class="juri-linhas__coluna" :aria-labelledby="`juri-caso-${bloco.id}`">
            <h3 :id="`juri-caso-${bloco.id}`">Elementos do caso real</h3>
            <div v-html="linhasDe(bloco.id)!.bHtml" />
          </section>
        </div>
        <FontesJuri :fontes="fontesDe(bloco.id)" />
      </template>
    </VisorResumo>

    <RespostasDefesaJuri :itens="conteudo.respostasDefesa" />

    <section
      v-if="conteudo.imagens.length > 0"
      class="juri-imagens"
      aria-labelledby="juri-imagens-titulo"
    >
      <h2 id="juri-imagens-titulo">Imagens do caso</h2>
      <div v-for="imagem in conteudo.imagens" :key="imagem.id" class="juri-imagens__item">
        <ImagemCifrada :id="imagem.id" :legenda="imagem.legenda" :abrir="abrirImagem" />
        <FontesJuri :fontes="imagem.fontes" />
      </div>
    </section>

    <ReferenciasJuri :itens="conteudo.referencias" />
  </div>
</template>
