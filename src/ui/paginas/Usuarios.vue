<script setup lang="ts">
import { computed, inject } from 'vue';
import { CHAVE_SESSAO } from '@/app/chaves';
import '../area-restrita/estilo.css';
import PainelAdmin from '@/ui/usuarios/PainelAdmin.vue';
import NaoEncontrado from './NaoEncontrado.vue';

// Gerenciar usuários (ordem do líder, LU-F3.2): só administrador. Quem não é recebe a
// mesma tela de não encontrado; o servidor (usuarios.php) recusa a chamada com 403 de todo jeito.
const sessao = inject(CHAVE_SESSAO)!;
const pronta = computed(() => sessao.pronta.value);
const admin = computed(() => sessao.admin.value);
const usuario = computed(() => sessao.usuario.value);
</script>

<template>
  <NaoEncontrado v-if="pronta && !admin" />
  <section v-else-if="admin" class="usuarios">
    <h1>Gerenciar usuários</h1>
    <PainelAdmin :usuario-atual="usuario" :administrar="sessao.administrar" />
  </section>
  <p v-else class="usuarios__aguarde" role="status">Carregando…</p>
</template>
