/**
 * Sessão da área da Júri no navegador: a máquina de estados que junta o cliente da API
 * com a cifra. A CEK (chave que abre as imagens) vive SÓ numa closure, em memória. Não
 * vai para ref (o proxy reativo estraga o CryptoKey) nem para armazenamento do navegador.
 * Recarregar a página cai em 'travada': a sessão continua no servidor, mas a CEK só
 * volta com a senha de novo (destravar).
 */
import { ref } from 'vue';
import { aadDoEmbrulho } from '@/core/juri/aadEmbrulho';
import { base64ParaBytes, bytesParaBase64, bytesParaBase64Url } from '@/core/juri/base64';
import {
  ErroCifra,
  ITERACOES_PBKDF2,
  TAMANHO_SALT,
  decifrarImagem as decifrarImagemCifrada,
  derivar,
  desembrulharCek,
  embrulharCek,
  type DerivacaoUsuario,
  type Embrulho,
  type ImagemDecifrada
} from '@/core/juri/cifra';
import { MINIMO_SENHA, senhasIguais, validarSenhaNova } from '@/core/juri/senha';
import { ErroDeApi, type ClienteJuri, type RespostaSal } from './clienteJuri';

/** CryptoKey do WebCrypto. Alias local porque o lint do projeto não conhece o tipo global. */
type ChaveAesGcm = globalThis.CryptoKey;

/** Versão do contrato do sal.php (v: 1). Qualquer outra é recusada antes de derivar. */
const VERSAO_CONTRATO = 1;

export type FaseSessaoJuri = 'carregando' | 'deslogado' | 'travada' | 'troca-pendente' | 'aberta';

export class ErroSessaoJuri extends Error {
  readonly codigo: 'sem-chave';

  constructor(codigo: 'sem-chave') {
    super(`juri-sessao: ${codigo}`);
    this.name = 'ErroSessaoJuri';
    this.codigo = codigo;
  }
}

const MENSAGEM_SESSAO_ACABOU = 'Sua sessão terminou. Entre de novo.';
const MENSAGEM_REDE = 'Sem conexão com o servidor. Verifique a internet e tente de novo.';
const MENSAGEM_SERVIDOR = 'Algo deu errado no servidor. Tente de novo em instantes.';
const MENSAGEM_CONTA_ALTERADA = 'A conta mudou em outro aparelho. Entre de novo.';
const MENSAGEM_CONTEUDO = 'Não foi possível abrir o conteúdo. Avise quem administra o grupo.';
const MENSAGEM_LOGIN = 'Usuário ou senha incorretos.';
const MENSAGEM_SENHA = 'A senha não confere.';
const MENSAGEM_SENHA_ATUAL = 'A senha atual não confere.';
const MENSAGEM_SENHA_REPETIDA = 'A nova senha precisa ser diferente da atual.';
const MENSAGEM_SAIDA_SEM_SERVIDOR =
  'Sessão encerrada neste aparelho. O servidor não confirmou: verifique a conexão.';

function mensagemDeAguarde(segundos: number): string {
  const texto = segundos === 1 ? '1 segundo' : `${segundos} segundos`;
  return `Muitas tentativas. Aguarde ${texto} para tentar de novo.`;
}

function gerarSalt(): Uint8Array<ArrayBuffer> {
  const salt = new Uint8Array(TAMANHO_SALT);
  globalThis.crypto.getRandomValues(salt);
  return salt;
}

/** Salt do sal.php, só se os parâmetros forem os do contrato. Fail closed: nunca deriva com iter do servidor. */
function saltDeResposta(resposta: RespostaSal): Uint8Array<ArrayBuffer> {
  if (resposta.v !== VERSAO_CONTRATO || resposta.iter !== ITERACOES_PBKDF2) {
    throw new ErroDeApi(200, 'resposta-invalida');
  }
  const salt = base64ParaBytes(resposta.salt);
  if (salt.byteLength !== TAMANHO_SALT) {
    throw new ErroDeApi(200, 'resposta-invalida');
  }
  return salt;
}

/** Desembrulha com a senha atual. Senha errada vira null; qualquer outra falha sobe. */
async function desembrulharComSenhaAtual(
  embrulho: Embrulho,
  kek: DerivacaoUsuario['kek'],
  aad: Uint8Array<ArrayBuffer>
): Promise<ChaveAesGcm | null> {
  try {
    return await desembrulharCek(embrulho, kek, aad, { extraivel: true });
  } catch (erro) {
    if (erro instanceof ErroCifra && erro.codigo === 'integridade') return null;
    throw erro;
  }
}

