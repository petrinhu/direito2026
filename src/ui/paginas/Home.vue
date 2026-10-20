<script setup lang="ts">
import { inject } from 'vue';
import { CHAVE_CURRICULO } from '@/app/chaves';
import { numeroRomano } from '@/app/curriculo/numeroRomano';
import { separarPeriodos } from '@/app/curriculo/separarPeriodos';
import { textoEmPreparo } from '@/app/curriculo/textoEmPreparo';
import type { Periodo } from '@/core/curriculo/tipos';

// A abertura vai para a faixa de topo por Teleport com `defer`: o alvo é resolvido depois
// da montagem do layout, então não depende da ordem em que o layout insere o seu DOM.
import AberturaHome from '../componentes/AberturaHome.vue';
import FaixaGrega from '../componentes/FaixaGrega.vue';
import PlacaCadeira from '../componentes/PlacaCadeira.vue';

const curriculo = inject(CHAVE_CURRICULO)!;
const { comMaterial, emPreparo } = separarPeriodos(curriculo);
const linhaEmPreparo = textoEmPreparo(emPreparo);

function cadeirasPublicadas(periodo: Periodo) {
  return periodo.cadeiras.filter((c) => c.estado === 'publicado');
}
</script>

<template>
  <!-- A abertura (fachada e lema) vai para a faixa de topo do layout, de lado a lado,
       por cima da coluna da barra lateral. O resto da página fica na coluna principal. -->
  <Teleport defer to="#faixa-do-layout">
    <AberturaHome />
  </Teleport>

  <div class="pagina-home">
    <FaixaGrega />

    <section
      v-for="periodo in comMaterial"
      :key="periodo.id"
      class="periodo"
      :aria-labelledby="`periodo-${periodo.id}`"
    >
      <div class="periodo__cabeca">
        <p class="periodo__numeral" aria-hidden="true">{{ numeroRomano(periodo.numero) }}</p>
        <h2 :id="`periodo-${periodo.id}`" class="periodo__titulo">{{ periodo.rotulo }}</h2>
      </div>
      <div class="periodo__placas">
        <PlacaCadeira
          v-for="cadeira in cadeirasPublicadas(periodo)"
          :key="cadeira.id"
          :periodo="periodo"
          :cadeira="cadeira"
        />
      </div>
    </section>

    <p v-if="linhaEmPreparo" class="em-preparo">{{ linhaEmPreparo }}</p>
  </div>
</template>

<style scoped>
.pagina-home {
  max-width: var(--largura-conteudo, 1180px);
  margin-inline: auto;
  padding: 0 clamp(1.25rem, 3vw, 2.5rem) 0;
}

.periodo {
  container-type: inline-size;
  margin-top: clamp(2rem, 4vw, 3.5rem);
}

.periodo__cabeca {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.25rem 1.25rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--cor-borda);
}

.periodo__numeral {
  margin: 0;
  font-family: var(--fonte-titulo);
  font-weight: 700;
  font-size: 6rem;
  line-height: 0.8;
  color: var(--cor-acento);
  font-variant-numeric: lining-nums;
}

.periodo__titulo {
  margin: 0;
  font-size: var(--escala-lg);
  font-weight: 700;
  line-height: 1.1;
  color: var(--cor-titulo-texto);
}

.periodo__placas {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(1.25rem, 3vw, 2rem);
}

@container (min-width: 640px) {
  .periodo__placas {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* A placa restrita ocupa a largura toda, mesmo na grade de duas colunas. */
.periodo :deep(.placa--restrita) {
  grid-column: 1 / -1;
}

.em-preparo {
  margin: clamp(2.25rem, 4vw, 3rem) 0 0;
  padding: 1.25rem 0 2rem;
  border-top: 1px solid var(--cor-borda);
  color: var(--cor-texto-suave);
}

:root[data-modo-adaptado='on'] .periodo__numeral {
  display: none;
}

:root[data-modo-adaptado='on'] .periodo__cabeca {
  border-bottom: 3px solid var(--cor-texto);
}

:root[data-modo-adaptado='on'] .em-preparo {
  font-size: var(--escala-base);
  color: var(--cor-texto);
  border-top: 2px solid var(--cor-texto);
}
</style>
