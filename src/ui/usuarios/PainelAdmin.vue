<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue';
import {
  loginValido,
  type Administrar,
  type ClienteApi,
  type UsuarioAdmin
} from '@/app/sessao/administracao';

const props = defineProps<{
  /** Login de quem está administrando: a própria conta não tem botões de ação. */
  usuarioAtual: string;
  administrar: Administrar;
}>();

const idBase = `ar-admin-${useId()}`;
const usuarios = ref<readonly UsuarioAdmin[]>([]);
const carregando = ref(true);
const erro = ref('');
const status = ref('');
const ocupado = ref(false);
const novoUsuario = ref('');
/**
 * O link do convite vive só aqui, na memória do componente (plano 7.1.7): some em "Já enviei", na ação
 * seguinte e ao desmontar. Guarda só o caminho que o servidor deu; o endereço completo é composto com
 * `location.origin` na hora de mostrar e de copiar, e nunca vai a armazenamento, console ou barra de endereço.
 */
const blocoDoLink = ref<HTMLElement>();
const link = ref<{ usuario: string; acao: 'criar' | 'redefinir'; caminho: string } | undefined>();
const copiaAvisada = ref('');
const confirmandoExclusao = ref<string | undefined>();
const botaoCancelar = ref<HTMLButtonElement[]>();

const tituloDoLink = computed(() =>
  link.value
    ? `${link.value.acao === 'criar' ? 'Link de primeiro acesso de' : 'Link para nova senha de'} ${link.value.usuario}:`
    : ''
);
const enderecoDoLink = computed(() =>
  link.value ? `${window.location.origin}${link.value.caminho}` : ''
);

function dois(n: number): string {
  return String(n).padStart(2, '0');
}

