<script setup lang="ts">
import { reactive } from 'vue';

/**
 * Extra (b) da unidade de Redação Jurídica 1 (docs/arquitetura.md): as
 * cinco perguntas de toda petição, em cartões que viram ao toque. Fonte:
 * peticao-inicial.pdf, seção "06 — para não esquecer". O PDF extrai o
 * texto do verso invertido (rotação de 180° do próprio arquivo de
 * origem); a leitura foi feita na PÁGINA RENDERIZADA (L-41), não no texto
 * extraído, e confere com a foto de quadro de 18/09.
 *
 * Sem persistência: o estado de "virado" é só de leitura, local a esta
 * sessão de estudo, sem valor em guardar entre visitas (diferente do
 * checklist do art. 319, que marca progresso real).
 */
const CARTOES: ReadonlyArray<{ frente: string; verso: string }> = [
  { frente: 'Quem?', verso: 'Quem é o autor e quem é o réu.' },
  { frente: 'O que aconteceu?', verso: 'Conte os fatos, de forma cronológica.' },
  { frente: 'Qual é o direito?', verso: 'Procure a legislação aplicável a cada fato.' },
  { frente: 'Como provar?', verso: 'Identifique os documentos e demais provas.' },
  { frente: 'O que quer?', verso: 'Transforme o problema em pedidos concretos.' }
];

const viradas = reactive(CARTOES.map(() => false));

function alternar(indice: number): void {
  viradas[indice] = !viradas[indice];
}
</script>

<template>
  <div class="cartoes-cinco-perguntas" role="group" aria-label="Cartões das cinco perguntas de toda petição">
    <button
      v-for="(cartao, indice) in CARTOES"
      :key="cartao.frente"
      type="button"
      class="cartoes-cinco-perguntas__cartao"
      :aria-pressed="viradas[indice] ? 'true' : 'false'"
      :aria-label="`Pergunta ${indice + 1}: ${viradas[indice] ? cartao.verso : cartao.frente}. Toque para ${viradas[indice] ? 'ver a pergunta' : 'ver a resposta'}.`"
      @click="alternar(indice)"
    >
      {{ viradas[indice] ? cartao.verso : cartao.frente }}
    </button>
  </div>
</template>

<style scoped>
.cartoes-cinco-perguntas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--esp-3, 0.75rem);
  margin-block: var(--esp-5, 1.5rem);
}

.cartoes-cinco-perguntas__cartao {
  min-height: max(var(--alvo-toque-minimo, 24px), 96px);
  padding: var(--esp-4, 1rem);
  background: var(--cor-fundo-elevado, #fff);
  border: 1px solid var(--cor-borda, #dcd7c8);
  border-radius: var(--raio-md, 10px);
  color: var(--cor-texto, #1b1b1b);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
}

.cartoes-cinco-perguntas__cartao[aria-pressed='true'] {
  background: var(--cor-primaria, #163a5f);
  color: var(--cor-texto-invertido, #fff);
  font-weight: 400;
}

.cartoes-cinco-perguntas__cartao:focus-visible {
  outline: var(--foco-espessura, 2px) solid var(--cor-foco, var(--cor-primaria, #163a5f));
  outline-offset: var(--foco-deslocamento, 2px);
}
</style>
