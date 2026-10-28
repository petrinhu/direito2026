<script setup lang="ts">
defineProps<{ fontes: readonly string[] }>();
</script>

<template>
  <p v-if="fontes.length > 0" class="juri-fontes">Fontes: {{ fontes.join('; ') }}</p>
</template>
