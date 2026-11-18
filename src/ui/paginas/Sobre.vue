<script setup lang="ts">
import { ROTULOS_ABA } from '@/app/curriculo/rotulosAba';
import { TITULAR } from '@/app/rodape/titular';
import { TEXTOS_SOBRE } from '@/conteudo/sobre/textos';

/**
 * Página Sobre (SB-F8, esqueleto). Ordem da seção 4 do plano: O projeto, Autoria, Tecnologias e
 * Para nerds (h2 próprio, aberto). A lista do que o site oferece sai do mapa de rótulos de aba, para
 * não envelhecer. O nome do titular entra só por TITULAR; os textos vêm de conteudo/sobre/textos.ts.
 */
const rotulosDoSite = Object.values(ROTULOS_ABA);
</script>

<template>
  <article class="pagina-sobre">
    <h1 class="pagina-sobre__titulo">{{ TEXTOS_SOBRE.titulo }}</h1>

    <section class="pagina-sobre__secao" data-secao="projeto" aria-labelledby="sobre-projeto">
      <h2 id="sobre-projeto">{{ TEXTOS_SOBRE.projeto.titulo }}</h2>
      <p>{{ TEXTOS_SOBRE.projeto.provisorio }}</p>
      <p>{{ TEXTOS_SOBRE.projeto.introLista }}</p>
      <ul>
        <li v-for="rotulo in rotulosDoSite" :key="rotulo">{{ rotulo }}</li>
      </ul>
    </section>

    <section class="pagina-sobre__secao" data-secao="autoria" aria-labelledby="sobre-autoria">
      <h2 id="sobre-autoria">{{ TEXTOS_SOBRE.autoria.titulo }}</h2>
      <p>
        {{ TEXTOS_SOBRE.autoria.fraseAntes }}{{ TITULAR }}{{ TEXTOS_SOBRE.autoria.fraseDepois }}
      </p>
      <p>{{ TEXTOS_SOBRE.autoria.credito }}</p>
    </section>

    <section
      class="pagina-sobre__secao"
      data-secao="tecnologias"
      aria-labelledby="sobre-tecnologias"
    >
      <h2 id="sobre-tecnologias">{{ TEXTOS_SOBRE.tecnologias.titulo }}</h2>
      <p>{{ TEXTOS_SOBRE.tecnologias.provisorio }}</p>
    </section>

    <section class="pagina-sobre__secao" data-secao="para-nerds" aria-labelledby="sobre-para-nerds">
      <h2 id="sobre-para-nerds">{{ TEXTOS_SOBRE.paraNerds.titulo }}</h2>
      <p>{{ TEXTOS_SOBRE.paraNerds.provisorio }}</p>
    </section>
  </article>
</template>

<style scoped>
.pagina-sobre {
  max-width: var(--largura-conteudo, 1180px);
  margin-inline: auto;
  padding: var(--esp-6, 2rem) var(--esp-4, 1rem);
}

.pagina-sobre__secao {
  margin-block: var(--esp-6, 2rem);
}
</style>
