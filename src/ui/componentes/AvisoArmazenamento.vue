<script setup lang="ts">
import { ref } from 'vue';
import type { RepositorioProgresso } from '@/core/progresso/tipos';
import { apagarTudoComConfirmacao } from '@/app/persistencia/apagarTudoComConfirmacao';

/**
 * Faixa de aviso de armazenamento (ordem do líder, 22/09/2026: aviso de
 * cookies; a resposta foi a faixa discreta, não o banner, porque o site
 * guardava só armazenamento local para tema e progresso). Desde o login
 * único (LU-F3.5, 07/11/2026), o login guarda um cookie de sessão e um cookie
 * do aparelho (30 dias, que o Sair não apaga), e a faixa diz isso em todo o site.
 * Mostrada só na primeira visita: repositorio decide sozinho se a marca
 * de "já visto" sobrevive a um recarregamento (localStorage) ou dura só
 * esta sessão (armazenamento indisponível, RepositorioMemoria): este
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
/* Faixa no FLUXO do documento, não position: fixed. Fixa, ela cobria o
   conteúdo do fim da página (QA em produção: botão "Anterior" do quiz, 1280px)
   até o aluno clicar em "Entendi". Sticky reserva a altura real da faixa no
   fim do conteúdo (mesma lógica do padding-top de LayoutBase.vue, que reserva
   espaço para a BarraTopo) e, enquanto a página é mais alta que a janela, a
   faixa continua visível colada na base da janela. */
.aviso-armazenamento {
  position: sticky;
  bottom: var(--esp-4, 1rem);
  z-index: 70;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--esp-4, 1rem);
  width: min(100% - 2 * var(--esp-4, 1rem), 640px);
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

/* Texto em largura total, com os botões na linha de baixo: ao lado deles o texto
   ficava estreito e a faixa subia sobre o campo de busca. Entrelinha 1.5 para a
   faixa caber em 187 px a 1280px, a altura da v1.5.0.0. */
.aviso-armazenamento__texto {
  flex: 1 1 100%;
  margin: 0;
  font-size: var(--escala-sm, 0.9375rem);
  line-height: 1.5;
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
    bottom: var(--esp-2, 0.5rem);
    width: min(100% - 2 * var(--esp-2, 0.5rem), 640px);
    flex-direction: column;
    align-items: stretch;
    /* Folga menor no celular: a faixa precisa caber na altura que a v1.5.0.0
       tinha em 360x640 (238 px), senão sobe mais que ela sobre o conteúdo. */
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
