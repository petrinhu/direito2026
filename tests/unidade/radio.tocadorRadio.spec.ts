import { describe, expect, it } from 'vitest';
import { criarStoreRadio } from '@/app/radio/tocadorRadio';
import { CHAVE_PREFERENCIAS_RADIO, type ArmazenamentoLike } from '@/core/radio/preferencias';

/** Armazenamento em memória com a mesma forma do localStorage (só getItem/setItem). */
function armazenamento(): ArmazenamentoLike & { dados: Record<string, string> } {
  const dados: Record<string, string> = {};
  return {
    dados,
    getItem: (chave) => dados[chave] ?? null,
    setItem: (chave, valor) => {
      dados[chave] = valor;
    }
  };
}

function consentimentoGravado(memoria: ReturnType<typeof armazenamento>): unknown {
  return JSON.parse(memoria.dados[CHAVE_PREFERENCIAS_RADIO] ?? '{}').consentimentos;
}

describe('esquecerConsentimentos (sair apaga o consentimento)', () => {
  it('depois de consentir e esquecer, tocar de novo pede o aviso outra vez', () => {
    const memoria = armazenamento();
    const store = criarStoreRadio(memoria);
    store.consentir();
    expect(store.consentidaAtual.value).toBe(true);

    store.esquecerConsentimentos();

    expect(store.consentidaAtual.value).toBe(false);
    expect(consentimentoGravado(memoria)).toEqual([]);
    store.alternar();
    expect(store.estado.value).toBe('pedindoConsentimento');
  });

  it('a gravação seguinte (mudar volume) não ressuscita o consentimento apagado', () => {
    const memoria = armazenamento();
    const store = criarStoreRadio(memoria);
    store.consentir();
    store.esquecerConsentimentos();

    store.definirVolume(20);

    expect(consentimentoGravado(memoria)).toEqual([]);
    expect(store.consentidaAtual.value).toBe(false);
  });

  it('mantém a rádio e o volume escolhidos ao esquecer', () => {
    const memoria = armazenamento();
    const store = criarStoreRadio(memoria);
    store.trocarRadio('ambient-fm');
    store.definirVolume(72);
    store.consentir();

    store.esquecerConsentimentos();

    expect(store.radio.value.id).toBe('ambient-fm');
    expect(store.volume.value).toBe(72);
  });
});
