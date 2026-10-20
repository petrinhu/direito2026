<script setup lang="ts">
// Atalho para a página inicial (ordem do líder, 20/10/2026). O LayoutBase decide
// quando mostrar (nunca na própria home) e o põe na pilha inferior; aqui fica só
// o link, o desenho e o estilo. O desenho é uma miniatura da fachada do templo
// (FachadaTemplo.vue), sem animação e decorativo: o nome vem do aria-label.
</script>

<template>
  <a href="/" class="botao-home" aria-label="Home, página inicial">
    <span class="botao-home__circulo">
      <svg class="botao-home__svg" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <g class="botao-home__traco">
          <path d="M6 18 L24 7 L42 18 Z" />
          <path d="M6 18 H42 V21 H6 Z" />
          <path d="M11 23 V35 M19 23 V35 M29 23 V35 M37 23 V35" />
          <path d="M8 35 H40 V38 H8 Z" />
          <path d="M5 38 H43 V42 H5 Z" />
        </g>
      </svg>
    </span>
    <span class="botao-home__rotulo">Home</span>
  </a>
</template>

<style scoped>
.botao-home {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: var(--esp-1, 0.25rem);
  min-width: 44px;
  min-height: 44px;
  color: var(--cor-texto, #1c1c1c);
  text-decoration: none;
}

.botao-home__circulo {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 2px solid transparent;
  background: var(--cor-sidebar-fundo, #0d2440);
  box-shadow: var(--sombra-elevada, 0 8px 24px rgba(13, 36, 64, 0.12));
}

.botao-home__svg {
  display: block;
  width: 40px;
  height: 40px;
  overflow: visible;
}

/* Traço em espessura de tela (não escala com o desenho), dourado do friso. */
.botao-home__traco {
  fill: none;
  stroke: var(--cor-friso, #d3b563);
  stroke-width: 1.5px;
  stroke-linecap: square;
  stroke-linejoin: miter;
}

.botao-home__traco path {
  vector-effect: non-scaling-stroke;
}

/* Rótulo sobre fundo elevado: o texto continua legível quando a página rola
   por baixo dele (mesmo par do quadro de contagem, já medido). */
.botao-home__rotulo {
  padding: 0 var(--esp-2, 0.5rem);
  border-radius: 999px;
  background: var(--cor-fundo-elevado, #ffffff);
  color: var(--cor-texto, #1c1c1c);
  font-size: var(--escala-xs, 0.8125rem);
  font-weight: 600;
  line-height: 1.4;
}

.botao-home:hover .botao-home__rotulo {
  text-decoration: underline;
}

.botao-home:focus-visible {
  outline: var(--foco-espessura, 2px) solid var(--cor-foco, #163a5f);
  outline-offset: var(--foco-deslocamento, 2px);
}

/* Tema escuro: o círculo já é escuro; a borda dourada separa do fundo escuro.
   Vale pela escolha manual (data-theme) e pela preferência do sistema, sem
   data-theme="light". */
:root[data-theme='dark'] .botao-home__circulo {
  border-color: var(--cor-friso, #d3b563);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) .botao-home__circulo {
    border-color: var(--cor-friso, #d3b563);
  }
}

/* Modo adaptado: círculo preto com traço branco e rótulo de 24px. Explícito
   aqui porque os tokens do modo trocam o azul pelo branco e o friso pelo preto. */
:root[data-modo-adaptado='on'] .botao-home__circulo {
  background: #000000;
  border-color: #ffffff;
}

:root[data-modo-adaptado='on'] .botao-home__traco {
  stroke: #ffffff;
}

:root[data-modo-adaptado='on'] .botao-home__rotulo {
  background: #ffffff;
  color: #000000;
  font-size: 1.5rem;
}

@media print {
  .botao-home {
    display: none;
  }
}
</style>
