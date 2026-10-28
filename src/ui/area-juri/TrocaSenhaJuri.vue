<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue';
import {
  contarCaracteres,
  MINIMO_SENHA,
  validarTrocaSenhaJuri,
  type ProblemaTrocaSenhaJuri
} from '@/app/juri';
import CampoSenhaJuri from './CampoSenhaJuri.vue';

const props = defineProps<{
  ocupado: boolean;
  /** Mensagem da sessão (senha atual errada, conta alterada). */
  mensagem: string;
}>();

const emit = defineEmits<{ trocar: [atual: string, nova: string] }>();

const idBase = `juri-troca-${useId()}`;
const idAtual = `${idBase}-atual`;
const idNova = `${idBase}-nova`;
const idConfirmacao = `${idBase}-confirmacao`;
const idRegra = `${idBase}-regra`;
const idContador = `${idBase}-contador`;
const idAlerta = `${idBase}-alerta`;

const atual = ref('');
const nova = ref('');
const confirmacao = ref('');
const mostrar = ref(false);
const problemas = ref<readonly ProblemaTrocaSenhaJuri[]>([]);
const campoAtual = ref<InstanceType<typeof CampoSenhaJuri>>();
const campoNova = ref<InstanceType<typeof CampoSenhaJuri>>();
const campoConfirmacao = ref<InstanceType<typeof CampoSenhaJuri>>();

const caracteres = computed(() => contarCaracteres(nova.value));
const faltam = computed(() => Math.max(MINIMO_SENHA - caracteres.value, 0));
const textoContador = computed(() => {
  if (faltam.value === 0) return `${caracteres.value} caracteres. Mínimo atingido.`;
  const falta = faltam.value === 1 ? 'Falta 1 caractere.' : `Faltam ${faltam.value} caracteres.`;
  return `${caracteres.value} de ${MINIMO_SENHA} caracteres. ${falta}`;
});

// O leitor de tela anuncia uma vez, ao chegar ao mínimo; não a cada tecla.
const anuncio = ref('');
watch(
  () => faltam.value === 0,
  (atingiu) => {
    anuncio.value = atingiu ? `Mínimo de ${MINIMO_SENHA} caracteres atingido.` : '';
  }
);

const TEXTOS: Record<ProblemaTrocaSenhaJuri, () => string> = {
  'atual-vazia': () => 'Informe a senha atual.',
  curta: () =>
    `A nova senha precisa ter ${MINIMO_SENHA} caracteres ou mais. Você digitou ${caracteres.value}.`,
  'igual-atual': () => 'A nova senha precisa ser diferente da atual.',
  confirmacao: () => 'A confirmação não é igual à nova senha.'
};

const textoAlerta = computed(() =>
  problemas.value.length > 0 ? problemas.value.map((p) => TEXTOS[p]()).join(' ') : props.mensagem
);

function temProblema(...alvos: ProblemaTrocaSenhaJuri[]): boolean {
  return alvos.some((p) => problemas.value.includes(p));
}

function enviar(): void {
  if (props.ocupado) return;
  problemas.value = validarTrocaSenhaJuri({
    atual: atual.value,
    nova: nova.value,
    confirmacao: confirmacao.value
  });
  const primeiro = problemas.value[0];
  if (primeiro === undefined) {
    emit('trocar', atual.value, nova.value);
    return;
  }
  if (primeiro === 'atual-vazia') campoAtual.value?.focar();
  else if (primeiro === 'confirmacao') campoConfirmacao.value?.focar();
  else campoNova.value?.focar();
}
</script>

<template>
  <form class="juri-cartao" novalidate @submit.prevent="enviar">
    <h2 class="juri-cartao__titulo">Troque a senha para continuar</h2>
    <p class="juri-cartao__ajuda">
      Esta é a sua primeira entrada com a senha provisória. Escolha uma senha só sua; ela substitui
      a provisória.
    </p>

    <p v-if="textoAlerta" :id="idAlerta" class="juri-alerta" role="alert">{{ textoAlerta }}</p>

    <CampoSenhaJuri
      :id="idAtual"
      ref="campoAtual"
      v-model="atual"
      nome="senhaAtual"
      rotulo="Senha atual"
      autocomplete="current-password"
      :mostrar="mostrar"
      :invalido="temProblema('atual-vazia')"
    />

    <p :id="idRegra" class="juri-formulario__regra">
      A senha nova precisa ter {{ MINIMO_SENHA }} caracteres ou mais. Não é preciso misturar letras,
      números e símbolos: uma frase longa e fácil de lembrar serve. Maiúsculas e minúsculas fazem
      diferença.
    </p>

    <CampoSenhaJuri
      :id="idNova"
      ref="campoNova"
      v-model="nova"
      nome="senhaNova"
      rotulo="Nova senha"
      autocomplete="new-password"
      :mostrar="mostrar"
      :invalido="temProblema('curta', 'igual-atual')"
      :descrito="`${idRegra} ${idContador}`"
    />
    <p :id="idContador" class="juri-contador">{{ textoContador }}</p>
    <p class="juri-so-leitor" role="status">{{ anuncio }}</p>

    <CampoSenhaJuri
      :id="idConfirmacao"
      ref="campoConfirmacao"
      v-model="confirmacao"
      nome="confirmacao"
      rotulo="Confirmar nova senha"
      autocomplete="new-password"
      :mostrar="mostrar"
      :invalido="temProblema('confirmacao')"
    />

    <label class="juri-marcador">
      <input v-model="mostrar" type="checkbox" />
      <span>Mostrar senhas</span>
    </label>

    <button type="submit" class="juri-botao" :aria-disabled="ocupado ? 'true' : undefined">
      {{ ocupado ? 'Salvando…' : 'Salvar nova senha' }}
    </button>
  </form>
</template>
