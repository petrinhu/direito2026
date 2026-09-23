import { describe, expect, it, vi } from 'vitest';
import {
  criarTratadorFalhaModulo,
  type ArmazenamentoRecarga
} from '@/app/atualizacaoSW/recarregarAoFalharModulo';

/**
 * Cobre o caso levantado pelo líder (23/09/2026): aba aberta com o
 * bundle da versão A pede, sob demanda, um pedaço de código que a
 * publicação da versão B já apagou do servidor. O Vite emite o evento
 * `vite:preloadError` nesse caso (pesquisado na documentação oficial,
 * seção "Load Error Handling") - é esse evento que main.ts escuta e
 * delega para `criarTratadorFalhaModulo`. Sem tela (L-50): o disparo real
 * do evento no navegador fica para o roteiro do QA, documentado em
 * docs/arquitetura.md, seção 9.
 */
function criarArmazenamentoFalso(): ArmazenamentoRecarga {
  let marcado = false;
  return {
    lerMarcaRecente: () => marcado,
    gravarMarca: () => {
      marcado = true;
    }
  };
}

describe('criarTratadorFalhaModulo', () => {
  it('na primeira falha, recarrega e marca (e evita o comportamento padrão do Vite)', () => {
    const recarregar = vi.fn();
    const tratador = criarTratadorFalhaModulo(criarArmazenamentoFalso(), recarregar);
    const preventDefault = vi.fn();

    tratador({ preventDefault });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(recarregar).toHaveBeenCalledTimes(1);
  });

  it('segunda falha em sequência curta não entra em laço: não recarrega de novo', () => {
    const recarregar = vi.fn();
    const tratador = criarTratadorFalhaModulo(criarArmazenamentoFalso(), recarregar);

    tratador({});
    tratador({});
    tratador({});

    expect(recarregar).toHaveBeenCalledTimes(1);
  });

  it('funciona mesmo quando o evento não traz preventDefault', () => {
    const recarregar = vi.fn();
    const tratador = criarTratadorFalhaModulo(criarArmazenamentoFalso(), recarregar);

    expect(() => tratador({})).not.toThrow();
    expect(recarregar).toHaveBeenCalledTimes(1);
  });

  it('duas instâncias com armazenamentos independentes não se travam uma à outra', () => {
    const recarregarA = vi.fn();
    const recarregarB = vi.fn();
    const tratadorA = criarTratadorFalhaModulo(criarArmazenamentoFalso(), recarregarA);
    const tratadorB = criarTratadorFalhaModulo(criarArmazenamentoFalso(), recarregarB);

    tratadorA({});
    tratadorB({});

    expect(recarregarA).toHaveBeenCalledTimes(1);
    expect(recarregarB).toHaveBeenCalledTimes(1);
  });
});
