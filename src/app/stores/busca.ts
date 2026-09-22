import { ref, type Ref } from 'vue';
import type { DocumentoBusca, MotorBusca } from '@/core/busca/tipos';

export interface StoreBusca {
  readonly termo: Ref<string>;
  readonly resultados: Ref<readonly DocumentoBusca[]>;
  readonly carregando: Ref<boolean>;
  garantirMotorCarregado(): Promise<void>;
  consultar(termo: string): void;
}

/**
 * Import dinâmico do índice no primeiro foco do CampoBusca (seção 7): o
 * módulo do MiniSearch e o public/busca/indice.json só descem quando o
 * leitor de fato vai buscar.
 */
export function criarStoreBusca(): StoreBusca {
  const termo = ref('');
  const resultados = ref<readonly DocumentoBusca[]>([]);
  const carregando = ref(false);
  let motor: MotorBusca | undefined;
  let carregamentoEmCurso: Promise<void> | undefined;

  async function garantirMotorCarregado(): Promise<void> {
    if (motor) return;
    if (carregamentoEmCurso) return carregamentoEmCurso;
    carregando.value = true;
    carregamentoEmCurso = (async () => {
      const [{ carregarMotorBuscaDeJson }, resposta] = await Promise.all([
        import('@/app/busca/criarMotorBuscaMiniSearch'),
        fetch(`${import.meta.env.BASE_URL}busca/indice.json`)
      ]);
      const json = await resposta.text();
      motor = carregarMotorBuscaDeJson(json);
    })().finally(() => {
      carregando.value = false;
    });
    return carregamentoEmCurso;
  }

  function consultar(valor: string): void {
    termo.value = valor;
    resultados.value = motor ? motor.consultar(valor) : [];
  }

  return { termo, resultados, carregando, garantirMotorCarregado, consultar };
}
