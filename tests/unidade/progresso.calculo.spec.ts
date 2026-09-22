import { describe, expect, it } from 'vitest';
import {
  criarRegistroVazio,
  marcarBlocoLido,
  desmarcarBlocoLido,
  contarBlocosLidos
} from '@/core/progresso/calculo';

describe('criarRegistroVazio', () => {
  it('começa sem blocos lidos, na aba resumo, versão 1', () => {
    const r = criarRegistroVazio('2026-09-21T00:00:00.000Z');
    expect(r.versao).toBe(1);
    expect(r.blocosLidos).toEqual([]);
    expect(r.ultimaAba).toBe('resumo');
    expect(r.atualizadoEm).toBe('2026-09-21T00:00:00.000Z');
  });
});

describe('marcarBlocoLido', () => {
  it('acrescenta um bloco novo', () => {
    const inicial = criarRegistroVazio('t0');
    const depois = marcarBlocoLido(inicial, 'bloco-1', 't1');
    expect(depois.blocosLidos).toEqual(['bloco-1']);
    expect(depois.atualizadoEm).toBe('t1');
  });

  it('marcar o mesmo bloco duas vezes não duplica', () => {
    let r = criarRegistroVazio('t0');
    r = marcarBlocoLido(r, 'bloco-1', 't1');
    r = marcarBlocoLido(r, 'bloco-1', 't2');
    expect(r.blocosLidos).toEqual(['bloco-1']);
  });

  it('não muta o registro original (imutável)', () => {
    const inicial = criarRegistroVazio('t0');
    marcarBlocoLido(inicial, 'bloco-1', 't1');
    expect(inicial.blocosLidos).toEqual([]);
  });
});

describe('desmarcarBlocoLido', () => {
  it('remove um bloco marcado', () => {
    let r = criarRegistroVazio('t0');
    r = marcarBlocoLido(r, 'bloco-1', 't1');
    r = marcarBlocoLido(r, 'bloco-2', 't2');
    r = desmarcarBlocoLido(r, 'bloco-1', 't3');
    expect(r.blocosLidos).toEqual(['bloco-2']);
  });

  it('desmarcar bloco que não estava marcado não quebra', () => {
    const r = criarRegistroVazio('t0');
    const depois = desmarcarBlocoLido(r, 'bloco-x', 't1');
    expect(depois.blocosLidos).toEqual([]);
  });
});

describe('contarBlocosLidos', () => {
  it('conta contra o total de blocos existentes na unidade', () => {
    let r = criarRegistroVazio('t0');
    r = marcarBlocoLido(r, 'bloco-1', 't1');
    r = marcarBlocoLido(r, 'bloco-2', 't2');
    // um terceiro bloco não existe mais no conteúdo (unidade editada): não conta
    r = marcarBlocoLido(r, 'bloco-fantasma', 't3');
    const contagem = contarBlocosLidos(r, ['bloco-1', 'bloco-2', 'bloco-3']);
    expect(contagem).toEqual({ lidos: 2, total: 3 });
  });

  it('zero lido é uma contagem válida, não um erro', () => {
    const r = criarRegistroVazio('t0');
    expect(contarBlocosLidos(r, ['bloco-1', 'bloco-2'])).toEqual({ lidos: 0, total: 2 });
  });
});
