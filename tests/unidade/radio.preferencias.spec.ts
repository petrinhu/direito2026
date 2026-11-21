import { describe, expect, it } from 'vitest';
import {
  CHAVE_PREFERENCIAS_RADIO,
  VOLUME_PADRAO,
  gravarPreferencias,
  limparConsentimentos,
  lerPreferencias,
  sanearVolume,
  type ArmazenamentoLike
} from '@/core/radio/preferencias';

/** Armazenamento em memória; com `falha: true`, todo acesso lança, como o Safari em modo privado. */
function armazenamento(
  inicial: Record<string, string> = {},
  falha = false
): ArmazenamentoLike & {
  dados: Record<string, string>;
} {
  const dados = { ...inicial };
  return {
    dados,
    getItem(chave) {
      if (falha) throw new DOMException('negado', 'SecurityError');
      return dados[chave] ?? null;
    },
    setItem(chave, valor) {
      if (falha) throw new DOMException('cheio', 'QuotaExceededError');
      dados[chave] = valor;
    }
  };
}

describe('sanearVolume (escala até 100%)', () => {
  it('aceita 0 a 100 e arredonda', () => {
    expect(sanearVolume(0)).toBe(0);
    expect(sanearVolume(100)).toBe(100);
    expect(sanearVolume(37.6)).toBe(38);
  });

  it('fora da faixa ou não numérico volta ao padrão, sem NaN nem valor negativo', () => {
    for (const ruim of [-5, 101, Number.NaN, Infinity, '50', null, undefined, {}]) {
      expect(sanearVolume(ruim)).toBe(VOLUME_PADRAO);
    }
  });
});

describe('lerPreferencias e gravarPreferencias (memória com falha de localStorage)', () => {
  it('sem nada gravado, devolve o padrão: rádio clássica, volume padrão, nenhum consentimento', () => {
    expect(lerPreferencias(armazenamento(), CHAVE_PREFERENCIAS_RADIO)).toEqual({
      radio: 'radio-swiss-classic',
      volume: VOLUME_PADRAO,
      consentimentos: []
    });
  });

  it('lembra a rádio, o volume e as emissoras consentidas depois de gravar', () => {
    const memoria = armazenamento();
    gravarPreferencias(memoria, CHAVE_PREFERENCIAS_RADIO, {
      radio: 'ambient-fm',
      volume: 72,
      consentimentos: ['ambient-fm']
    });
    expect(lerPreferencias(memoria, CHAVE_PREFERENCIAS_RADIO)).toEqual({
      radio: 'ambient-fm',
      volume: 72,
      consentimentos: ['ambient-fm']
    });
  });

  it('com localStorage que lança na leitura, devolve o padrão e não lança', () => {
    expect(() => lerPreferencias(armazenamento({}, true), CHAVE_PREFERENCIAS_RADIO)).not.toThrow();
    expect(lerPreferencias(armazenamento({}, true), CHAVE_PREFERENCIAS_RADIO).volume).toBe(
      VOLUME_PADRAO
    );
  });

  it('com localStorage que lança na gravação, devolve false e não lança', () => {
    const resultado = gravarPreferencias(armazenamento({}, true), CHAVE_PREFERENCIAS_RADIO, {
      radio: 'ambient-fm',
      volume: 10,
      consentimentos: ['ambient-fm']
    });
    expect(resultado).toBe(false);
  });

  it('gravação bem-sucedida devolve true', () => {
    expect(
      gravarPreferencias(armazenamento(), CHAVE_PREFERENCIAS_RADIO, {
        radio: 'ambient-fm',
        volume: 10,
        consentimentos: []
      })
    ).toBe(true);
  });

  it('JSON corrompido ou de tipo errado cai no padrão campo a campo', () => {
    expect(
      lerPreferencias(
        armazenamento({ [CHAVE_PREFERENCIAS_RADIO]: '{não é json' }),
        CHAVE_PREFERENCIAS_RADIO
      )
    ).toEqual({ radio: 'radio-swiss-classic', volume: VOLUME_PADRAO, consentimentos: [] });

    const misturado = armazenamento({
      [CHAVE_PREFERENCIAS_RADIO]: JSON.stringify({
        radio: 'https://evil.example/stream',
        volume: 'alto',
        consentimentos: 'sim'
      })
    });
    expect(lerPreferencias(misturado, CHAVE_PREFERENCIAS_RADIO)).toEqual({
      radio: 'radio-swiss-classic',
      volume: VOLUME_PADRAO,
      consentimentos: []
    });
  });

  it('consentimento só vale para id de rádio conhecido, sem duplicar, nunca por valor "truthy"', () => {
    const memoria = armazenamento({
      [CHAVE_PREFERENCIAS_RADIO]: JSON.stringify({
        radio: 'ambient-fm',
        volume: 40,
        consentimentos: ['ambient-fm', 'ambient-fm', 'https://evil.example', 1, true]
      })
    });
    expect(lerPreferencias(memoria, CHAVE_PREFERENCIAS_RADIO).consentimentos).toEqual([
      'ambient-fm'
    ]);
  });
});

describe('limparConsentimentos (sair apaga o consentimento, mantém rádio e volume)', () => {
  it('zera as emissoras consentidas e mantém rádio e volume escolhidos', () => {
    const memoria = armazenamento({
      [CHAVE_PREFERENCIAS_RADIO]: JSON.stringify({
        radio: 'ambient-fm',
        volume: 72,
        consentimentos: ['ambient-fm', 'radio-swiss-classic']
      })
    });
    limparConsentimentos(memoria, CHAVE_PREFERENCIAS_RADIO);
    expect(lerPreferencias(memoria, CHAVE_PREFERENCIAS_RADIO)).toEqual({
      radio: 'ambient-fm',
      volume: 72,
      consentimentos: []
    });
  });

  it('com localStorage que lança, não lança e devolve false', () => {
    const falho = armazenamento({}, true);
    expect(() => limparConsentimentos(falho, CHAVE_PREFERENCIAS_RADIO)).not.toThrow();
    expect(limparConsentimentos(falho, CHAVE_PREFERENCIAS_RADIO)).toBe(false);
  });

  it('sem armazenamento (null), devolve false e não lança', () => {
    expect(limparConsentimentos(null, CHAVE_PREFERENCIAS_RADIO)).toBe(false);
  });
});
