import { describe, expect, it } from 'vitest';
import { criarRegistroVazio, alternarItemChecklist } from '@/core/progresso/calculo';

/**
 * Extra (a) da unidade de Redação Jurídica 1: checklist marcável dos
 * requisitos do art. 319 do CPC. Reaproveita o mesmo registro de progresso
 * que já guarda blocosLidos e o quiz (docs/arquitetura.md, seção 4),
 * seguindo o mesmo padrão imutável de marcarBlocoLido/desmarcarBlocoLido.
 */
describe('alternarItemChecklist', () => {
  it('marca um item ainda não marcado', () => {
    const inicial = criarRegistroVazio('t0');
    const depois = alternarItemChecklist(inicial, 'cpc-319-item-1', 't1');
    expect(depois.itensChecklistMarcados).toEqual(['cpc-319-item-1']);
    expect(depois.atualizadoEm).toBe('t1');
  });

  it('alternar um item já marcado desmarca (toggle)', () => {
    let r = criarRegistroVazio('t0');
    r = alternarItemChecklist(r, 'cpc-319-item-1', 't1');
    r = alternarItemChecklist(r, 'cpc-319-item-1', 't2');
    expect(r.itensChecklistMarcados).toEqual([]);
  });

  it('não muta o registro original (imutável)', () => {
    const inicial = criarRegistroVazio('t0');
    alternarItemChecklist(inicial, 'cpc-319-item-1', 't1');
    expect(inicial.itensChecklistMarcados ?? []).toEqual([]);
  });

  it('registro vazio começa sem itensChecklistMarcados', () => {
    const r = criarRegistroVazio('t0');
    expect(r.itensChecklistMarcados ?? []).toEqual([]);
  });

  it('preserva outros itens já marcados ao alternar um novo', () => {
    let r = criarRegistroVazio('t0');
    r = alternarItemChecklist(r, 'item-1', 't1');
    r = alternarItemChecklist(r, 'item-2', 't2');
    expect(r.itensChecklistMarcados).toEqual(['item-1', 'item-2']);
  });
});
