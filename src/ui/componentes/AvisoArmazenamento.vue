<script setup lang="ts">
import { ref } from 'vue';
import type { RepositorioProgresso } from '@/core/progresso/tipos';
import { apagarTudoComConfirmacao } from '@/app/persistencia/apagarTudoComConfirmacao';

/**
 * Faixa de aviso de armazenamento (ordem do líder, 22/09/2026: o líder
 * pediu aviso de cookies; verificado que o site não usa cookie nem
 * rastreador, só armazenamento local para tema e progresso — por isso a
 * faixa discreta de aviso de armazenamento, não o banner de cookies).
 * Mostrada só na primeira visita: repositorio decide sozinho se a marca
 * de "já visto" sobrevive a um recarregamento (localStorage) ou dura só
 * esta sessão (armazenamento indisponível, RepositorioMemoria) — este
 * componente não sabe nem precisa saber qual das duas está por trás.
 */
const props = defineProps<{ repositorio: RepositorioProgresso }>();

const visivel = ref(!props.repositorio.lerAvisoArmazenamentoVisto());

function confirmar(): void {
  props.repositorio.marcarAvisoArmazenamentoVisto();
  visivel.value = false;
}

function apagar(): void {
  apagarTudoComConfirmacao(props.repositorio);
}
</script>

<template>
  <div v-if="visivel" class="aviso-armazenamento" role="status" aria-live="polite">
    <p class="aviso-armazenamento__texto">
      Este site guarda, só neste navegador e neste aparelho, o tema escolhido e o progresso de
      leitura e de quiz. Não usa cookies, não rastreia e não envia nada para nenhum servidor.
    </p>
    <div class="aviso-armazenamento__acoes">
      <button type="button" class="aviso-armazenamento__apagar" @click="apagar">
        Apagar os dados guardados
      </button>
      <button type="button" class="aviso-armazenamento__entendi" @click="confirmar">Entendi</button>
    </div>
  </div>
</template>

<style scoped>
.aviso-armazenamento {
  position: fixed;
  left: var(--esp-4, 1rem);
  right: var(--esp-4, 1rem);
  bottom: var(--esp-4, 1rem);
  z-index: 70;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--esp-4, 1rem);
  max-width: 640px;
  margin-inline: auto;
  padding: var(--esp-4, 1rem) var(--esp-5, 1.5rem);
  border-radius: var(--raio-md, 10px);
  border: 1px solid var(--cor-borda-forte, #c3bca4);
  /* Mesmo par já usado no cartão (design.contrasteTokens.spec.ts, par
     "texto sobre cartão"): não introduz combinação nova para o portão
     de contraste ter de aprender. */
  background: var(--cor-fundo-elevado, #fff);
  color: var(--cor-texto, #1c1c1c);
  box-shadow: var(--sombra-elevada, 0 8px 24px rgba(13, 36, 64, 0.12));
}

.aviso-armazenamento__texto {
  flex: 1;
  min-width: 220px;
  margin: 0;
  font-size: var(--escala-sm, 0.9375rem);
}

.aviso-armazenamento__acoes {
  display: flex;
  gap: var(--esp-3, 0.75rem);
  flex-shrink: 0;
}

.aviso-armazenamento__apagar {
  min-height: 44px;
  padding: var(--esp-2, 0.5rem) var(--esp-3, 0.75rem);
  background: none;
  border: none;
  color: var(--cor-texto, #1c1c1c);
  text-decoration: underline;
  font: inherit;
  font-size: var(--escala-xs, 0.8125rem);
  cursor: pointer;
}

.aviso-armazenamento__entendi {
  min-height: 44px;
  padding: var(--esp-2, 0.5rem) var(--esp-5, 1.5rem);
  border-radius: var(--raio-md, 10px);
  border: none;
  /* Par já gated como "botão primário". */
  background: var(--cor-primaria, #163a5f);
  color: var(--cor-texto-invertido, #faf9f5);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.aviso-armazenamento__apagar:focus-visible,
.aviso-armazenamento__entendi:focus-visible {
  outline: 2px solid var(--cor-primaria, #163a5f);
  outline-offset: 2px;
}

@media (max-width: 640px) {
  .aviso-armazenamento {
    left: var(--esp-2, 0.5rem);
    right: var(--esp-2, 0.5rem);
    bottom: var(--esp-2, 0.5rem);
    flex-direction: column;
    align-items: stretch;
  }
}

@media print {
  .aviso-armazenamento {
    display: none;
  }
}
</style>
