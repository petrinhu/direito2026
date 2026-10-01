import { describe, expect, it } from 'vitest';
import { construirArvoreMapa, idsExpansiveis } from '@/core/fichamento/arvoreMapa';
import { abertosIniciais, interpretarTecla, nosVisiveis } from '@/core/fichamento/navegacaoArvore';
import { DADOS_SINTETICOS } from './apoio/dadosFichamento';

const raiz = construirArvoreMapa(DADOS_SINTETICOS);

describe('abertosIniciais', () => {
  it('abre a raiz, as eras e as fases, e deixa os pensadores fechados', () => {
    const abertos = abertosIniciais(raiz);
    expect(abertos.has(raiz.id)).toBe(true);
    expect(abertos.has('mapa-era-antiga')).toBe(true);
    expect(abertos.has('mapa-fase-f1')).toBe(true);
    expect(abertos.has('mapa-pensador-alfa')).toBe(false);
  });
});

describe('nosVisiveis', () => {
  it('lista em ordem de leitura só os nós cujo caminho inteiro está aberto', () => {
    const ids = nosVisiveis(raiz, abertosIniciais(raiz)).map((n) => n.id);
    expect(ids.slice(0, 4)).toEqual([
      'mapa-raiz',
      'mapa-era-antiga',
      'mapa-fase-f1',
      'mapa-pensador-alfa'
    ]);
    expect(ids).not.toContain('mapa-alfa-modo');
  });

  it('com tudo aberto aparecem todos os nós', () => {
    const todos = new Set(idsExpansiveis(raiz));
    expect(nosVisiveis(raiz, todos).length).toBeGreaterThan(15);
  });
});

describe('interpretarTecla (padrão APG de árvore)', () => {
  const abertos = abertosIniciais(raiz);

  it('seta para baixo e para cima movem entre os nós visíveis', () => {
    expect(interpretarTecla(raiz, abertos, 'mapa-raiz', 'ArrowDown')).toEqual({
      foco: 'mapa-era-antiga'
    });
    expect(interpretarTecla(raiz, abertos, 'mapa-era-antiga', 'ArrowUp')).toEqual({
      foco: 'mapa-raiz'
    });
  });

  it('nas pontas, não passa do primeiro nem do último', () => {
    expect(interpretarTecla(raiz, abertos, 'mapa-raiz', 'ArrowUp')).toEqual({ foco: 'mapa-raiz' });
    const ultimo = nosVisiveis(raiz, abertos).at(-1)!.id;
    expect(interpretarTecla(raiz, abertos, ultimo, 'ArrowDown')).toEqual({ foco: ultimo });
  });

  it('Home e End vão ao primeiro e ao último visível', () => {
    expect(interpretarTecla(raiz, abertos, 'mapa-fase-f1', 'Home')).toEqual({ foco: 'mapa-raiz' });
    const ultimo = nosVisiveis(raiz, abertos).at(-1)!.id;
    expect(interpretarTecla(raiz, abertos, 'mapa-raiz', 'End')).toEqual({ foco: ultimo });
  });

  it('seta para a direita abre o nó fechado e, aberto, vai ao primeiro filho', () => {
    expect(interpretarTecla(raiz, abertos, 'mapa-pensador-alfa', 'ArrowRight')).toEqual({
      abrir: 'mapa-pensador-alfa'
    });
    expect(interpretarTecla(raiz, abertos, 'mapa-fase-f1', 'ArrowRight')).toEqual({
      foco: 'mapa-pensador-alfa'
    });
  });

  it('seta para a direita numa folha não faz nada', () => {
    const todos = new Set(idsExpansiveis(raiz));
    expect(interpretarTecla(raiz, todos, 'mapa-alfa-modo', 'ArrowRight')).toEqual({});
  });

  it('seta para a esquerda fecha o nó aberto e, fechado ou folha, vai ao pai', () => {
    expect(interpretarTecla(raiz, abertos, 'mapa-fase-f1', 'ArrowLeft')).toEqual({
      fechar: 'mapa-fase-f1'
    });
    expect(interpretarTecla(raiz, abertos, 'mapa-pensador-alfa', 'ArrowLeft')).toEqual({
      foco: 'mapa-fase-f1'
    });
    const todos = new Set(idsExpansiveis(raiz));
    expect(interpretarTecla(raiz, todos, 'mapa-alfa-modo', 'ArrowLeft')).toEqual({
      foco: 'mapa-pensador-alfa'
    });
  });

  it('Enter e Espaço alternam o nó que tem filhos e não fazem nada na folha', () => {
    expect(interpretarTecla(raiz, abertos, 'mapa-pensador-alfa', 'Enter')).toEqual({
      alternar: 'mapa-pensador-alfa'
    });
    expect(interpretarTecla(raiz, abertos, 'mapa-fase-f1', ' ')).toEqual({
      alternar: 'mapa-fase-f1'
    });
    const todos = new Set(idsExpansiveis(raiz));
    expect(interpretarTecla(raiz, todos, 'mapa-alfa-modo', 'Enter')).toEqual({});
  });

  it('tecla desconhecida devolve undefined, para o navegador seguir o caminho dele', () => {
    expect(interpretarTecla(raiz, abertos, 'mapa-raiz', 'Tab')).toBeUndefined();
    expect(interpretarTecla(raiz, abertos, 'mapa-raiz', 'x')).toBeUndefined();
  });
});
