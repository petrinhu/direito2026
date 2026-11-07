<script setup lang="ts">
import { ref } from 'vue';
import type { RepositorioProgresso } from '@/core/progresso/tipos';
import { apagarTudoComConfirmacao } from '@/app/persistencia/apagarTudoComConfirmacao';

/**
 * Bloco de aviso de armazenamento, no topo do conteúdo (decisão do líder, 07/11/2026: "O aviso vira
 * um bloco no alto da página e rola junto com ela. O texto aparece inteiro, nunca cobre campo nem
 * menu, e some ao clicar Entendi."). Não é fixo nem sticky: rola com a página. Desde o login único
 * (LU-F3.5), o login guarda um cookie de sessão e um cookie do aparelho (30 dias, que o Sair não
 * apaga), e o bloco diz isso em todo o site. Mostrado só na primeira visita: repositorio decide
 * sozinho se a marca de "já visto" sobrevive a um recarregamento (localStorage) ou dura só esta
 * sessão (armazenamento indisponível, RepositorioMemoria).
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
      Neste navegador ficam o login, o progresso, o tema e a Leitura ampliada. Há um cookie de
      sessão, apagado ao sair, e um que reconhece este aparelho por 30 dias. O Sair não apaga esse
      segundo cookie, nem o botão Apagar os dados guardados.
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
/* Bloco no fluxo do documento, logo abaixo da barra do topo: rola com a página e não cobre nada
   (decisão do líder). Sem position fixed nem sticky. */
.aviso-armazenamento {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--esp-4, 1rem);
  width: min(100% - 2 * var(--esp-4, 1rem), 640px);
  margin: var(--esp-4, 1rem) auto;
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

/* Texto inteiro, sem teto de altura nem rolagem interna, em qualquer largura e na Leitura ampliada. */
.aviso-armazenamento__texto {
  margin: 0;
  font-size: var(--escala-sm, 0.9375rem);
  line-height: 1.5;
}

.aviso-armazenamento__acoes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--esp-3, 0.75rem);
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
    width: min(100% - 2 * var(--esp-2, 0.5rem), 640px);
    padding: var(--esp-3, 0.75rem);
    gap: var(--esp-3, 0.75rem);
  }
}

@media print {
  .aviso-armazenamento {
    display: none;
  }
}
</style>
