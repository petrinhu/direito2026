// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { compararRecorde, gravarRecorde, lerRecorde } from '@/app/kelsenJump/recorde';
import { RepositorioLocalStorage } from '@/app/persistencia/RepositorioLocalStorage';
import { apagarTudoComConfirmacao } from '@/app/persistencia/apagarTudoComConfirmacao';

/** Armazenamento falso no mesmo formato do localStorage, para o teste rodar sem navegador. */
class ArmazenamentoFalso {
  private mapa = new Map<string, string>();
  get length(): number {
    return this.mapa.size;
  }
  key(i: number): string | null {
    return [...this.mapa.keys()][i] ?? null;
  }
  getItem(k: string): string | null {
    return this.mapa.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    this.mapa.set(k, String(v));
  }
  removeItem(k: string): void {
    this.mapa.delete(k);
  }
}

const CHAVE = 'caderno-direito:v1:kelsen-jump:recorde';
const global = globalThis as unknown as Record<string, unknown>;
let antigoStorage: unknown;
let antigoWindow: unknown;

beforeEach(() => {
  antigoStorage = global.localStorage;
  antigoWindow = global.window;
  global.localStorage = new ArmazenamentoFalso();
});

afterEach(() => {
  global.localStorage = antigoStorage;
  global.window = antigoWindow;
});

describe('compararRecorde: função pura', () => {
  it('pontuação maior que o recorde bate e vira o novo recorde', () => {
    expect(compararRecorde(5, 6)).toEqual({ recorde: 6, bateu: true });
  });

  it('empate não bate: o recorde continua o mesmo', () => {
    expect(compararRecorde(5, 5)).toEqual({ recorde: 5, bateu: false });
  });

  it('pontuação menor não bate', () => {
    expect(compararRecorde(5, 4)).toEqual({ recorde: 5, bateu: false });
  });

  it('sem recorde antes (0), qualquer pontuação positiva bate; zero não', () => {
    expect(compararRecorde(0, 3)).toEqual({ recorde: 3, bateu: true });
    expect(compararRecorde(0, 0)).toEqual({ recorde: 0, bateu: false });
  });

  it('valores inválidos viram 0 e não quebram a comparação', () => {
    expect(compararRecorde(Number.NaN, 3)).toEqual({ recorde: 3, bateu: true });
    expect(compararRecorde(-2, 3)).toEqual({ recorde: 3, bateu: true });
    expect(compararRecorde(5, Number.NaN)).toEqual({ recorde: 5, bateu: false });
  });
});

describe('guardar e ler o recorde no navegador', () => {
  it('grava e lê o mesmo número, na chave própria do jogo', () => {
    expect(gravarRecorde(42)).toBe(true);
    expect(global.localStorage && (global.localStorage as ArmazenamentoFalso).getItem(CHAVE)).toBe(
      '42'
    );
    expect(lerRecorde()).toBe(42);
  });

  it('valor ilegível ou ausente lê como 0', () => {
    expect(lerRecorde()).toBe(0);
    (global.localStorage as ArmazenamentoFalso).setItem(CHAVE, 'abc');
    expect(lerRecorde()).toBe(0);
  });

  it('sem armazenamento, lê 0 e não grava, sem lançar', () => {
    global.localStorage = undefined;
    expect(lerRecorde()).toBe(0);
    expect(gravarRecorde(9)).toBe(false);
  });

  it('armazenamento que lança (bloqueado ou cota), lê 0 e não grava, sem lançar', () => {
    global.localStorage = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('cota');
      }
    };
    expect(lerRecorde()).toBe(0);
    expect(gravarRecorde(9)).toBe(false);
  });
});

describe('apagar tudo do site leva o recorde junto', () => {
  it('apagarTudoComConfirmacao remove a chave do recorde', () => {
    gravarRecorde(77);
    global.window = { confirm: () => true, location: { reload: () => undefined } };
    apagarTudoComConfirmacao(new RepositorioLocalStorage());
    expect(lerRecorde()).toBe(0);
    expect((global.localStorage as ArmazenamentoFalso).getItem(CHAVE)).toBeNull();
  });

  it('se o leitor cancelar a confirmação, o recorde fica', () => {
    gravarRecorde(77);
    global.window = { confirm: () => false, location: { reload: () => undefined } };
    apagarTudoComConfirmacao(new RepositorioLocalStorage());
    expect(lerRecorde()).toBe(77);
  });
});
