<script setup lang="ts">
import { computed } from 'vue';
import type { FichaPensador } from '@/core/fichamento/tipos';

const props = defineProps<{
  ficha: FichaPensador;
  /** "Idade Antiga, Grécia clássica". */
  rotuloFase: string;
  aberta: boolean;
  /** Endereço da unidade sem barra final, para ligar ao bloco do resumo. */
  baseUnidade: string;
}>();

const emit = defineEmits<{ alternar: [string] }>();

const idCorpo = computed(() => `ficha-${props.ficha.id}-corpo`);
</script>

<template>
  <article :id="`ficha-${ficha.id}`" class="ficha">
    <h4 class="ficha__titulo">
      <button
        type="button"
        class="ficha__botao"
        :aria-expanded="aberta ? 'true' : 'false'"
        :aria-controls="idCorpo"
        @click="emit('alternar', ficha.id)"
      >
        <span class="ficha__seta" aria-hidden="true" />
        <span class="ficha__nome">{{ ficha.nome }}</span>
        <span v-if="ficha.datas" class="ficha__datas">{{ ficha.datas }}</span>
      </button>
    </h4>
    <div v-show="aberta" :id="idCorpo" class="ficha__corpo">
      <dl class="ficha__campos">
        <div class="ficha__campo">
          <dt>Período</dt>
          <dd>{{ rotuloFase }}</dd>
        </div>
        <div v-if="ficha.obras.length > 0" class="ficha__campo">
          <dt>Obras de referência</dt>
          <dd>
            <ul>
              <li v-for="obra in ficha.obras" :key="obra">{{ obra }}</li>
            </ul>
          </dd>
        </div>
        <div class="ficha__campo">
          <dt>Ideia central</dt>
          <dd>{{ ficha.modoDePensar }}</dd>
        </div>
        <div class="ficha__campo">
          <dt>Conceitos-chave</dt>
          <dd>
            <ul>
              <li v-for="conceito in ficha.conceitos" :key="conceito">{{ conceito }}</li>
            </ul>
          </dd>
        </div>
        <div v-if="ficha.citacao" class="ficha__campo">
          <dt>Citação</dt>
          <dd>
            <blockquote class="ficha__citacao">{{ ficha.citacao.texto }}</blockquote>
            <p class="ficha__fonte">{{ ficha.citacao.fonte }}</p>
          </dd>
        </div>
        <div class="ficha__campo">
          <dt>Comentário: para o Direito hoje</dt>
          <dd>{{ ficha.paraODireito }}</dd>
        </div>
        <div v-if="ficha.ressalva" class="ficha__campo ficha__campo--ressalva">
          <dt>Ressalva das fontes</dt>
          <dd>{{ ficha.ressalva }}</dd>
        </div>
        <div class="ficha__campo">
          <dt>Referências</dt>
          <dd>
            <ul>
              <li v-for="referencia in ficha.referencias" :key="referencia">{{ referencia }}</li>
            </ul>
          </dd>
        </div>
      </dl>
      <p class="ficha__resumo">
        <a :href="`${baseUnidade}#${ficha.blocoResumo}`">Ver o tema no Resumo</a>
      </p>
    </div>
  </article>
</template>

<style scoped>
.ficha {
  margin-block: var(--esp-3, 0.75rem);
  border: var(--cartao-borda, 1px solid var(--cor-borda, #dcd7c8));
  border-radius: var(--raio-md, 10px);
  background: var(--cor-fundo-elevado, #fff);
  box-shadow: var(--sombra-cartao, none);
}

.ficha__titulo {
  margin: 0;
  font-size: var(--escala-base, 1.0625rem);
}

.ficha__botao {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--esp-1, 0.25rem) var(--esp-3, 0.75rem);
  width: 100%;
  min-height: max(var(--alvo-toque-minimo, 24px), 44px);
  padding: var(--esp-3, 0.75rem) var(--esp-4, 1rem);
  border: 0;
  border-radius: inherit;
  background: transparent;
  color: var(--cor-titulo-texto, #0d2440);
  font: inherit;
  font-family: var(--fonte-titulo, serif);
  font-weight: 600;
  text-align: start;
  cursor: pointer;
  overflow-wrap: anywhere;
}

.ficha__botao:focus-visible {
  outline: var(--foco-espessura, 2px) solid var(--cor-foco, var(--cor-primaria, #163a5f));
  outline-offset: calc(-1 * var(--foco-espessura, 2px));
}

.ficha__seta {
  align-self: center;
  flex: none;
  width: 0;
  height: 0;
  border-block: 0.35em solid transparent;
  border-inline-start: 0.55em solid currentColor;
}

.ficha__botao[aria-expanded='true'] .ficha__seta {
  transform: rotate(90deg);
}

.ficha__datas {
  font-family: var(--fonte-texto, sans-serif);
  font-weight: 400;
  font-size: var(--escala-sm, 0.9375rem);
  color: var(--cor-texto-suave, #4a4a4a);
}

.ficha__corpo {
  padding: 0 var(--esp-4, 1rem) var(--esp-4, 1rem);
  border-top: 1px solid var(--cor-borda, #dcd7c8);
}

.ficha__campos {
  margin: 0;
}

.ficha__campo {
  margin-top: var(--esp-3, 0.75rem);
}

.ficha__campo dt {
  font-size: var(--escala-xs, 0.8125rem);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--cor-texto-suave, #4a4a4a);
}

.ficha__campo dd {
  margin: var(--esp-1, 0.25rem) 0 0;
  max-width: var(--largura-leitura, 68ch);
  overflow-wrap: anywhere;
}

.ficha__campo ul {
  margin: 0;
  padding-inline-start: var(--esp-5, 1.5rem);
}

.ficha__citacao {
  margin: 0;
  padding-inline-start: var(--esp-3, 0.75rem);
  border-inline-start: 4px solid var(--cor-acento, #7c621c);
  font-style: italic;
}

.ficha__fonte {
  margin: var(--esp-1, 0.25rem) 0 0;
  font-size: var(--escala-sm, 0.9375rem);
  color: var(--cor-texto-suave, #4a4a4a);
}

.ficha__campo--ressalva dd {
  padding: var(--esp-2, 0.5rem) var(--esp-3, 0.75rem);
  border: 1px dashed var(--cor-borda-forte, #c3bca4);
  border-radius: var(--raio-sm, 6px);
}

.ficha__resumo a {
  display: inline-flex;
  align-items: center;
  min-height: var(--alvo-toque-minimo, 24px);
}

@media print {
  .ficha__seta {
    transform: rotate(90deg);
  }

  .ficha {
    break-inside: avoid;
    box-shadow: none;
  }

  .ficha__corpo {
    display: block !important;
  }
}
</style>
