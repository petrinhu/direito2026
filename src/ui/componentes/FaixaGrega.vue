<template>
  <svg class="grega" aria-hidden="true" focusable="false" preserveAspectRatio="none">
    <defs>
      <pattern id="grega-meandro" width="28" height="14" patternUnits="userSpaceOnUse">
        <path
          d="M1 13 V1 H13 V9 H5 V5 M15 13 V1 H27 V9 H19 V5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.25"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grega-meandro)" />
  </svg>
</template>

<style scoped>
/* Grega: uma faixa só, separa a abertura do conteúdo. */
.grega {
  display: block;
  width: 100%;
  height: 14px;
  margin: clamp(2rem, 4vw, 3rem) 0 0;
  color: var(--cor-acento);
}

:root[data-modo-adaptado='on'] .grega {
  display: none;
}
</style>
