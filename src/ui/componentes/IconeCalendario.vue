<script setup lang="ts"></script>

<template>
  <svg
    class="icone-calendario"
    viewBox="0 0 24 24"
    width="18"
    height="18"
    aria-hidden="true"
    focusable="false"
  >
    <rect
      x="3"
      y="4.5"
      width="18"
      height="16"
      rx="2"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
    />
    <path
      d="M3 9.5h18M8 3v3M16 3v3"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
    />
  </svg>
</template>

<style scoped>
.icone-calendario {
  flex-shrink: 0;
  margin-right: var(--esp-2, 0.5rem);
}
</style>
