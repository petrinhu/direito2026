<script setup lang="ts">
import type { PecaComentada } from '@/core/unidade/tipos';

defineProps<{ peca: PecaComentada }>();
</script>

<template>
  <article class="peca-comentada">
    <h2>{{ peca.titulo }}</h2>
    <p class="peca-comentada__nota" v-html="peca.notaHtml" />
    <section
      v-if="peca.enunciadoHtml"
      class="peca-comentada__enunciado"
      aria-label="Enunciado do caso"
    >
      <h3>O enunciado do caso</h3>
      <div v-html="peca.enunciadoHtml" />
    </section>
    <section
      v-for="secao in peca.secoes"
      :id="secao.id"
      :key="secao.id"
      class="peca-comentada__secao"
    >
      <h3>{{ secao.titulo }}</h3>
      <!--
        Pedido do líder, 23/09/2026: uma seção-título "guarda-chuva" (ex.:
        "2. Do Direito", que só organiza os tópicos 2.1-2.5 seguintes, sem
        texto de peça próprio) não tem secao.corpoHtml. Sem a grade de
        duas colunas nesse caso: um bloco vazio no lugar do corpo, mesmo
        sem texto, ainda reservaria espaço em branco.
      -->
      <div v-if="secao.corpoHtml" class="peca-comentada__grade">
        <div class="peca-comentada__corpo" v-html="secao.corpoHtml" />
        <aside class="peca-comentada__comentario" aria-label="Como fazer">
          <div v-html="secao.comentarioHtml" />
        </aside>
      </div>
      <aside v-else class="peca-comentada__comentario" aria-label="Como fazer">
        <div v-html="secao.comentarioHtml" />
      </aside>
    </section>
  </article>
</template>

<style scoped>
.peca-comentada {
  max-width: var(--largura-coluna-leitura, 760px);
  margin-inline: auto;
  padding-block: var(--esp-6, 2rem);
}

.peca-comentada__nota {
  background: var(--cor-fundo-sutil, #f2efe6);
  padding: var(--esp-4, 1rem);
  border-radius: var(--raio-sm, 6px);
}

.peca-comentada__enunciado {
  background: var(--cor-fundo-elevado, #fff);
  border: 1px solid var(--cor-borda, #dcd7c8);
  border-radius: var(--raio-sm, 6px);
  padding: var(--esp-4, 1rem);
  margin-block: var(--esp-5, 1.5rem);
}

.peca-comentada__enunciado h3 {
  font-family: var(--fonte-titulo);
  margin-block-start: 0;
}

.peca-comentada__secao {
  break-inside: avoid;
  page-break-inside: avoid;
  margin-block: var(--esp-6, 2rem);
}

.peca-comentada__grade {
  display: grid;
  gap: var(--esp-4, 1rem);
}

/*
  Mesma classe de defeito descrita em CartaoPergunta.vue (achado do QA,
  docs/qa-redacao-u1.md): item de grid também tem min-width:auto por
  padrão (resolve para o maior token de conteúdo sem quebra), e as duas
  colunas de 880px+ (grid-template-columns abaixo) não usam minmax(0, …),
  diferente da versão de modo adaptado que já usa. Ambos os lados vêm de
  v-html (docs/conteudo, podem trazer citação/URL longa sem espaço), por
  isso ganham a mesma dupla de proteção por precaução (varredura pedida
  pelo QA), mesmo sem estouro reproduzido aqui.
*/
.peca-comentada__corpo,
.peca-comentada__comentario {
  min-width: 0;
  overflow-wrap: anywhere;
}

.peca-comentada__comentario {
  background: var(--cor-primaria-clara, #eaf1f8);
  border-radius: var(--raio-sm, 6px);
  padding: var(--esp-4, 1rem);
}

@media (min-width: 880px) {
  .peca-comentada__grade {
    grid-template-columns: 1.4fr 1fr;
    align-items: start;
  }
}

/* Modo de leitura adaptada: sempre empilhado, mesmo acima de 880px
   (docs/modo-adaptado.md, seção 4): o texto maior não deixa espaço
   horizontal para as duas colunas ficarem legíveis lado a lado. */
:root[data-modo-adaptado='on'] .peca-comentada__grade {
  grid-template-columns: minmax(0, 1fr);
}

/* Impressão: comentário sempre abaixo do trecho, nunca em coluna lateral (seção 9). */
@media print {
  .peca-comentada__grade {
    grid-template-columns: 1fr;
  }
}
</style>
