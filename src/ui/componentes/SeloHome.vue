<script setup lang="ts">
// Selo "Caderno de Direito / HOME" no início da barra do topo (ordem do líder,
// 20/10/2026, variante A do protótipo mockups/selo-home.html). Quem decide se
// aparece é a BarraTopo (nunca na página inicial). Aqui fica só o link, o
// desenho e o estilo. O templo é o mesmo do círculo Home (BotaoHome.vue).
</script>

<template>
  <a href="/" class="selo-home" aria-label="Caderno de Direito, página inicial">
    <svg class="selo-home__templo" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <g class="selo-home__traco">
        <path d="M6 18 L24 7 L42 18 Z" />
        <path d="M6 18 H42 V21 H6 Z" />
        <path d="M11 23 V35 M19 23 V35 M29 23 V35 M37 23 V35" />
        <path d="M8 35 H40 V38 H8 Z" />
        <path d="M5 38 H43 V42 H5 Z" />
      </g>
    </svg>
    <span class="selo-home__texto">
      <span class="selo-home__titulo">Caderno de Direito</span>
      <span class="selo-home__rotulo">HOME</span>
    </span>
  </a>
</template>

<style scoped>
/*
  Cores só de tokens que ficam iguais nos dois temas (a barra é escura nos dois):
  --cor-sidebar-fundo, --cor-sidebar-texto e --cor-friso. Por isso o tema escuro
  não precisa de regra própria. Nenhum token que inverte com o tema é usado aqui.

  Altura em min-height (e não height): no modo adaptado o texto é maior, e a
  pílula cresce para caber em vez de cortar. O raio de 999px é reduzido pelo
  navegador para metade da altura, então continua em arco nos dois tamanhos.
*/
.selo-home {
  --selo-altura: 60px;
  --selo-templo: 40px;
  --selo-recuo: 18px;
  --selo-titulo: var(--escala-md);
  --selo-rotulo: var(--escala-xs);

  display: inline-grid;
  grid-template-columns: var(--selo-templo) auto;
  align-items: center;
  flex: none;
  /* Nunca passa da largura disponível: o título quebra dentro da pílula
     (abaixo), em vez de empurrar a barra para fora da tela. */
  max-width: 100%;
  min-width: 0;
  min-height: var(--selo-altura);
  padding-left: var(--selo-recuo);
  padding-right: 0;
  border-radius: 999px;
  border: 2px solid var(--cor-friso, #d3b563);
  background: var(--cor-sidebar-fundo, #0d2440);
  color: var(--cor-sidebar-texto, #faf9f5);
  text-decoration: none;
  white-space: nowrap;
}

.selo-home__templo {
  display: block;
  width: var(--selo-templo);
  height: var(--selo-templo);
  overflow: visible;
}

/* Mesmo traço do BotaoHome: friso, em espessura de tela (não escala com o desenho). */
.selo-home__traco {
  fill: none;
  stroke: var(--cor-friso, #d3b563);
  stroke-width: 1.5px;
  stroke-linecap: square;
  stroke-linejoin: miter;
}

.selo-home__traco path {
  vector-effect: non-scaling-stroke;
}

/* Coluna do texto começa logo depois do templo e vai até a borda direita. O
   padding igual dos dois lados centraliza o texto na área que sobra, e não no
   retângulo inteiro. */
.selo-home__texto {
  grid-column: 2;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0 var(--selo-recuo);
}

.selo-home__titulo {
  font-family: var(--fonte-titulo);
  font-weight: 600;
  font-size: var(--selo-titulo);
  line-height: 1.1;
  color: var(--cor-sidebar-texto, #faf9f5);
  /* Pode quebrar em duas linhas dentro da pílula quando o espaço é pouco. */
  white-space: normal;
  text-wrap: balance;
}

/* letter-spacing soma espaço depois da última letra; o padding-left de mesmo
   tamanho devolve o centro óptico ao centro do bloco. */
.selo-home__rotulo {
  margin-top: 2px;
  font-family: var(--fonte-texto);
  font-size: var(--selo-rotulo);
  font-weight: 600;
  letter-spacing: 0.32em;
  padding-left: 0.32em;
  line-height: 1.2;
  color: var(--cor-friso, #d3b563);
  white-space: nowrap;
}

.selo-home:focus-visible {
  outline: var(--foco-espessura, 2px) solid var(--cor-sidebar-texto, #faf9f5);
  outline-offset: 2px;
}

/* Celular (mesmo ponto de quebra do resto da barra): 48px e textos menores. */
@media (max-width: 640px) {
  .selo-home {
    --selo-altura: 48px;
    --selo-templo: 30px;
    --selo-recuo: 14px;
    --selo-titulo: var(--escala-sm);
  }
}

/* Abaixo de 400px (telas de 320 a 400px): versão compacta, com altura de 44px
   e textos menores, para o selo e o ☰ caberem na mesma linha. */
@media (max-width: 400px) {
  .selo-home {
    --selo-altura: 44px;
    --selo-templo: 26px;
    --selo-recuo: 10px;
    --selo-titulo: 0.875rem;
    --selo-rotulo: 0.6875rem;
  }
}

/* Modo adaptado: pílula preta com contorno e texto brancos, o mesmo par do
   círculo Home (BotaoHome.vue). Aqui o friso vira preto, então HOME e título
   são explícitos em branco, senão o HOME sumiria sobre o fundo preto. O título
   perde a serifa, como os demais títulos do modo (base.css). */
:root[data-modo-adaptado='on'] .selo-home {
  --selo-altura: 64px;
  --selo-templo: 36px;
  --selo-recuo: 12px;
  /* Teto próprio do modo: o texto em 16px ocuparia mais de 280px numa linha
     só e espremeria a trilha até quebrá-la em muitas linhas. Com teto de
     12rem, "Caderno de Direito" quebra em duas linhas dentro da pílula. */
  max-width: 12rem;
  background: #000000;
  border-color: #ffffff;
  color: #ffffff;
}

:root[data-modo-adaptado='on'] .selo-home__traco {
  stroke: #ffffff;
}

/* 16px no mínimo nos dois textos do modo (legibilidade mínima pedida). O
   tamanho fica fixo aqui e não segue as variáveis de tamanho do selo. */
:root[data-modo-adaptado='on'] .selo-home__titulo {
  font-family: var(--fonte-texto);
  font-weight: 700;
  font-size: 1rem;
  color: #ffffff;
}

:root[data-modo-adaptado='on'] .selo-home__rotulo {
  font-size: 1rem;
  color: #ffffff;
}

@media (max-width: 640px) {
  :root[data-modo-adaptado='on'] .selo-home {
    --selo-altura: 56px;
    --selo-templo: 30px;
    --selo-recuo: 10px;
  }
}

@media print {
  .selo-home {
    display: none;
  }
}
</style>
