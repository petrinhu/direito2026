<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { IdRadio } from '@/core/radio/catalogo';
import type { StoreRadio } from '@/app/radio/tocadorRadio';
import { CONTATO_EMAIL } from '@/app/rodape/titular';

/**
 * Tocador de rádio na barra do topo (item 42 e 44 da ratificação, decisão de 21/11). No computador,
 * tocar, silenciar e volume ficam na barra; "Rádio" abre os detalhes (escolha, créditos e sugestão).
 * No celular, "Rádio" abre um painel com os mesmos controles. A lógica mora na store; aqui é só
 * apresentação e o aviso de consentimento, que é um <dialog> nativo (foco e Esc de graça).
 */
const props = defineProps<{ store: StoreRadio }>();

const painelAberto = ref(false);
const dialogo = ref<HTMLDialogElement | null>(null);

const pedindoConsentimento = computed(() => props.store.estado.value === 'pedindoConsentimento');
const tocando = computed(
  () => props.store.estado.value === 'conectando' || props.store.estado.value === 'tocando'
);
const comErro = computed(() => props.store.estado.value === 'erro');
const rotuloTocar = computed(() => {
  if (tocando.value) return 'Parar';
  if (comErro.value) return 'Tentar de novo';
  return 'Tocar';
});

watch(
  pedindoConsentimento,
  (aberto) => {
    const el = dialogo.value;
    if (!el) return;
    if (aberto && !el.open) el.showModal();
    if (!aberto && el.open) el.close();
  },
  { flush: 'post' }
);

function aoEscolherRadio(evento: Event): void {
  props.store.trocarRadio((evento.target as HTMLSelectElement).value as IdRadio);
}

function aoMudarVolume(evento: Event): void {
  props.store.definirVolume(Number((evento.target as HTMLInputElement).value));
}

/** Sugestão de rádio: o aluno sugere, o líder aprova e a rádio entra na próxima publicação (item 77). */
const linkSugestao = `mailto:${CONTATO_EMAIL}?subject=${encodeURIComponent('Sugestão de rádio para o tocador')}`;
</script>

<template>
  <div class="tocador" :class="{ 'tocador--aberto': painelAberto }">
    <button
      type="button"
      class="tocador__abrir"
      aria-controls="tocador-painel"
      :aria-expanded="painelAberto ? 'true' : 'false'"
      @click="painelAberto = !painelAberto"
    >
      <span class="tocador__led" :data-estado="props.store.estado.value" aria-hidden="true" />
      Rádio
    </button>

    <div id="tocador-painel" class="tocador__painel">
      <div class="tocador__controles">
        <button
          type="button"
          class="tocador__botao tocador__botao--tocar"
          :class="{ 'tocador__botao--parar': tocando }"
          @click="props.store.alternar()"
        >
          <span aria-hidden="true">{{ tocando ? '■' : '▶' }}</span>
          {{ rotuloTocar }}
        </button>

        <button
          type="button"
          class="tocador__botao"
          :aria-pressed="props.store.mudo.value ? 'true' : 'false'"
          @click="props.store.alternarMudo()"
        >
          Silenciar
        </button>

        <label class="tocador__volume">
          <span class="tocador__rotulo">Volume</span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            :value="props.store.volume.value"
            :aria-valuetext="`${props.store.volume.value}%`"
            @input="aoMudarVolume"
          />
          <output class="tocador__valor">{{ props.store.volume.value }}%</output>
        </label>
      </div>

      <div v-show="painelAberto" id="tocador-detalhes" class="tocador__detalhes">
        <label class="tocador__escolha">
          <span class="tocador__rotulo">Rádio</span>
          <select :value="props.store.radio.value.id" @change="aoEscolherRadio">
            <option v-for="radio in props.store.radios" :key="radio.id" :value="radio.id">
              {{ radio.nome }}
            </option>
          </select>
        </label>

        <ul class="tocador__emissoras">
          <li v-for="radio in props.store.radios" :key="radio.id">
            <span class="tocador__emissora-nome">{{ radio.nome }}</span>
            <span class="tocador__emissora-dados">
              ({{ radio.genero === 'classica' ? 'clássica' : 'ambiente' }}, {{ radio.formato }})
            </span>
            <a
              :href="radio.site"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="`Site da emissora ${radio.nome}, abre em nova aba`"
              >site da emissora</a
            >
          </li>
        </ul>

        <p class="tocador__sugestao">
          <a :href="linkSugestao">Sugira uma rádio</a>
        </p>
      </div>
    </div>

    <!-- Estado escrito, visível também no celular com o painel fechado: o LED não é a única pista. -->
    <span class="tocador__estado">{{ props.store.anuncio.value }}</span>

    <!-- Região sempre montada: o anúncio não depende de o painel estar aberto. -->
    <p class="tocador__so-leitor" role="status" aria-live="polite">
      {{ props.store.anuncio.value }}
    </p>

    <dialog
      ref="dialogo"
      class="tocador__aviso"
      aria-labelledby="tocador-aviso-titulo"
      aria-describedby="tocador-aviso-texto"
      @cancel.prevent="props.store.cancelar()"
    >
      <h2 id="tocador-aviso-titulo" class="tocador__aviso-titulo">Antes de conectar</h2>
      <p id="tocador-aviso-texto">
        Ao tocar {{ props.store.radio.value.nome }}, o endereço IP do seu aparelho vai para essa
        emissora. A conexão é feita pelo seu navegador, direto com a emissora: o site não passa esse
        endereço pelo seu servidor. Nada se conecta sem a sua confirmação.
      </p>
      <div class="tocador__aviso-acoes">
        <button type="button" class="tocador__botao" @click="props.store.cancelar()">
          Cancelar
        </button>
        <button
          type="button"
          class="tocador__botao tocador__botao--tocar"
          @click="props.store.consentir()"
        >
          Tocar mesmo assim
        </button>
      </div>
    </dialog>
  </div>
