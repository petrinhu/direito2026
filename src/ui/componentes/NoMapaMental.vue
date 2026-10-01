<script setup lang="ts">
import { computed } from 'vue';
import type { NoMapa, TipoNoMapa } from '@/core/fichamento/tipos';

defineOptions({ name: 'NoMapaMental' });

const props = defineProps<{
  no: NoMapa;
  /** Profundidade na árvore, começando em 1 na raiz. */
  nivel: number;
  posicao: number;
  tamanho: number;
  abertos: ReadonlySet<string>;
  focoId: string;
  baseUnidade: string;
}>();

const emit = defineEmits<{ alternar: [string] }>();

/**
 * Nome do nível, dito em texto: a cor do bloco reforça, nunca é o único
 * sinal (e no modo adaptado nem existe cor de matiz). Só os três níveis
 * estruturais ganham rótulo próprio; nos demais o próprio rótulo do nó
 * ("Modo de pensar", "Conceitos-chave") já nomeia o que ele é.
 */
const ROTULOS_NIVEL: Partial<Record<TipoNoMapa, string>> = {
  era: 'Período',
  fase: 'Fase',
  pensador: 'Pensador'
};

const temFilhos = computed(() => props.no.filhos.length > 0);
const aberto = computed(() => props.abertos.has(props.no.id));
const rotuloNivel = computed(() => ROTULOS_NIVEL[props.no.tipo]);
const idNivel = computed(() => `${props.no.id}-nivel`);
const idRotulo = computed(() => `${props.no.id}-rotulo`);
const idDetalhe = computed(() => `${props.no.id}-detalhe`);
const nomeAcessivel = computed(() =>
  rotuloNivel.value ? `${idNivel.value} ${idRotulo.value}` : idRotulo.value
);
const hrefFicha = computed(() =>
  props.no.fichaId ? `${props.baseUnidade}/fichamento#ficha-${props.no.fichaId}` : undefined
);

function aoClicar(): void {
  if (temFilhos.value) emit('alternar', props.no.id);
}
</script>

<template>
  <li
    :id="no.id"
    role="treeitem"
    :class="['no-mapa', `no-mapa--${no.tipo}`]"
    :aria-level="nivel"
    :aria-setsize="tamanho"
    :aria-posinset="posicao"
    :aria-expanded="temFilhos ? (aberto ? 'true' : 'false') : undefined"
    :aria-labelledby="nomeAcessivel"
    :aria-describedby="no.detalhe ? idDetalhe : undefined"
    :tabindex="focoId === no.id ? 0 : -1"
  >
    <div class="no-mapa__corpo" @click.stop="aoClicar">
      <span v-if="temFilhos" class="no-mapa__seta" aria-hidden="true" />
      <span v-if="rotuloNivel" :id="idNivel" class="no-mapa__nivel">{{ rotuloNivel }}</span>
      <span :id="idRotulo" class="no-mapa__rotulo">
        <a v-if="hrefFicha && !temFilhos" :href="hrefFicha" tabindex="-1" @click.stop>{{
          no.rotulo
        }}</a>
        <template v-else>{{ no.rotulo }}</template>
      </span>
      <p v-if="no.detalhe" :id="idDetalhe" class="no-mapa__detalhe">{{ no.detalhe }}</p>
    </div>
    <ul v-if="temFilhos" v-show="aberto" role="group" class="no-mapa__grupo">
      <NoMapaMental
        v-for="(filho, indice) in no.filhos"
        :key="filho.id"
        :no="filho"
        :nivel="nivel + 1"
        :posicao="indice + 1"
        :tamanho="no.filhos.length"
        :abertos="abertos"
        :foco-id="focoId"
        :base-unidade="baseUnidade"
        @alternar="emit('alternar', $event)"
      />
    </ul>
  </li>
</template>

<style scoped>
.no-mapa {
  position: relative;
  list-style: none;
  margin-block: var(--esp-2, 0.5rem);
}

/* O anel de foco vai no bloco visível do nó, não no <li> inteiro (que
   envolve a subárvore toda). */
.no-mapa:focus {
  outline: none;
}

