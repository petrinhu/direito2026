<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import {
  LIMITE_MAXIMO_SENHA,
  LIMITE_MINIMO_SENHA,
  validarTrocaDeSenha,
  type ProblemaSenha
} from '@/app/restrito';

const props = defineProps<{
  ocupado: boolean;
  /** Mensagem do servidor (senha atual errada, senha fraca...). */
  mensagem: string;
}>();

const emit = defineEmits<{ trocar: [atual: string, nova: string] }>();

const idBase = `ar-troca-${useId()}`;
const idAtual = `${idBase}-atual`;
const idNova = `${idBase}-nova`;
const idConfirmacao = `${idBase}-confirmacao`;
const idRegra = `${idBase}-regra`;
const idAlerta = `${idBase}-alerta`;

const atual = ref('');
const nova = ref('');
const confirmacao = ref('');
const mostrar = ref(false);
const problemas = ref<readonly ProblemaSenha[]>([]);
const campoAtual = ref<HTMLInputElement>();
const campoNova = ref<HTMLInputElement>();
const campoConfirmacao = ref<HTMLInputElement>();

const TEXTOS: Record<ProblemaSenha, string> = {
  'atual-vazia': 'Informe a senha atual.',
  curta: `A nova senha precisa ter pelo menos ${LIMITE_MINIMO_SENHA} caracteres.`,
  longa: `A nova senha pode ter no máximo ${LIMITE_MAXIMO_SENHA} caracteres.`,
  confirmacao: 'A confirmação não é igual à nova senha.',
  'igual-atual': 'A nova senha precisa ser diferente da atual.'
};

const textoAlerta = computed(() =>
  problemas.value.length > 0 ? problemas.value.map((p) => TEXTOS[p]).join(' ') : props.mensagem
);
const tipo = computed(() => (mostrar.value ? 'text' : 'password'));
const invalido = (...alvos: ProblemaSenha[]): 'true' | undefined =>
  alvos.some((p) => problemas.value.includes(p)) ? 'true' : undefined;

function enviar(): void {
  if (props.ocupado) return;
  const achados = validarTrocaDeSenha({
    atual: atual.value,
    nova: nova.value,
    confirmacao: confirmacao.value
  });
  problemas.value = achados;
  if (achados.length > 0) {
    const primeiro = achados[0];
    if (primeiro === 'atual-vazia') campoAtual.value?.focus();
    else if (primeiro === 'confirmacao') campoConfirmacao.value?.focus();
    else campoNova.value?.focus();
    return;
  }
  emit('trocar', atual.value, nova.value);
}
</script>

<template>
  <form class="ar-cartao ar-formulario" novalidate @submit.prevent="enviar">
    <h2 class="ar-formulario__titulo">Troque a senha para continuar</h2>
    <p class="ar-formulario__ajuda">
      Esta é a sua primeira entrada com uma senha provisória. Escolha uma senha só sua; ela
      substitui a provisória.
    </p>

    <p v-if="textoAlerta" :id="idAlerta" class="ar-alerta ar-alerta--erro" role="alert">
      {{ textoAlerta }}
    </p>

    <div class="ar-campo">
      <label :for="idAtual">Senha atual</label>
      <input
        :id="idAtual"
        ref="campoAtual"
        v-model="atual"
        name="senhaAtual"
        :type="tipo"
        autocomplete="current-password"
        autocapitalize="none"
        spellcheck="false"
        :aria-invalid="invalido('atual-vazia')"
      />
    </div>

    <div class="ar-campo">
      <label :for="idNova">Nova senha</label>
      <input
        :id="idNova"
        ref="campoNova"
        v-model="nova"
        name="senhaNova"
        :type="tipo"
        autocomplete="new-password"
        autocapitalize="none"
        spellcheck="false"
        :aria-describedby="idRegra"
        :aria-invalid="invalido('curta', 'longa', 'igual-atual')"
      />
      <p :id="idRegra" class="ar-formulario__regra">
        A nova senha deve ter de {{ LIMITE_MINIMO_SENHA }} a {{ LIMITE_MAXIMO_SENHA }} caracteres.
        Não é preciso misturar letras, números e símbolos: uma frase longa e fácil de lembrar serve.
        Maiúsculas e minúsculas fazem diferença.
      </p>
    </div>

    <div class="ar-campo">
      <label :for="idConfirmacao">Confirmar nova senha</label>
      <input
        :id="idConfirmacao"
        ref="campoConfirmacao"
        v-model="confirmacao"
        name="confirmacao"
        :type="tipo"
        autocomplete="new-password"
        autocapitalize="none"
        spellcheck="false"
        :aria-invalid="invalido('confirmacao')"
      />
    </div>

    <label class="ar-marcador">
      <input v-model="mostrar" type="checkbox" />
      <span>Mostrar senhas</span>
    </label>

    <button
      type="submit"
      class="ar-botao ar-botao--primario"
      :aria-disabled="ocupado ? 'true' : undefined"
    >
      {{ ocupado ? 'Salvando…' : 'Salvar nova senha' }}
    </button>
  </form>
</template>
