import { describe, expect, it, vi } from 'vitest';
import {
  criarTratadorDeFalhaDeModulo,
  tratarFalhaDeModulo,
  type DepsFalhaModulo
} from '@/app/versaoNova/falhaModulo';
import type { ResultadoConsulta } from '@/app/versaoNova/consultarVersaoPublicada';

/**
 * AV-F11, decisão D2b opção A (ratificada pelo líder, 46c: "Mostrar o banner"): módulo que
 * falta depois de uma publicação mostra o banner em vez de recarregar sozinho. Sem versão
 * nova confirmada, ou com a versão já dispensada, recarrega como antes. A proteção contra
 * laço (marca de 10 s) continua valendo.
 */
function deps(sobrescrever: Partial<DepsFalhaModulo> & { resultado?: ResultadoConsulta; marcaRecente?: boolean } = {}) {
  const recarregar = vi.fn();
  const gravarMarca = vi.fn();
  const consultar = vi.fn(async (): Promise<ResultadoConsulta> => sobrescrever.resultado ?? { tipo: 'sem-informacao' });
  const d: DepsFalhaModulo = {
    daAba: '1.12.0.0',
    dispensadaPara: () => null,
    consultar,
    armazenamento: { lerMarcaRecente: () => sobrescrever.marcaRecente ?? false, gravarMarca },
    recarregar,
    ...sobrescrever
  };
  return { d, recarregar, gravarMarca, consultar };
}

describe('tratarFalhaDeModulo', () => {
  it('versão nova publicada: mostra o banner e não recarrega', async () => {
    const { d, recarregar, gravarMarca } = deps({ resultado: { tipo: 'publicada', versao: '1.12.1.0', historico: [] } });
    expect(await tratarFalhaDeModulo(d)).toBe('banner');
    expect(recarregar).not.toHaveBeenCalled();
    expect(gravarMarca).not.toHaveBeenCalled();
  });

  it('sem versão nova confirmada (sem informação): recarrega e grava a marca', async () => {
    const { d, recarregar, gravarMarca } = deps({ resultado: { tipo: 'sem-informacao' } });
    expect(await tratarFalhaDeModulo(d)).toBe('recarregou');
    expect(recarregar).toHaveBeenCalledTimes(1);
    expect(gravarMarca).toHaveBeenCalledTimes(1);
  });

  it('versão igual à da aba: recarrega, porque o módulo falha por outra causa', async () => {
    const { d, recarregar } = deps({ resultado: { tipo: 'publicada', versao: '1.12.0.0', historico: [] } });
    expect(await tratarFalhaDeModulo(d)).toBe('recarregou');
    expect(recarregar).toHaveBeenCalledTimes(1);
  });

  it('versão nova já dispensada nesta aba: recarrega, porque não há banner visível', async () => {
    const { d, recarregar } = deps({
      resultado: { tipo: 'publicada', versao: '1.12.1.0', historico: [] },
      dispensadaPara: () => '1.12.1.0'
    });
    expect(await tratarFalhaDeModulo(d)).toBe('recarregou');
    expect(recarregar).toHaveBeenCalledTimes(1);
  });

  it('laço: marca recente não consulta nem recarrega de novo', async () => {
    const { d, recarregar, consultar } = deps({ marcaRecente: true });
    expect(await tratarFalhaDeModulo(d)).toBe('ignorou');
    expect(consultar).not.toHaveBeenCalled();
    expect(recarregar).not.toHaveBeenCalled();
  });
});

describe('criarTratadorDeFalhaDeModulo', () => {
  it('cancela o evento padrão do Vite antes de decidir', () => {
    const { d } = deps({ resultado: { tipo: 'publicada', versao: '1.12.1.0', historico: [] } });
    const preventDefault = vi.fn();
    criarTratadorDeFalhaDeModulo(d)({ preventDefault });
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });
});
