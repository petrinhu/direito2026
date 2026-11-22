import { afterEach, describe, expect, it, vi } from 'vitest';
import { rolagemDaTroca } from '@/app/router/rolagem';

/**
 * Rolagem na troca de rota (AV3-MOV, decisão do líder: "Completar, só a rolagem"). A âncora rola
 * suave, salvo quando a pessoa pede menos movimento: aí rola de uma vez. A consulta é feita a cada
 * troca, então uma mudança da preferência com o site aberto vale na próxima navegação.
 */

function preferenciaDeMovimento(reduzido: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduzido && query.includes('prefers-reduced-motion: reduce'),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('rolagemDaTroca: âncora', () => {
  it('sem preferência de movimento reduzido, a âncora rola suave', () => {
    preferenciaDeMovimento(false);
    expect(rolagemDaTroca({ hash: '#secao' })).toEqual({ el: '#secao', behavior: 'smooth' });
  });

  it('com prefers-reduced-motion: reduce, a âncora rola de uma vez (instant)', () => {
    preferenciaDeMovimento(true);
    expect(rolagemDaTroca({ hash: '#secao' })).toEqual({ el: '#secao', behavior: 'instant' });
  });

  it('sem matchMedia no ambiente, a âncora segue suave (comportamento de antes)', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(rolagemDaTroca({ hash: '#secao' })).toEqual({ el: '#secao', behavior: 'smooth' });
  });

  it('a preferência é lida a cada troca: mudar com o site aberto vale na próxima', () => {
    preferenciaDeMovimento(false);
    expect(rolagemDaTroca({ hash: '#a' })).toEqual({ el: '#a', behavior: 'smooth' });
    preferenciaDeMovimento(true);
    expect(rolagemDaTroca({ hash: '#a' })).toEqual({ el: '#a', behavior: 'instant' });
  });
});

describe('rolagemDaTroca: sem âncora', () => {
  it('vai ao topo, com ou sem movimento reduzido', () => {
    preferenciaDeMovimento(true);
    expect(rolagemDaTroca({ hash: '' })).toEqual({ top: 0 });
    preferenciaDeMovimento(false);
    expect(rolagemDaTroca({ hash: '' })).toEqual({ top: 0 });
  });
});
