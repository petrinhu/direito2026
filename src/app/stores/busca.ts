import { ref, type Ref } from 'vue';
import {
  ARQUIVO_INDICE_TEXTO_INTEGRAL,
  type DocumentoBusca,
  type MotorBusca
} from '@/core/busca/tipos';

/** `parado`: nada pedido para o termo atual. Só o `buscarNoTextoIntegral` sai dele. */
export type EstadoBuscaTexto = 'parado' | 'carregando' | 'pronto' | 'erro';

export interface StoreBusca {
  readonly termo: Ref<string>;
  readonly resultados: Ref<readonly DocumentoBusca[]>;
  readonly carregando: Ref<boolean>;
  readonly resultadosTexto: Ref<readonly DocumentoBusca[]>;
  readonly estadoTexto: Ref<EstadoBuscaTexto>;
  garantirMotorCarregado(): Promise<void>;
  consultar(termo: string): void;
  buscarNoTextoIntegral(): Promise<void>;
}

/**
 * Import dinâmico do índice no primeiro foco do CampoBusca (seção 7): o
 * módulo do MiniSearch e o índice de busca só descem quando o leitor de
 * fato vai buscar. O índice fica em assets/busca-indice.json (achado do
 * líder, 22/09/2026: um destino public/busca/ virava pasta dist/busca/ no
 * pacote e colidia com a ROTA /busca da SPA, 403 no Apache).
 *
 * O texto integral (EP-F11-BUSCA-TETO) tem índice próprio, que só desce na
 * primeira vez em que `buscarNoTextoIntegral` é chamado: a busca principal
 * nunca o baixa, e o índice principal não cresce com o texto da lei.
 */
export function criarStoreBusca(aoNaoAutorizado: () => void = () => undefined): StoreBusca {
  const termo = ref('');
  const resultados = ref<readonly DocumentoBusca[]>([]);
  const carregando = ref(false);
  const resultadosTexto = ref<readonly DocumentoBusca[]>([]);
  const estadoTexto = ref<EstadoBuscaTexto>('parado');
  let motor: MotorBusca | undefined;
  let carregamentoEmCurso: Promise<void> | undefined;
  let motorTexto: MotorBusca | undefined;
  let carregamentoTextoEmCurso: Promise<void> | undefined;

  /** Baixa e monta um índice de assets/. 401 é sessão vencida: vem do mesmo portão do resto do site. */
  async function baixarMotor(arquivo: string): Promise<MotorBusca> {
    const [{ carregarMotorBuscaDeJson }, resposta] = await Promise.all([
      import('@/app/busca/criarMotorBuscaMiniSearch'),
      fetch(`${import.meta.env.BASE_URL}assets/${arquivo}`)
    ]);
    if (!resposta.ok) {
      if (resposta.status === 401) aoNaoAutorizado();
      throw new Error(`índice da busca indisponível (HTTP ${resposta.status})`);
    }
    return carregarMotorBuscaDeJson(await resposta.text());
  }

  async function garantirMotorCarregado(): Promise<void> {
    if (motor) return;
    if (carregamentoEmCurso) return carregamentoEmCurso;
    carregando.value = true;
    carregamentoEmCurso = baixarMotor('busca-indice.json')
      .then((baixado) => {
        motor = baixado;
      })
      .finally(() => {
        carregando.value = false;
      });
    return carregamentoEmCurso;
  }

  function consultar(valor: string): void {
    if (valor !== termo.value) {
      resultadosTexto.value = [];
      estadoTexto.value = 'parado';
    }
    termo.value = valor;
    resultados.value = motor ? motor.consultar(valor) : [];
  }

  /**
   * Busca no texto integral do termo atual. Baixa o índice na primeira vez e
   * reaproveita depois. Se o termo mudou enquanto baixava, descarta: o
   * resultado seria de uma pergunta que o aluno já trocou. Falha vira estado
   * `erro` (com "Tentar de novo" na tela) e nunca mexe nos resultados principais.
   */
  async function buscarNoTextoIntegral(): Promise<void> {
    const termoPedido = termo.value;
    if (termoPedido.trim() === '') return;

    if (!motorTexto) {
      estadoTexto.value = 'carregando';
      if (!carregamentoTextoEmCurso) {
        carregamentoTextoEmCurso = baixarMotor(ARQUIVO_INDICE_TEXTO_INTEGRAL).then((baixado) => {
          motorTexto = baixado;
        });
      }
      try {
        await carregamentoTextoEmCurso;
      } catch {
        carregamentoTextoEmCurso = undefined;
        if (termo.value === termoPedido) estadoTexto.value = 'erro';
        return;
      }
    }

    if (termo.value !== termoPedido || !motorTexto) return;
    resultadosTexto.value = motorTexto.consultar(termoPedido);
    estadoTexto.value = 'pronto';
  }

  return {
    termo,
    resultados,
    carregando,
    resultadosTexto,
    estadoTexto,
    garantirMotorCarregado,
    consultar,
    buscarNoTextoIntegral
  };
}
