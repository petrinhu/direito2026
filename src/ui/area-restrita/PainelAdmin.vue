<script setup lang="ts">
import { nextTick, onMounted, ref, useId } from 'vue';
import { loginValido, type Administrar, type ClienteApi, type UsuarioAdmin } from '@/app/restrito';

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
const provisoriaEscolhida = ref('');
const provisoria = ref<{ usuario: string; senha: string } | undefined>();
const copiaAvisada = ref('');
const confirmandoExclusao = ref<string | undefined>();
const botaoCancelar = ref<HTMLButtonElement[]>();

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

async function executar(
  pedido: Parameters<ClienteApi['acaoUsuario']>[0],
  aviso: string
): Promise<void> {
  if (ocupado.value) return;
  ocupado.value = true;
  erro.value = '';
  const r = await props.administrar((c) => c.acaoUsuario(pedido));
  if (r.ok) {
    status.value = aviso;
    copiaAvisada.value = '';
    if (r.valor.senhaProvisoria) {
      provisoria.value = { usuario: pedido.usuario, senha: r.valor.senhaProvisoria };
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
  const escolhida = provisoriaEscolhida.value;
  await executar(
    { acao: 'criar', usuario: login, ...(escolhida ? { senhaProvisoria: escolhida } : {}) },
    `Usuário ${login} criado.`
  );
  if (!erro.value) {
    novoUsuario.value = '';
    provisoriaEscolhida.value = '';
  }
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
  if (!provisoria.value) return;
  try {
    await navigator.clipboard.writeText(provisoria.value.senha);
    copiaAvisada.value = 'Senha copiada.';
  } catch {
    copiaAvisada.value = 'Não foi possível copiar. Selecione a senha e copie à mão.';
  }
}

function dispensarProvisoria(): void {
  provisoria.value = undefined;
  copiaAvisada.value = '';
}

onMounted(carregar);
</script>

<template>
  <section class="ar-admin" aria-labelledby="ar-admin-titulo">
    <h2 id="ar-admin-titulo">Administração de usuários</h2>

    <p v-if="erro" class="ar-alerta ar-alerta--erro" role="alert">{{ erro }}</p>
    <p class="ar-visualmente-oculto" role="status" aria-live="polite">{{ status }}</p>

    <div v-if="provisoria" class="ar-alerta ar-alerta--aviso ar-admin__provisoria" role="status">
      <p>
        Senha provisória de <strong>{{ provisoria.usuario }}</strong
        >: <code class="ar-admin__senha">{{ provisoria.senha }}</code>
      </p>
      <p>
        Ela só aparece agora. Quem entrar com ela precisará trocá-la no primeiro acesso. Envie por
        um canal privado.
      </p>
      <p v-if="copiaAvisada">{{ copiaAvisada }}</p>
      <div class="ar-admin__acoes-aviso">
        <button type="button" class="ar-botao" data-acao="copiar" @click="copiar">
          Copiar senha
        </button>
        <button type="button" class="ar-botao" data-acao="dispensar" @click="dispensarProvisoria">
          Já anotei
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
      <div class="ar-campo">
        <label :for="`${idBase}-prov`">Senha provisória (opcional)</label>
        <input
          :id="`${idBase}-prov`"
          v-model="provisoriaEscolhida"
          name="provisoriaEscolhida"
          type="text"
          autocomplete="off"
          autocapitalize="none"
          spellcheck="false"
          :aria-describedby="`${idBase}-prov-ajuda`"
        />
        <p :id="`${idBase}-prov-ajuda`" class="ar-formulario__regra">
          Em branco, o servidor gera uma senha de 12 caracteres e mostra uma vez.
        </p>
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
          Usuários com acesso à área restrita
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
            <td>{{ u.admin ? 'Administrador' : 'Participante' }}</td>
            <td>
              {{ u.ativo ? 'Ativo' : 'Desativado' }}
              <span v-if="u.deveTrocarSenha"> · Troca de senha pendente</span>
            </td>
            <td>{{ formatarData(u.ultimoLogin) }}</td>
            <td>
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
