<script setup lang="ts">
import { inject, ref } from 'vue';
import { CHAVE_SESSAO } from '@/app/chaves';
import '../area-restrita/estilo.css';
import FormularioTrocaSenha from '@/ui/area-restrita/FormularioTrocaSenha.vue';

// Trocar senha (ordem do líder, LU-F3.2): para todo usuário logado, pelo menu.
const sessao = inject(CHAVE_SESSAO)!;
const ocupado = ref(false);
const mensagem = ref('');
const aviso = ref('');
// Trocar a chave remonta o formulário: os campos com a senha antiga somem da tela.
const versao = ref(0);

async function trocar(atual: string, nova: string): Promise<void> {
  if (ocupado.value) return;
  ocupado.value = true;
  mensagem.value = '';
  aviso.value = '';
  const r = await sessao.trocarSenha(atual, nova);
  ocupado.value = false;
  if (r.ok) {
    aviso.value = 'Senha trocada. A nova senha vale a partir de agora.';
    versao.value += 1;
  } else {
    mensagem.value = r.mensagem;
  }
}
</script>

<template>
  <section class="conta">
    <h1>Trocar senha</h1>
    <p v-if="aviso" class="conta__aviso" role="status">{{ aviso }}</p>
    <FormularioTrocaSenha :key="versao" :ocupado="ocupado" :mensagem="mensagem" @trocar="trocar" />
  </section>
</template>
