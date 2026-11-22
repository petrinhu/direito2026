<script setup lang="ts">
import { AVISO_LEGAL } from '@/app/rodape/avisoLegal';
</script>

<template>
  <!-- aside (complementary) com nome: é o marco de página do aviso. O rodapé já é o contentinfo. -->
  <aside class="aviso-legal" aria-label="Aviso legal">
    <p class="aviso-legal__texto" lang="pt-BR">
      <strong>{{ AVISO_LEGAL.rotulo }}</strong> {{ AVISO_LEGAL.corpo }}
    </p>
  </aside>
</template>

<style scoped>
/*
  Cores e tamanho vêm só de tokens: no tema escuro e no modo adaptado
  (fundo branco, borda e texto pretos, --escala-base em 24px) a caixa muda
  sozinha, sem seletor próprio por modo.
*/
.aviso-legal {
  box-sizing: border-box;
  max-width: none;
  margin: var(--esp-6, 2rem) 0 var(--esp-4, 1rem);
  padding: var(--esp-4, 1rem) var(--esp-5, 1.5rem);
  background: var(--cor-fundo-sutil, #f2efe6);
  border: 2px solid var(--cor-acento, #7c621c);
  border-radius: var(--raio-sm, 6px);
  color: var(--cor-texto, #1c1c1c);
}

/*
  Largura inteira (ordem do líder, item 40 da ratificação de 13/11): até 880 px, o quadro vai de
  borda a borda, sem margem lateral. Acima disso, 16 px de cada lado, a mesma folga do botão Home.
  O ponto 880 px é o da gaveta do menu (LayoutBase.vue).
*/
@media (min-width: 881px) {
  .aviso-legal {
    margin-left: var(--esp-4, 1rem);
    margin-right: var(--esp-4, 1rem);
  }
}

/*
  Até 880 px, alinhado à esquerda: no QA, em 360 px, o texto justificado abria espaços largos entre
  as palavras. Acima de 880 px, justificado com recuo de primeira linha. hyphens: auto (com
  lang="pt-BR" no próprio <p>) reduz os buracos que a justificação causa em linhas curtas.
*/
.aviso-legal__texto {
  margin: 0;
  font-size: var(--escala-base, 1.0625rem);
  line-height: 1.6;
  text-align: left;
  text-indent: 2em;
  hyphens: auto;
}

@media (min-width: 881px) {
  .aviso-legal__texto {
    text-align: justify;
  }
}

/*
  Modo adaptado (baixa visão): sem justificar e sem recuo, porque a WCAG
  1.4.8 recomenda alinhamento à esquerda e o recuo quebra a leitura linha a
  linha. Seletor com :root, mesmo padrão de BarraTopo.vue.
*/
:root[data-modo-adaptado='on'] .aviso-legal__texto {
  text-align: left;
  text-indent: 0;
}

@media print {
  .aviso-legal {
    background: #fff;
    border-color: #000;
    color: #111;
    break-inside: avoid;
  }
}
</style>
