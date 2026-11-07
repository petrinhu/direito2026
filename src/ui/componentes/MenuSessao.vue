<script setup lang="ts">
import { RouterLink } from 'vue-router';

/**
 * Bloco da conta no topo da barra lateral (ordem do líder, LU-F3.2): Gerenciar
 * usuários só para administrador; Trocar senha e Sair para todo usuário logado.
 * Fica fora da árvore do currículo, como o Calendário (T21).
 */
defineProps<{
  admin: boolean;
  caminhoAtual: string;
}>();

const emit = defineEmits<{ sair: [] }>();
</script>

<template>
  <ul class="menu-curriculo__sessao">
    <li v-if="admin">
      <RouterLink
        to="/usuarios"
        class="menu-curriculo__link-unidade"
        :aria-current="caminhoAtual === 'usuarios' ? 'page' : undefined"
      >
        Gerenciar usuários
      </RouterLink>
    </li>
    <li>
      <RouterLink
        to="/conta"
        class="menu-curriculo__link-unidade"
        :aria-current="caminhoAtual === 'conta' ? 'page' : undefined"
      >
        Trocar senha
      </RouterLink>
    </li>
    <li>
      <button
        type="button"
        class="menu-curriculo__link-unidade menu-curriculo__sair"
        @click="emit('sair')"
      >
        Sair
      </button>
    </li>
  </ul>
</template>
