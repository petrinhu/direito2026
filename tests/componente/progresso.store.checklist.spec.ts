import { describe, expect, it } from 'vitest';
import { criarStoreProgresso } from '@/app/stores/progresso';
import { RepositorioMemoria } from '@/app/persistencia/RepositorioMemoria';

describe('StoreProgressoUnidade.alternarChecklist', () => {
  it('marca um item de checklist e persiste no repositório', () => {
    const repositorio = new RepositorioMemoria();
    const store = criarStoreProgresso(repositorio, 'p1/redacao-juridica-1/u1');

    store.alternarChecklist('cpc-319-item-i');

    expect(store.registro.value.itensChecklistMarcados).toEqual(['cpc-319-item-i']);
    expect(repositorio.ler('p1/redacao-juridica-1/u1')?.itensChecklistMarcados).toEqual([
      'cpc-319-item-i'
    ]);
  });

  it('alternar de novo desmarca', () => {
    const store = criarStoreProgresso(new RepositorioMemoria(), 'p1/redacao-juridica-1/u1');
    store.alternarChecklist('item-1');
    store.alternarChecklist('item-1');
    expect(store.registro.value.itensChecklistMarcados).toEqual([]);
  });
});