export interface OpcoesSessaoJuri {
  readonly cliente: ClienteJuri;
}

/**
 * Estado da área da Júri. Fases: carregando (sondando o servidor), deslogado, travada
 * (sessão no servidor, sem CEK), troca-pendente (embrulho em memória, sem CEK, a troca
 * precisa dele) e aberta (CEK em memória).
 */
export function criarSessaoJuri({ cliente }: OpcoesSessaoJuri) {
  const fase = ref<FaseSessaoJuri>('carregando');
  const usuario = ref('');
  const mensagem = ref('');
  const ocupado = ref(false);

  let cek: ChaveAesGcm | undefined;
  let embrulhoAtual: Embrulho | undefined;
  let deveTrocar = false;

  function esquecerChaves(): void {
    cek = undefined;
    embrulhoAtual = undefined;
    deveTrocar = false;
  }

  function encerrarLocal(): void {
    esquecerChaves();
    usuario.value = '';
    fase.value = 'deslogado';
  }

  /**
   * Erro comum às chamadas. 401 de senha (credenciais, senha-atual) só mostra mensagem:
   * a sessão continua válida. Qualquer outro 401 é sessão perdida: zera a CEK.
   */
  function tratar(erro: unknown, mensagemDeSenha: string): void {
    if (!(erro instanceof ErroDeApi)) {
      mensagem.value = MENSAGEM_SERVIDOR;
      return;
    }
    if (erro.codigo === 'rede') {
      mensagem.value = MENSAGEM_REDE;
      return;
    }
    if (erro.codigo === 'senha-repetida') {
      mensagem.value = MENSAGEM_SENHA_REPETIDA;
      return;
    }
    if (erro.status === 401) {
      if (erro.codigo === 'credenciais' || erro.codigo === 'senha-atual') {
        mensagem.value = mensagemDeSenha;
        return;
      }
      encerrarLocal();
      mensagem.value = MENSAGEM_SESSAO_ACABOU;
      return;
    }
    if (erro.status === 429) {
      mensagem.value = mensagemDeAguarde(erro.segundos ?? 0);
      return;
    }
    if (erro.codigo === 'conta-alterada') {
      mensagem.value = MENSAGEM_CONTA_ALTERADA;
      return;
    }
    mensagem.value = MENSAGEM_SERVIDOR;
  }

  async function executar(operacao: () => Promise<boolean>): Promise<boolean> {
    ocupado.value = true;
    try {
      return await operacao();
    } finally {
      ocupado.value = false;
    }
  }

  async function buscarSalt(login: string): Promise<Uint8Array<ArrayBuffer>> {
    return saltDeResposta(await cliente.sal(login));
  }

  /** Sonda o servidor ao abrir a página: com sessão válida vira travada, sem CEK. */
  async function iniciar(): Promise<void> {
    fase.value = 'carregando';
    try {
      const sessao = await cliente.sessao();
      if (!sessao.autenticado || sessao.usuario === null) {
        encerrarLocal();
        return;
      }
      usuario.value = sessao.usuario;
      deveTrocar = sessao.deveTrocarSenha === true;
      fase.value = 'travada';
    } catch (erro) {
      encerrarLocal();
      tratar(erro, MENSAGEM_LOGIN);
    }
  }

  function entrar(login: string, senha: string): Promise<boolean> {
    return executar(async () => {
      try {
        const salt = await buscarSalt(login);
        const derivacao = await derivar(senha, salt);
        const resposta = await cliente.entrar(login, bytesParaBase64Url(derivacao.auth));
        const chave = resposta.deveTrocarSenha
          ? undefined
          : await desembrulharCek(
              resposta.embrulho,
              derivacao.kek,
              aadDoEmbrulho(resposta.usuario, salt)
            );
        usuario.value = resposta.usuario;
        deveTrocar = resposta.deveTrocarSenha;
        embrulhoAtual = resposta.embrulho;
        cek = chave;
        fase.value = chave ? 'aberta' : 'troca-pendente';
        mensagem.value = '';
        return true;
      } catch (erro) {
        if (erro instanceof ErroCifra) {
          mensagem.value = MENSAGEM_CONTEUDO;
          return false;
        }
        tratar(erro, MENSAGEM_LOGIN);
        return false;
      }
    });
  }

  function destravar(senha: string): Promise<boolean> {
    return executar(async () => {
      if (fase.value !== 'travada') return false;
      const login = usuario.value;
      try {
        const salt = await buscarSalt(login);
        const derivacao = await derivar(senha, salt);
        const resposta = await cliente.destravar(bytesParaBase64Url(derivacao.auth));
        const chave = deveTrocar
          ? undefined
          : await desembrulharCek(resposta.embrulho, derivacao.kek, aadDoEmbrulho(login, salt));
        embrulhoAtual = resposta.embrulho;
        cek = chave;
        fase.value = chave ? 'aberta' : 'troca-pendente';
        mensagem.value = '';
        return true;
      } catch (erro) {
        if (erro instanceof ErroCifra) {
          mensagem.value = MENSAGEM_CONTEUDO;
          return false;
        }
        tratar(erro, MENSAGEM_SENHA);
        return false;
      }
    });
  }

  /**
   * Troca de senha: deriva com a senha atual, desembrulha a CEK como extraível SÓ aqui,
   * sorteia salt novo, reembrulha com a KEK nova e manda ao servidor. Depois do sucesso
   * troca o handle em memória por um não extraível, desembrulhado do embrulho novo.
   */
  function trocarSenha(senhaAtual: string, senhaNova: string): Promise<boolean> {
    return executar(async () => {
      if (fase.value !== 'aberta' && fase.value !== 'troca-pendente') return false;
      const embrulhoAntigo = embrulhoAtual;
      if (embrulhoAntigo === undefined) return false;

      const politica = validarSenhaNova(senhaNova);
      if (!politica.valida) {
        mensagem.value = `A senha nova precisa ter ${MINIMO_SENHA} caracteres ou mais.`;
        return false;
      }
      // Antes da derivação: a mesma senha não gasta PBKDF2 nem chega ao servidor.
      if (senhasIguais(senhaAtual, senhaNova)) {
        mensagem.value = MENSAGEM_SENHA_REPETIDA;
        return false;
      }

      const login = usuario.value;
      try {
        const saltAtual = await buscarSalt(login);
        const atual = await derivar(senhaAtual, saltAtual);
        const cekExtraivel = await desembrulharComSenhaAtual(
          embrulhoAntigo,
          atual.kek,
          aadDoEmbrulho(login, saltAtual)
        );
        if (cekExtraivel === null) {
          mensagem.value = MENSAGEM_SENHA_ATUAL;
          return false;
        }

        const saltNovo = gerarSalt();
        const nova = await derivar(senhaNova, saltNovo);
        const aadNovo = aadDoEmbrulho(login, saltNovo);
        const embrulhoNovo = await embrulharCek(cekExtraivel, nova.kek, aadNovo);

        await cliente.trocarSenha({
          authAtual: bytesParaBase64Url(atual.auth),
          salt: bytesParaBase64(saltNovo),
          auth: bytesParaBase64Url(nova.auth),
          embrulho: embrulhoNovo
        });

        // O servidor já tem a senha nova: o embrulho novo passa a ser o de referência.
        embrulhoAtual = embrulhoNovo;
        deveTrocar = false;
        cek = await desembrulharCek(embrulhoNovo, nova.kek, aadNovo);
        fase.value = 'aberta';
        mensagem.value = '';
        return true;
      } catch (erro) {
        if (erro instanceof ErroCifra) {
          mensagem.value = MENSAGEM_CONTEUDO;
          return false;
        }
        tratar(erro, MENSAGEM_SENHA_ATUAL);
        return false;
      }
    });
  }

  /** Decifra uma imagem com a CEK em memória. Sem CEK (travada, troca pendente, deslogado), recusa. */
  async function decifrarImagem(
    arquivo: Uint8Array<ArrayBuffer>,
    kid: Uint8Array<ArrayBuffer>,
    id: Uint8Array<ArrayBuffer>
  ): Promise<ImagemDecifrada> {
    if (cek === undefined) throw new ErroSessaoJuri('sem-chave');
    return decifrarImagemCifrada(arquivo, cek, kid, id);
  }

  /** Apaga a CEK neste aparelho antes de falar com o servidor: sair nunca depende da rede. */
  async function sair(): Promise<void> {
    encerrarLocal();
    mensagem.value = '';
    try {
      await cliente.sair();
    } catch {
      mensagem.value = MENSAGEM_SAIDA_SEM_SERVIDOR;
    }
  }

  /**
   * Ao sair da página sem clicar em Sair: a CEK sai da memória e a sessão continua no
   * servidor (a próxima visita pede só a senha). Não fala com o servidor.
   */
  function descartar(): void {
    encerrarLocal();
    mensagem.value = '';
  }

  return {
    fase,
    usuario,
    mensagem,
    ocupado,
    iniciar,
    entrar,
    destravar,
    trocarSenha,
    sair,
    descartar,
    decifrarImagem
  };
}

export type SessaoJuri = ReturnType<typeof criarSessaoJuri>;
