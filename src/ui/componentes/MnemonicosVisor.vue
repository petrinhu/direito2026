<script setup lang="ts">
import { ref } from 'vue';
import type { Mnemonico } from '@/core/mnemonicos/tipos';
import CartaoMnemonico from './CartaoMnemonico.vue';

defineProps<{
  mnemonicos: readonly Mnemonico[];
  /** Endereço da unidade sem barra final. Ex.: '/p/p1/filosofia-juridica/u1'. */
  baseUnidade: string;
}>();

const reveladas = ref<ReadonlySet<string>>(new Set());

function alternar(id: string): void {
  const novo = new Set(reveladas.value);
  if (novo.has(id)) novo.delete(id);
  else novo.add(id);
  reveladas.value = novo;
}

function recomecar(): void {
  reveladas.value = new Set();
}
</script>

<template>
  <section class="mnemonicos" aria-labelledby="mnemonicos-titulo">
    <h2 id="mnemonicos-titulo" class="mnemonicos__titulo">Mnemônicos</h2>
    <p class="mnemonicos__ajuda">
      Cada cartão traz uma dica para o que mais se confunde na unidade. Leia a dica, tente dizer o
      que ela guarda de cabeça e só depois toque no botão: recordar antes de revelar fixa mais do
      que reler. O conteúdo vem sempre do Resumo; a imagem, a frase ou a sigla é só o apoio de
      memória.
    </p>
    <div class="mnemonicos__acoes">
      <button type="button" class="mnemonicos__recomecar" @click="recomecar">
        Esconder todas as respostas
      </button>
    </div>
    <div class="mnemonicos__lista">
      <CartaoMnemonico
        v-for="mnemonico in mnemonicos"
        :key="mnemonico.id"
        :mnemonico="mnemonico"
        :revelado="reveladas.has(mnemonico.id)"
        :base-unidade="baseUnidade"
        @alternar="alternar"
      />
    </div>
  </section>
</template>

<style scoped>
.mnemonicos {
  max-width: var(--largura-coluna-leitura, 760px);
  margin-inline: auto;
  padding-block: var(--esp-5, 1.5rem);
}

.mnemonicos__titulo {
  margin-top: 0;
}

.mnemonicos__acoes {
  margin-block: var(--esp-4, 1rem);
}

.mnemonicos__recomecar {
  min-height: max(var(--alvo-toque-minimo, 24px), 44px);
  padding: var(--esp-2, 0.5rem) var(--esp-4, 1rem);
  border: var(--cartao-borda, 1px solid var(--cor-borda-forte, #c3bca4));
  border-radius: var(--raio-sm, 6px);
  background: var(--cor-fundo-elevado, #fff);
  color: var(--cor-primaria, #163a5f);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.mnemonicos__recomecar:focus-visible {
  outline: var(--foco-espessura, 2px) solid var(--cor-foco, var(--cor-primaria, #163a5f));
  outline-offset: var(--foco-deslocamento, 2px);
}

.mnemonicos__lista {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--esp-4, 1rem);
}

@media print {
  .mnemonicos__acoes,
  .mnemonicos__ajuda {
    display: none;
  }
}
</style>