.no-mapa:focus-visible > .no-mapa__corpo {
  outline: var(--foco-espessura, 2px) solid var(--cor-foco, var(--cor-primaria, #163a5f));
  outline-offset: var(--foco-deslocamento, 2px);
}

.no-mapa__corpo {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--esp-1, 0.25rem) var(--esp-2, 0.5rem);
  min-height: var(--alvo-toque-minimo, 24px);
  padding: var(--esp-2, 0.5rem) var(--esp-3, 0.75rem);
  border: var(--cartao-borda, 1px solid var(--cor-borda, #dcd7c8));
  border-radius: var(--raio-sm, 6px);
  background: var(--cor-fundo-sutil, #f2efe6);
  color: var(--cor-texto, #1c1c1c);
  overflow-wrap: break-word;
  hyphens: manual;
  cursor: default;
}

.no-mapa--raiz > .no-mapa__corpo,
.no-mapa--era > .no-mapa__corpo {
  background: var(--cor-mapa-era-fundo, #0d2440);
  color: var(--cor-mapa-era-texto, #e6d3a0);
}

.no-mapa--fase > .no-mapa__corpo {
  background: var(--cor-mapa-fase-fundo, #1a3a5c);
  color: var(--cor-mapa-fase-texto, #d9e6f5);
}

.no-mapa--pensador > .no-mapa__corpo {
  background: var(--cor-fundo-elevado, #fff);
  border-inline-start: 4px solid var(--cor-acento, #7c621c);
}

.no-mapa--raiz > .no-mapa__corpo {
  font-family: var(--fonte-titulo, serif);
  font-size: var(--escala-md, 1.25rem);
}

.no-mapa--era > .no-mapa__corpo,
.no-mapa--pensador > .no-mapa__corpo {
  font-weight: 600;
}

.no-mapa--conceito > .no-mapa__corpo {
  padding-inline: var(--esp-2, 0.5rem);
  background: transparent;
  border-style: dashed;
}

.no-mapa__nivel {
  font-size: var(--escala-xs, 0.8125rem);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.no-mapa__rotulo a {
  color: inherit;
  text-decoration: underline;
}

.no-mapa__detalhe {
  flex-basis: 100%;
  margin: 0;
  font-size: var(--escala-base, 1.0625rem);
  line-height: var(--altura-linha-texto, 1.7);
}

.no-mapa--ressalva > .no-mapa__corpo {
  border-style: dashed;
}

/* Triângulo de abrir e fechar: aponta à direita fechado e para baixo aberto,
   o estado também é dito pela forma e por aria-expanded, nunca só pela cor. */
.no-mapa__seta {
  align-self: center;
  flex: none;
  width: 0;
  height: 0;
  border-block: 0.35em solid transparent;
  border-inline-start: 0.55em solid currentColor;
  transition: transform var(--transicao-rapida, 150ms ease);
}

.no-mapa[aria-expanded='true'] > .no-mapa__corpo > .no-mapa__seta {
  transform: rotate(90deg);
}

:root[data-modo-adaptado='on'] .no-mapa__seta {
  transition: none;
}

/* Conectores: linha vertical por grupo e um traço horizontal por filho. */
.no-mapa__grupo {
  position: relative;
  /* Recuo mínimo na base: com seis níveis e texto de 24px, cada pixel de
     recuo sai da coluna do texto (QA, IMPORTANTE 2). Cresce a partir de 640px. */
  margin: 0 0 0 var(--esp-1, 0.25rem);
  padding: 0 0 0 var(--esp-2, 0.5rem);
  border-inline-start: 2px solid var(--cor-mapa-linha, #5f7189);
  list-style: none;
}

.no-mapa__grupo > .no-mapa::before {
  content: '';
  position: absolute;
  inset-inline-start: calc(-1 * var(--esp-2, 0.5rem));
  top: 1.1em;
  width: var(--esp-2, 0.5rem);
  border-top: 2px solid var(--cor-mapa-linha, #5f7189);
}

@media (min-width: 640px) {
  .no-mapa__grupo {
    margin-inline-start: var(--esp-4, 1rem);
    padding-inline-start: var(--esp-4, 1rem);
  }

  .no-mapa--conceito > .no-mapa__corpo {
    padding-inline: var(--esp-3, 0.75rem);
  }

  .no-mapa__grupo > .no-mapa::before {
    inset-inline-start: calc(-1 * var(--esp-4, 1rem));
    width: var(--esp-4, 1rem);
  }
}

@media print {
  .no-mapa__corpo {
    background: #fff !important;
    color: #000 !important;
    border: 1px solid #000 !important;
  }
}
</style>
