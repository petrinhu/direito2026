<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import CampoSenhaJuri from './CampoSenhaJuri.vue';

const props = defineProps<{
  ocupado: boolean;
  /** Mensagem da sessão (credenciais, limite, sem conexão). */
  mensagem: string;
}>();

const emit = defineEmits<{ entrar: [usuario: string, senha: string] }>();

const idBase = `juri-entrada-${useId()}`;
const idUsuario = `${idBase}-usuario`;
const idSenha = `${idBase}-senha`;
const idAlerta = `${idBase}-alerta`;

const usuario = ref('');
const senha = ref('');
const mostrarSenha = ref(false);
const erroLocal = ref('');
const campoUsuario = ref<HTMLInputElement>();
const campoSenha = ref<InstanceType<typeof CampoSenhaJuri>>();

const textoAlerta = computed(() => erroLocal.value || props.mensagem);
const invalido = computed(() => textoAlerta.value !== '');
const rotuloBotao = computed(() => (props.ocupado ? 'Entrando…' : 'Entrar'));

function enviar(): void {
  if (props.ocupado) return;
  erroLocal.value = '';
  if (usuario.value.length === 0) {
    erroLocal.value = 'Informe o usuário.';
    campoUsuario.value?.focus();
    return;
  }
  if (senha.value.length === 0) {
    erroLocal.value = 'Informe a senha.';
    campoSenha.value?.focar();
    return;
  }
  emit('entrar', usuario.value, senha.value);
}
</script>

<template>
  <form class="juri-cartao" novalidate @submit.prevent="enviar">
    <h2 class="juri-cartao__titulo">Entrar</h2>
    <p class="juri-cartao__ajuda">
      Área de acesso restrito. Maiúsculas e minúsculas fazem diferença.
    </p>

    <p v-if="textoAlerta" :id="idAlerta" class="juri-alerta" role="alert">{{ textoAlerta }}</p>

    <div class="juri-campo">
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
        :aria-describedby="invalido ? idAlerta : undefined"
        :aria-invalid="invalido ? 'true' : undefined"
      />
    </div>

    <CampoSenhaJuri
      :id="idSenha"
      ref="campoSenha"
      v-model="senha"
      nome="senha"
      rotulo="Senha"
      autocomplete="current-password"
      :mostrar="mostrarSenha"
      :invalido="invalido"
      :descrito="invalido ? idAlerta : undefined"
    />

    <label class="juri-marcador">
      <input v-model="mostrarSenha" type="checkbox" />
      <span>Mostrar senha</span>
    </label>

    <button type="submit" class="juri-botao" :aria-disabled="ocupado ? 'true' : undefined">
      {{ rotuloBotao }}
    </button>
  </form>
</template>
