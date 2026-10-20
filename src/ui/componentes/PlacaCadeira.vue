<script setup lang="ts">
import { computed } from 'vue';
import type { Cadeira, Periodo } from '@/core/curriculo/tipos';
import { linhasDaCadeira } from '@/app/curriculo/linhasDaCadeira';
import { rotuloSemViuva } from '@/app/curriculo/rotuloSemViuva';

// Placa de uma cadeira. Cadeira restrita (Interdisciplinar) vira placa própria,
// com o selo "Área restrita": só o cadeado e o link de entrada, nunca unidade.
const props = defineProps<{ periodo: Periodo; cadeira: Cadeira }>();

const restrita = computed(() => props.cadeira.restrita === true);
const linhas = computed(() => linhasDaCadeira(props.periodo, props.cadeira));
const idTitulo = computed(() => `cadeira-${props.periodo.id}-${props.cadeira.id}`);
const hrefRestrita = computed(() => `/p/${props.periodo.id}/${props.cadeira.id}`);
</script>

<template>
  <article class="placa" :class="{ 'placa--restrita': restrita }" :aria-labelledby="idTitulo">
    <div class="placa__cabeca">
      <h3 :id="idTitulo" class="placa__nome">{{ rotuloSemViuva(cadeira.nome) }}</h3>
      <span v-if="restrita" class="selo">
        <svg class="icone" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        Área restrita
      </span>
    </div>

    <p v-if="restrita" class="placa__corpo">
      Conteúdo de acesso restrito. Aparece depois do login.
    </p>

    <ul v-if="restrita" class="placa__lista">
      <li>
        <a class="linha linha--restrita" :href="hrefRestrita">
          <span class="visualmente-oculto">{{ rotuloSemViuva(cadeira.nome) }}: </span>
          <span class="linha__rotulo">Cadeira</span>
          <span class="linha__texto">
            <svg class="icone" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            Entrar para ver o conteúdo
          </span>
        </a>
      </li>
    </ul>

    <ul v-else-if="linhas.length > 0" class="placa__lista">
      <li v-for="linha in linhas" :key="linha.href">
        <a class="linha" :class="{ 'linha--restrita': linha.restrita }" :href="linha.href">
          <!-- Nome acessível único por link (WCAG 2.4.4): sem o nome da cadeira, duas
               cadeiras com a mesma Unidade 1 lêem o mesmo texto em duas placas. -->
          <span class="visualmente-oculto">{{ rotuloSemViuva(cadeira.nome) }}: </span>
          <span class="linha__rotulo">{{ linha.rotulo }}</span>
          <span class="linha__texto">
            <svg
              v-if="linha.restrita"
              class="icone"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            {{ linha.texto }}
          </span>
        </a>
      </li>
    </ul>
  </article>
</template>

<style scoped>
/* Placa: moldura de filete duplo fino (1px dourado, faixa de papel, 1px). */
.placa {
  position: relative;
  background: var(--cor-fundo-elevado);
  padding: 2.25rem 2rem 1rem;
  box-shadow:
    inset 0 0 0 1px var(--cor-acento),
    inset 0 0 0 6px var(--cor-fundo-elevado),
    inset 0 0 0 7px var(--cor-acento);
}

.placa__cabeca {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1.5rem;
}

.placa__nome {
  margin: 0;
  font-size: var(--escala-lg);
  font-weight: 700;
  line-height: 1.15;
  color: var(--cor-titulo-texto);
  font-variant-numeric: lining-nums;
}

.placa__nome::after {
  content: '';
  display: block;
  width: 2.5rem;
  height: 1px;
  margin-top: 0.75rem;
  background: var(--cor-acento);
}

.placa__corpo {
  margin: 1rem 0 0;
  max-width: 40rem;
  color: var(--cor-texto-suave);
  text-wrap: balance;
}

.placa__lista {
  list-style: none;
  margin: 1.25rem 0 0;
  padding: 0;
  border-top: 1px solid var(--cor-borda);
}

.linha {
  display: grid;
  gap: 0.25rem;
  align-items: start;
  min-height: 44px;
  margin: 0 -0.5rem;
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid var(--cor-borda);
  color: var(--cor-texto);
  text-decoration: none;
}

.linha:hover {
  background: var(--cor-primaria-clara);
}

.linha:hover .linha__texto {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.linha:focus-visible {
  outline: var(--foco-espessura) solid var(--cor-foco);
  outline-offset: calc(var(--foco-deslocamento) * -1);
}

.linha__rotulo {
  font-size: var(--escala-sm);
  font-weight: 500;
  color: var(--cor-texto-suave);
}

.linha__texto {
  display: inline-flex;
  align-items: center;
  font-size: var(--escala-base);
  line-height: 1.45;
  color: var(--cor-texto);
}

.linha--restrita .linha__texto {
  color: var(--cor-texto-suave);
}

.icone {
  flex: none;
  width: 1rem;
  height: 1rem;
  margin-right: 0.375rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}

/* Só para o leitor de tela: prefixa o nome da cadeira no nome do link. */
.visualmente-oculto {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.selo {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.65rem;
  border: 1px solid var(--cor-bordo);
  border-radius: 999px;
  font-size: var(--escala-sm);
  font-weight: 500;
  color: var(--cor-bordo);
  white-space: nowrap;
}

/* Modo de leitura adaptada: sem moldura ornamental, filete de 2px preto, texto
   grande e sublinhado (cor nunca é o único sinal). Os alvos já vêm de 44px. */
:root[data-modo-adaptado='on'] .placa {
  box-shadow: none;
  border: 2px solid var(--cor-texto);
  padding: 1.5rem 1.25rem 1rem;
}

:root[data-modo-adaptado='on'] .placa__nome::after {
  display: none;
}

:root[data-modo-adaptado='on'] .linha {
  border-bottom: 2px solid var(--cor-texto);
}

:root[data-modo-adaptado='on'] .linha__rotulo,
:root[data-modo-adaptado='on'] .linha__texto {
  text-decoration: underline;
  text-underline-offset: 4px;
}

:root[data-modo-adaptado='on'] .selo {
  border: 2px solid var(--cor-texto);
  color: var(--cor-texto);
}
</style>
