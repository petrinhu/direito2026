<script setup lang="ts">
import FontesJuri from './FontesJuri.vue';

/** Ficha genérica: um título recolhível e campos com HTML já validado. */
defineProps<{
  titulo: string;
  campos: readonly { readonly rotulo: string; readonly html: string }[];
  fontes: readonly string[];
}>();
</script>

<template>
  <details class="juri-ficha">
    <summary class="juri-ficha__titulo">{{ titulo }}</summary>
    <dl class="juri-ficha__campos">
      <div v-for="campo in campos" :key="campo.rotulo" class="juri-ficha__campo">
        <dt>{{ campo.rotulo }}</dt>
        <dd v-html="campo.html" />
      </div>
    </dl>
    <FontesJuri :fontes="fontes" />
  </details>
</template>
