<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import CampoSenhaJuri from './CampoSenhaJuri.vue';

const props = defineProps<{
  ocupado: boolean;
  /** Mensagem da sessão (senha errada, limite, conta alterada). */
  mensagem: string;
}>();

const emit = defineEmits<{ destravar: [senha: string] }>();

const idBase = `juri-destravar-${useId()}`;
const idSenha = `${idBase}-senha`;
const idAlerta = `${idBase}-alerta`;

const senha = ref('');
const mostrarSenha = ref(false);
const erroLocal = ref('');
const campoSenha = ref<InstanceType<typeof CampoSenhaJuri>>();

const textoAlerta = computed(() => erroLocal.value || props.mensagem);
const invalido = computed(() => textoAlerta.value !== '');
const rotuloBotao = computed(() => (props.ocupado ? 'Destravando…' : 'Destravar'));

function enviar(): void {
  if (props.ocupado) return;
  erroLocal.value = '';
  if (senha.value.length === 0) {
    erroLocal.value = 'Informe a senha.';
    campoSenha.value?.focar();
    return;
  }
  emit('destravar', senha.value);
}
</script>

<template>
  <form class="juri-cartao" novalidate @submit.prevent="enviar">
    <h2 class="juri-cartao__titulo">Destravar</h2>
    <p class="juri-cartao__ajuda">
      O conteúdo sai da memória ao recarregar a página. Digite a senha para liberá-lo de novo.
    </p>

    <p v-if="textoAlerta" :id="idAlerta" class="juri-alerta" role="alert">{{ textoAlerta }}</p>

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