/** Prazo do convite: o servidor manda epoch em segundos; o painel mostra dd/mm hh:mm no fuso de quem olha. */
function formatarPrazo(epochSegundos: number | null | undefined): string {
  if (typeof epochSegundos !== 'number') return '';
  const d = new Date(epochSegundos * 1000);
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)} ${dois(d.getHours())}:${dois(d.getMinutes())}`;
}

function formatarData(valor: string | null): string {
  if (!valor) return 'Nunca';
  const data = new Date(valor);
  return Number.isNaN(data.getTime())
    ? valor
    : data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

async function carregar(): Promise<void> {
  const r = await props.administrar((c) => c.listarUsuarios());
  carregando.value = false;
  if (r.ok) {
    usuarios.value = r.valor;
    erro.value = '';
  } else {
    erro.value = r.mensagem;
  }
}

/**
 * O link aparece uma vez só, e a conta pode estar numa linha baixa da lista: sem isto o bloco nasce fora da
 * janela e a pessoa não o vê. O foco vai ao bloco (tabindex -1, só por código, sem entrar na ordem de Tab) para o
 * leitor de tela anunciar o status, e a rolagem usa `nearest` com o scroll-padding que o layout já publica
 * (cabeçalho fixo e pilha inferior), sem animação: não há movimento a reduzir.
 */
async function mostrarBlocoDoLink(): Promise<void> {
  await nextTick();
  const bloco = blocoDoLink.value;
  if (!bloco) return;
  bloco.focus({ preventScroll: true });
  bloco.scrollIntoView({ block: 'nearest' });
}

async function executar(
  pedido: Parameters<ClienteApi['acaoUsuario']>[0],
  aviso: string
): Promise<void> {
  if (ocupado.value) return;
  ocupado.value = true;
  erro.value = '';
  // A ação seguinte apaga o link da anterior, venha ou não um novo convite na resposta.
  dispensarLink();
  const r = await props.administrar((c) => c.acaoUsuario(pedido));
  if (r.ok) {
    status.value = aviso;
    if (r.valor.convite && (pedido.acao === 'criar' || pedido.acao === 'redefinir')) {
      link.value = { usuario: pedido.usuario, acao: pedido.acao, caminho: r.valor.convite };
      await mostrarBlocoDoLink();
    }
    await carregar();
  } else {
    erro.value = r.mensagem;
  }
  ocupado.value = false;
}

async function criar(): Promise<void> {
  if (!loginValido(novoUsuario.value)) {
    erro.value =
      'O usuário deve ter de 3 a 32 caracteres: letras sem acento, números, ponto, hífen ou sublinhado.';
    return;
  }
  const login = novoUsuario.value;
  await executar({ acao: 'criar', usuario: login }, `Usuário ${login} criado.`);
  if (!erro.value) novoUsuario.value = '';
}

async function pedirConfirmacao(login: string): Promise<void> {
  confirmandoExclusao.value = login;
  await nextTick();
  botaoCancelar.value?.[0]?.focus();
}

async function excluir(login: string): Promise<void> {
  confirmandoExclusao.value = undefined;
  await executar({ acao: 'excluir', usuario: login }, `Usuário ${login} excluído.`);
}

async function copiar(): Promise<void> {
  if (!link.value) return;
  try {
    await navigator.clipboard.writeText(enderecoDoLink.value);
    copiaAvisada.value = 'Link copiado.';
  } catch {
    copiaAvisada.value = 'Não foi possível copiar. Selecione o link e copie à mão.';
  }
}

function dispensarLink(): void {
  link.value = undefined;
  copiaAvisada.value = '';
}

onMounted(carregar);
onBeforeUnmount(dispensarLink);
</script>

<template>
  <section class="ar-admin" aria-labelledby="ar-admin-titulo">
    <h2 id="ar-admin-titulo">Administração de usuários</h2>

    <p v-if="erro" class="ar-alerta ar-alerta--erro" role="alert">{{ erro }}</p>
    <p class="ar-visualmente-oculto" role="status" aria-live="polite">{{ status }}</p>

    <div
      v-if="link"
      ref="blocoDoLink"
      class="ar-alerta ar-alerta--aviso ar-admin__convite"
      role="status"
      tabindex="-1"
    >
      <p>{{ tituloDoLink }}</p>
      <p>
        <code class="ar-admin__link">{{ enderecoDoLink }}</code>
      </p>
      <p>Ele só aparece agora, vale por 48 horas e uma vez só. Envie por um canal privado.</p>
      <p v-if="copiaAvisada">{{ copiaAvisada }}</p>
      <div class="ar-admin__acoes-aviso">
        <button type="button" class="ar-botao" data-acao="copiar" @click="copiar">
          Copiar link
        </button>
        <button type="button" class="ar-botao" data-acao="dispensar" @click="dispensarLink">
          Já enviei
        </button>
      </div>
    </div>

    <form class="ar-cartao ar-admin__criar" novalidate @submit.prevent="criar">
      <h3>Novo usuário</h3>
      <div class="ar-campo">
        <label :for="`${idBase}-novo`">Usuário</label>
        <input
          :id="`${idBase}-novo`"
          v-model="novoUsuario"
          name="novoUsuario"
          type="text"
          autocomplete="off"
          autocapitalize="none"
          spellcheck="false"
        />
      </div>
      <button
        type="submit"
        class="ar-botao ar-botao--primario"
        :aria-disabled="ocupado ? 'true' : undefined"
      >
        Criar usuário
      </button>
    </form>

    <p v-if="carregando" role="status">Carregando usuários…</p>
    <div
      v-else
      class="ar-tabela-rolavel"
      role="region"
      aria-label="Tabela de usuários"
      tabindex="0"
    >
      <table class="ar-tabela">
        <caption>
          Usuários com acesso ao site
        </caption>
        <thead>
          <tr>
            <th scope="col">Usuário</th>
            <th scope="col">Papel</th>
            <th scope="col">Estado</th>
            <th scope="col">Último acesso</th>
            <th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in usuarios" :key="u.usuario">
            <th scope="row">{{ u.usuario }}</th>
            <td data-rotulo="Papel">{{ u.admin ? 'Administrador' : 'Participante' }}</td>
            <td data-rotulo="Estado">
              {{ u.ativo ? 'Ativo' : 'Desativado' }}
              <span v-if="u.deveTrocarSenha"> · Troca de senha pendente</span>
              <span v-if="u.convite === 'pendente'">
                · Convite pendente até {{ formatarPrazo(u.conviteExpiraEm) }}</span
              >
              <span v-else-if="u.convite === 'vencido'"> · Convite vencido</span>
            </td>
            <td data-rotulo="Último acesso">{{ formatarData(u.ultimoLogin) }}</td>
            <td data-rotulo="Ações">
              <span v-if="u.usuario === usuarioAtual">Sua conta</span>
              <template v-else>
                <div
                  v-if="confirmandoExclusao === u.usuario"
                  class="ar-admin__confirmar"
                  role="group"
                  :aria-label="`Confirmar exclusão de ${u.usuario}`"
                >
                  <p>Excluir {{ u.usuario }}? Não dá para desfazer.</p>
                  <button
                    ref="botaoCancelar"
                    type="button"
                    class="ar-botao"
                    data-acao="cancelar"
                    @click="confirmandoExclusao = undefined"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    class="ar-botao ar-botao--perigo"
                    data-acao="confirmar-exclusao"
                    @click="excluir(u.usuario)"
                  >
                    Excluir
                  </button>
                </div>
                <div v-else class="ar-admin__acoes">
                  <button
                    type="button"
                    class="ar-botao"
                    data-acao="redefinir"
                    :data-usuario="u.usuario"
                    :aria-label="`Redefinir senha de ${u.usuario}`"
                    @click="
                      executar(
                        { acao: 'redefinir', usuario: u.usuario },
                        `Senha de ${u.usuario} redefinida.`
                      )
                    "
                  >
                    Redefinir senha
                  </button>
                  <button
                    v-if="u.ativo"
                    type="button"
                    class="ar-botao"
                    data-acao="desativar"
                    :data-usuario="u.usuario"
                    :aria-label="`Desativar ${u.usuario}`"
                    @click="
                      executar(
                        { acao: 'desativar', usuario: u.usuario },
                        `Usuário ${u.usuario} desativado.`
                      )
                    "
                  >
                    Desativar
                  </button>
                  <button
                    v-else
                    type="button"
                    class="ar-botao"
                    data-acao="ativar"
                    :data-usuario="u.usuario"
                    :aria-label="`Ativar ${u.usuario}`"
                    @click="
                      executar(
                        { acao: 'ativar', usuario: u.usuario },
                        `Usuário ${u.usuario} ativado.`
                      )
                    "
                  >
                    Ativar
                  </button>
                  <button
                    type="button"
                    class="ar-botao ar-botao--perigo"
                    data-acao="excluir"
                    :data-usuario="u.usuario"
                    :aria-label="`Excluir ${u.usuario}`"
                    @click="pedirConfirmacao(u.usuario)"
                  >
                    Excluir
                  </button>
                </div>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
