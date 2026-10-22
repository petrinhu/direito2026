<script setup lang="ts">
import type { TextoIntegral } from '@/core/textoIntegral/tipos';

/**
 * Visor do texto integral (OCR fiel). Sem HTML injetado: cada trecho é escrito
 * como texto, e a regra de CSP do site continua valendo para a página inteira.
 */
defineProps<{ texto: TextoIntegral }>();
</script>

<template>
  <article class="texto-integral">
    <h2 class="texto-integral__titulo">{{ texto.titulo }}</h2>
    <p class="texto-integral__fonte">{{ texto.fonte }}</p>
    <div class="texto-integral__corpo">
      <template v-for="(bloco, i) in texto.blocos" :key="i">
        <h3 v-if="bloco.tipo === 'subtitulo'">{{ bloco.texto }}</h3>
        <p v-else>
          <template v-for="(trecho, j) in bloco.trechos" :key="j">
            <em v-if="trecho.tipo === 'italico'">{{ trecho.texto }}</em>
            <template v-else-if="trecho.tipo === 'pagina'">
              {{ ' '
              }}<span :id="`pagina-${trecho.numero}`" class="texto-integral__pagina"
                >[p. {{ trecho.numero }}]</span
              >{{ ' ' }}
            </template>
            <template v-else>{{ trecho.texto }}</template>
          </template>
        </p>
      </template>
    </div>
  </article>
</template>

<style scoped>
.texto-integral {
  max-width: min(70ch, 100%);
  margin-inline: auto;
  padding-block: var(--esp-5, 1.5rem);
  color: var(--cor-texto, #1c1c1c);
  font-family: var(--fonte-texto);
  line-height: 1.7;
}

.texto-integral__titulo {
  font-family: var(--fonte-titulo);
  line-height: 1.25;
}

.texto-integral__fonte {
  margin-block: var(--esp-2, 0.5rem) var(--esp-5, 1.5rem);
  color: var(--cor-texto-suave, #4a4a4a);
  font-size: 0.9em;
}

.texto-integral__corpo > p {
  margin-block: var(--esp-4, 1rem);
}

.texto-integral__corpo > h3 {
  margin-block: var(--esp-5, 1.5rem) var(--esp-2, 0.5rem);
}

.texto-integral__pagina {
  color: var(--cor-texto-suave, #4a4a4a);
  font-size: 0.8em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