</template>

<style scoped>
.tocador {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--esp-2, 0.5rem);
  color: inherit;
}

.tocador__led {
  display: inline-block;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: #6b7280;
  margin-right: 0.4rem;
}

.tocador__led[data-estado='conectando'] {
  background: #f5a524;
}

.tocador__led[data-estado='tocando'] {
  background: #3ddc84;
}

.tocador__led[data-estado='erro'] {
  background: #ff6b6b;
}

/* O piscar do LED é só movimento: some com prefers-reduced-motion e no modo adaptado. O texto
   ao lado diz o estado sozinho, o LED nunca é a única pista. */
@media (prefers-reduced-motion: no-preference) {
  :root:not([data-modo-adaptado='on']) .tocador__led[data-estado='conectando'] {
    animation: tocador-piscar 900ms ease-in-out infinite;
  }
}

@keyframes tocador-piscar {
  50% {
    opacity: 0.25;
  }
}

.tocador__abrir {
  min-height: 2.25rem;
  background: none;
  border: 1px solid currentColor;
  border-radius: 0.25rem;
  color: inherit;
  padding: 0.25rem 0.6rem;
  cursor: pointer;
}

.tocador__controles,
.tocador__painel,
.tocador__detalhes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--esp-2, 0.5rem);
}

.tocador__botao,
.tocador__abrir,
.tocador select {
  min-height: 2.25rem;
  font: inherit;
  color: inherit;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid currentColor;
  border-radius: 0.25rem;
  padding: 0.25rem 0.6rem;
  cursor: pointer;
}

.tocador__botao[aria-pressed='true'] {
  background: rgba(255, 255, 255, 0.28);
}

.tocador__botao--tocar {
  font-weight: 600;
}

.tocador__volume {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

/* O input não herda a cor do pai. Sem esta linha ele usa a cor padrão do navegador (medida:
   #9d968e sobre o branco do cabeçalho no modo adaptado escuro, 2,9:1). */
.tocador__volume input {
  width: 6rem;
  color: var(--cor-sidebar-texto, #faf9f5);
}

.tocador__rotulo {
  font-size: 0.85rem;
}

.tocador__estado {
  font-size: 0.85rem;
  min-width: 0;
}

/* Desktop: os detalhes flutuam sob a barra, sem empurrar o cabeçalho. */
.tocador__detalhes {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 70;
  flex-direction: column;
  align-items: stretch;
  min-width: 18rem;
  padding: var(--esp-3, 0.75rem);
  background: var(--cor-sidebar-fundo, #0d2440);
  color: var(--cor-sidebar-texto, #faf9f5);
  border: 1px solid currentColor;
}

.tocador__emissoras {
  margin: 0;
  padding-left: 1rem;
  font-size: 0.85rem;
}

.tocador__emissoras a,
.tocador__sugestao a {
  color: inherit;
}

.tocador__so-leitor {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.tocador__aviso {
  max-width: min(32rem, calc(100vw - 2rem));
  border: 1px solid currentColor;
  border-radius: 0.5rem;
  padding: var(--esp-4, 1rem);
  background: var(--cor-sidebar-fundo, #0d2440);
  color: var(--cor-sidebar-texto, #faf9f5);
}

.tocador__aviso-titulo {
  margin-top: 0;
  font-size: 1.1rem;
}

.tocador__aviso-acoes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--esp-2, 0.5rem);
  justify-content: flex-end;
}

/* Celular e tablet (até 880px, mesma faixa do botão de gaveta): o painel sai da barra e abre
   pelo botão "Rádio" com os controles e os detalhes empilhados. */
@media (max-width: 880px) {
  .tocador__painel {
    display: none;
  }

  .tocador--aberto .tocador__painel {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 70;
    padding: var(--esp-3, 0.75rem);
    background: var(--cor-sidebar-fundo, #0d2440);
    color: var(--cor-sidebar-texto, #faf9f5);
  }

  .tocador__detalhes {
    position: static;
    min-width: 0;
    border: 0;
    padding: 0;
    background: none;
    color: inherit;
  }
}

/* Modo adaptado: alvos de 44 px e tudo visível sem reveal. */
:root[data-modo-adaptado='on'] .tocador__botao,
:root[data-modo-adaptado='on'] .tocador__abrir,
:root[data-modo-adaptado='on'] .tocador select,
:root[data-modo-adaptado='on'] .tocador__volume input {
  min-height: 44px;
}

:root[data-modo-adaptado='on'] .tocador__volume input {
  min-width: 44px;
}

:root[data-modo-adaptado='on'] .tocador__botao,
:root[data-modo-adaptado='on'] .tocador__abrir {
  min-width: 44px;
}

:root[data-modo-adaptado='on'] .tocador__led[data-estado='conectando'] {
  animation: none;
}

:root[data-modo-adaptado='on'] .tocador__emissoras a,
:root[data-modo-adaptado='on'] .tocador__sugestao a {
  display: inline-block;
  min-height: 44px;
  line-height: 44px;
}
</style>
