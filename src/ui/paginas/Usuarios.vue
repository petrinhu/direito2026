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
const falhou = computed(() => sessao.falhou.value);
const usuario = computed(() => sessao.usuario.value);

// Sem conexão na leitura da sessão, a página não pode decidir quem é administrador:
// oferece tentar de novo em vez de ficar em "Carregando…" para sempre.
function tentarDeNovo(): void {
  void sessao.iniciar();
}
</script>

<template>
  <NaoEncontrado v-if="pronta && !admin" />
  <section v-else-if="admin" class="usuarios">
    <h1>Gerenciar usuários</h1>
    <PainelAdmin :usuario-atual="usuario" :administrar="sessao.administrar" />
  </section>
  <div v-else-if="falhou" class="usuarios__falha">
    <p role="alert">Não foi possível confirmar a sua sessão agora. Verifique a conexão.</p>
    <button type="button" class="ar-botao ar-botao--primario" @click="tentarDeNovo">
      Tentar de novo
    </button>
  </div>
  <p v-else class="usuarios__aguarde" role="status">Carregando…</p>
</template>
