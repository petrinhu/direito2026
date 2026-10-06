<script setup lang="ts">
import { computed, ref, useId } from 'vue';

const props = defineProps<{
  ocupado: boolean;
  /** Segundos restantes de espera imposta pelo servidor (0 = livre). */
  segundosEspera: number;
  /** Mensagem do servidor ou da sessão (erro de login, sem conexão...). */
  mensagem: string;
}>();

const emit = defineEmits<{ entrar: [usuario: string, senha: string] }>();

const idBase = `ar-entrada-${useId()}`;
const idUsuario = `${idBase}-usuario`;
const idSenha = `${idBase}-senha`;
const idAlerta = `${idBase}-alerta`;

const usuario = ref('');
const senha = ref('');
const mostrarSenha = ref(false);
const erroLocal = ref('');
const campoUsuario = ref<HTMLInputElement>();
const campoSenha = ref<HTMLInputElement>();

const textoAlerta = computed(() => erroLocal.value || props.mensagem);
const bloqueado = computed(() => props.ocupado || props.segundosEspera > 0);
const rotuloBotao = computed(() => {
  if (props.segundosEspera > 0) return `Aguarde ${props.segundosEspera} s`;
  return props.ocupado ? 'Entrando…' : 'Entrar';
});

function enviar(): void {
  if (bloqueado.value) return;
  erroLocal.value = '';
  if (usuario.value.length === 0) {
    erroLocal.value = 'Informe o usuário.';
    campoUsuario.value?.focus();
    return;
  }
  if (senha.value.length === 0) {
    erroLocal.value = 'Informe a senha.';
    campoSenha.value?.focus();
    return;
  }
  emit('entrar', usuario.value, senha.value);
}
</script>

<template>
  <form class="ar-cartao ar-formulario" novalidate @submit.prevent="enviar">
    <h2 class="ar-formulario__titulo">Entrar</h2>
    <p class="ar-formulario__ajuda">
      Acesso só para os integrantes do grupo. Use o usuário e a senha que você recebeu. Maiúsculas e
      minúsculas fazem diferença.
    </p>

    <p v-if="textoAlerta" :id="idAlerta" class="ar-alerta ar-alerta--erro" role="alert">
      {{ textoAlerta }}
    </p>

    <div class="ar-campo">
      <label :for="idUsuario">Usuário</label>
      <input
        :id="idUsuario"
        ref="campoUsuario"
        v-model="usuario"
        name="usuario"
        type="text"
        autocomplete="username"
        autocapitalize="none"
        autocorrect="off"
        spellcheck="false"
        inputmode="text"
        :aria-describedby="textoAlerta ? idAlerta : undefined"
        :aria-invalid="textoAlerta ? 'true' : undefined"
      />
    </div>

    <div class="ar-campo">
      <label :for="idSenha">Senha</label>
      <input
        :id="idSenha"
        ref="campoSenha"
        v-model="senha"
        name="senha"
        :type="mostrarSenha ? 'text' : 'password'"
        autocomplete="current-password"
        autocapitalize="none"
        autocorrect="off"
        spellcheck="false"
        :aria-describedby="textoAlerta ? idAlerta : undefined"
        :aria-invalid="textoAlerta ? 'true' : undefined"
      />
    </div>

    <label class="ar-marcador">
      <input v-model="mostrarSenha" type="checkbox" />
      <span>Mostrar senha</span>
    </label>

    <button
      type="submit"
      class="ar-botao ar-botao--primario"
      :aria-disabled="bloqueado ? 'true' : undefined"
    >
      {{ rotuloBotao }}
    </button>
  </form>
</template>
