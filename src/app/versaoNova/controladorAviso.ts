import { computed, ref, type ComputedRef } from 'vue';
import {
  consultarVersaoPublicada,
  type ResultadoConsulta,
  type Transporte
} from './consultarVersaoPublicada';
import {
  criarVigiaVersaoPublicada,
  type DocumentoVisivel,
  type RelogioVigia
} from './vigiaVersaoPublicada';
import {
  CHAVE_DISPENSADA,
  CHAVE_RECARREGOU_PARA,
  continuaConectado,
  decidirEstadoAviso,
  type EstadoAviso
} from './estadoAvisoVersao';
import { nomeDeExibicao } from '@/core/versaoNova/nomeDeExibicao';
import { novidadesDesde, type ResumoNovidades } from '@/core/versaoNova/novidadesDesde';

export interface ArmazenamentoAviso {
  lerChave(chave: string): string | null;
  gravarChave(chave: string, valor: string): void;
}

export interface VisaoAviso {
  versaoPublicada: string | null;
  nome: string;
  resumo: ResumoNovidades;
  continuaConectado: boolean;
  avisoQuiz: string | null;
}

export interface OpcoesControlador {
  daAba: string;
  transporte: Transporte;
  relogio: RelogioVigia;
  documento: DocumentoVisivel;
  armazenamento: ArmazenamentoAviso;
  /** Nome de login da sessão; vazio até o login. Sem login não há consulta. */
  usuario: { readonly value: string };
  navegarParaInicio: () => void;
}

export interface ControladorAviso {
  readonly estado: ComputedRef<EstadoAviso>;
  visaoAgora(): VisaoAviso;
  consultar(): Promise<ResultadoConsulta>;
  fechar(): void;
  aoTrocarRota(): void;
  iniciar(): () => void;
  marcarRecarregouPara(versao: string): void;
  versaoDispensada(): string | null;
  navegarParaInicio(): void;
}

const SEM_NOVIDADES: ResumoNovidades = {
  rollback: false,
  foraDoHistorico: false,
  itens: [],
  mais: 0
};

/**
 * Estado do banner de versão nova (AV-F11): liga a consulta, o vigia, o armazenamento da aba
 * e a sessão. Sem login não há consulta. Fechar guarda a versão dispensada na aba. A frase
 * "continua conectado" é lida na renderização, porque depende do relógio.
 */
export function criarControladorAviso(opcoes: OpcoesControlador): ControladorAviso {
  const resultado = ref<ResultadoConsulta | null>(null);
  const ultimaConfirmacao = ref<number | null>(null);
  const dispensadaPara = ref<string | null>(opcoes.armazenamento.lerChave(CHAVE_DISPENSADA));
  const recarregouPara = ref<string | null>(opcoes.armazenamento.lerChave(CHAVE_RECARREGOU_PARA));

  const estado = computed<EstadoAviso>(() =>
    decidirEstadoAviso({
      daAba: opcoes.daAba,
      resultado: resultado.value,
      dispensadaPara: dispensadaPara.value,
      recarregouPara: recarregouPara.value
    })
  );

  function publicadaAtual(): string | null {
    return resultado.value?.tipo === 'publicada' ? resultado.value.versao : null;
  }

  async function consultar(): Promise<ResultadoConsulta> {
    if (opcoes.usuario.value === '') return { tipo: 'sem-informacao' };
    const nova = await consultarVersaoPublicada(opcoes.transporte);
    resultado.value = nova;
    if (nova.tipo === 'publicada') ultimaConfirmacao.value = opcoes.relogio.agora();
    return nova;
  }

  const vigia = criarVigiaVersaoPublicada({
    relogio: opcoes.relogio,
    documento: opcoes.documento,
    consultar: () => {
      void consultar();
    }
  });

  return {
    estado,
    visaoAgora(): VisaoAviso {
      const versao = estado.value.tipo === 'versao-nova' ? estado.value.publicada : null;
      const historico = resultado.value?.tipo === 'publicada' ? resultado.value.historico : [];
      return {
        versaoPublicada: versao,
        nome: nomeDeExibicao(opcoes.usuario.value),
        resumo: versao === null ? SEM_NOVIDADES : novidadesDesde(historico, opcoes.daAba, versao),
        continuaConectado: continuaConectado(ultimaConfirmacao.value, opcoes.relogio.agora()),
        avisoQuiz: null
      };
    },
    consultar,
    fechar() {
      const versao = publicadaAtual();
      if (versao === null) return;
      dispensadaPara.value = versao;
      opcoes.armazenamento.gravarChave(CHAVE_DISPENSADA, versao);
    },
    aoTrocarRota: () => vigia.aoTrocarRota(),
    iniciar: () => vigia.iniciar(),
    marcarRecarregouPara(versao: string) {
      recarregouPara.value = versao;
      opcoes.armazenamento.gravarChave(CHAVE_RECARREGOU_PARA, versao);
    },
    versaoDispensada: () => dispensadaPara.value,
    navegarParaInicio: () => opcoes.navegarParaInicio()
  };
}
