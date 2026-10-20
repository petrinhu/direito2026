<script setup lang="ts">
import FachadaTemplo from './FachadaTemplo.vue';
</script>

<template>
  <!-- Região nomeada pelo título da página: vira landmark de região, sem outro banner. -->
  <section class="abertura" aria-labelledby="titulo-caderno">
    <FachadaTemplo />
    <figure class="lema">
      <blockquote class="lema__texto">
        <p class="lema__latim" lang="la">
          Iustitia est constans et perpetua voluntas ius suum cuique tribuendi.
        </p>
        <p class="lema__traducao">
          A justiça é a vontade constante e perpétua de dar a cada um o seu direito.
        </p>
      </blockquote>
      <figcaption class="lema__fonte">Ulpiano, <cite>Digesto</cite>, 1.1.10</figcaption>
    </figure>
  </section>
</template>

<style scoped>
/* Faixa de topo da página inicial (LayoutBase, alvo #faixa-do-layout): de lado
   a lado, por cima da coluna da barra lateral. O topo já vem do próprio layout
   (respiro do cabeçalho), então aqui só entra a abertura em si. */
.abertura {
  background: var(--cor-sidebar-fundo);
  color: var(--cor-hero-texto);
  padding: clamp(2.5rem, 6vw, 4.5rem) 1.25rem clamp(2.75rem, 5vw, 3.75rem);
  text-align: center;
}

.lema {
  max-width: 40rem;
  margin: clamp(2rem, 4vw, 2.75rem) auto 0;
}

.lema__texto {
  margin: 0;
}

.lema__latim {
  margin: 0;
  font-family: var(--fonte-titulo);
  font-style: italic;
  font-weight: 500;
  font-size: clamp(var(--escala-md), 3.2vw, var(--escala-xl));
  line-height: 1.25;
  color: var(--cor-hero-texto);
  font-variant-numeric: lining-nums;
  text-wrap: balance;
}

.lema__traducao {
  margin: 0.875rem 0 0;
  font-size: var(--escala-base);
  color: var(--cor-sidebar-texto-suave);
}

.lema__fonte {
  margin-top: 0.375rem;
  font-size: var(--escala-sm);
  color: var(--cor-sidebar-texto-suave);
}

:root[data-modo-adaptado='on'] .abertura {
  border-bottom: 4px solid var(--cor-texto);
}

:root[data-modo-adaptado='on'] .lema__latim,
:root[data-modo-adaptado='on'] .lema__traducao,
:root[data-modo-adaptado='on'] .lema__fonte {
  color: var(--cor-texto);
}
</style>
