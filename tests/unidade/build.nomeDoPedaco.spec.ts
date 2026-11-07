import { describe, expect, it } from 'vitest';
import { nomeDoPedaco } from '../../vite.config';

/**
 * Nome dos pedaços do build (L-35, TDD: estes testes nasceram vermelhos, antes
 * da função existir). Pedaço que sai só de src/conteudo ganha o prefixo
 * "conteudo-", que é o padrão da regra de cache "conteudo-unidades" do service
 * worker. Pedaço do app ou misto (conteúdo + código do app) fica como antes.
 */
const DE_CONTEUDO = '/proj/src/conteudo/p1/intr-direito/u1/resumo.ts';

describe('nome dos pedaços do build', () => {
  it('pedaço só de src/conteudo sai com prefixo conteudo- e hash', () => {
    expect(
      nomeDoPedaco({ name: 'resumo', facadeModuleId: DE_CONTEUDO, moduleIds: [DE_CONTEUDO] })
    ).toBe('assets/conteudo-[name]-[hash].js');
  });

  it('pedaço do app não ganha prefixo', () => {
    expect(
      nomeDoPedaco({
        name: 'index',
        facadeModuleId: '/proj/src/app/main.ts',
        moduleIds: ['/proj/src/app/main.ts']
      })
    ).toBe('assets/[name]-[hash].js');
  });

  it('pedaço misto (conteúdo com código do app dentro) não ganha prefixo', () => {
    expect(
      nomeDoPedaco({
        name: 'resumo',
        facadeModuleId: DE_CONTEUDO,
        moduleIds: [DE_CONTEUDO, '/proj/src/core/busca/normalizar.ts']
      })
    ).toBe('assets/[name]-[hash].js');
  });

  it('caminho com barra invertida (Windows) também conta como conteúdo', () => {
    const windows = 'C:\\proj\\src\\conteudo\\p1\\intr-direito\\u1\\resumo.ts';
    expect(nomeDoPedaco({ name: 'resumo', facadeModuleId: windows, moduleIds: [windows] })).toBe(
      'assets/conteudo-[name]-[hash].js'
    );
  });

  it('sem módulo nenhum (pedaço anônimo) não ganha prefixo', () => {
    expect(nomeDoPedaco({ name: 'chunk', facadeModuleId: null, moduleIds: [] })).toBe(
      'assets/[name]-[hash].js'
    );
  });
});
