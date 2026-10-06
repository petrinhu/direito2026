<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  tamanho?: 'pequeno' | 'grande';
  /** Só para teste: mapa de arquivos no lugar do que o Vite encontrou na pasta. */
  arquivos?: Readonly<Record<string, string>>;
}>();

/**
 * O emblema é opcional: as seis imagens (AVIF, WebP e JPEG em 320 e 640 px,
 * sem metadados) entram em ./emblema/ e são encontradas aqui sem mudar
 * código. Sem elas, o componente não desenha nada e a splash segue só com
 * o texto.
 */
const encontrados = import.meta.glob<string>('./emblema/*.{avif,webp,jpg}', {
  eager: true,
  query: '?url',
  import: 'default'
});

function achar(nome: string): string | undefined {
  return (props.arquivos ?? encontrados)[`./emblema/${nome}`];
}

const jpg320 = computed(() => achar('emblema-320.jpg'));
const jpg640 = computed(() => achar('emblema-640.jpg'));
const srcset = (ext: 'avif' | 'webp'): string | undefined => {
  const a = achar(`emblema-320.${ext}`);
  const b = achar(`emblema-640.${ext}`);
  return a && b ? `${a} 320w, ${b} 640w` : undefined;
};
const avif = computed(() => srcset('avif'));
const webp = computed(() => srcset('webp'));
</script>

<template>
  <picture v-if="jpg320 && jpg640" class="ar-emblema">
    <source v-if="avif" type="image/avif" :srcset="avif" sizes="(min-width: 720px) 320px, 60vw" />
    <source v-if="webp" type="image/webp" :srcset="webp" sizes="(min-width: 720px) 320px, 60vw" />
    <img
      :src="jpg320"
      :srcset="`${jpg320} 320w, ${jpg640} 640w`"
      sizes="(min-width: 720px) 320px, 60vw"
      width="320"
      height="320"
      alt="Emblema do grupo: círculo escuro com moldura dourada, uma figura de inteligência artificial com o selo AI à esquerda, um homem de terno saindo de um escritório com uma caixa de pertences à direita, a balança da justiça e dois livros de Direito do Trabalho e Constituição Federal, sob o nome Fronteiras da Inteligência Artificial."
      decoding="async"
      :fetchpriority="tamanho === 'pequeno' ? 'low' : 'high'"
    />
  </picture>
</template>
