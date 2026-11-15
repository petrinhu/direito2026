import { describe, expect, it } from 'vitest';
import { montarLinhaDeDireitos, partesDaLinhaDeDireitos } from '@/core/rodape/linhaDeDireitos';

/**
 * Decisão do líder, 20/10/2026, verbatim: "quero que a tag vá junto do
 * copyright: [vx.y.z.w Copyright 2026-[ano atual]. Existe outro formato
 * mais padronizado?"; opção escolhida: "v1.0.0.0 · © 2026 Caderno de
 * Direito. A partir de 2027 vira © 2026-2027". O hífen da faixa de anos é
 * o ASCII comum; travessão (U+2014) e meia-risca (U+2013) são proibidos
 * (L-32).
 */
const TRAVESSOES = /[–—]/;

describe('montarLinhaDeDireitos', () => {
  it('no ano de lançamento mostra um ano só, com versão de 4 números', () => {
    expect(montarLinhaDeDireitos('1.0.0.0', 2026, 2026)).toBe(
      'v1.0.0.0 · © 2026 Caderno de Direito'
    );
  });

  it('com versão de 3 números e no mesmo ano, também mostra um ano só', () => {
    expect(montarLinhaDeDireitos('0.1.0', 2026, 2026)).toBe('v0.1.0 · © 2026 Caderno de Direito');
  });

  it('a partir do ano seguinte mostra a faixa 2026-2027 com hífen comum', () => {
    expect(montarLinhaDeDireitos('1.0.0.0', 2026, 2027)).toBe(
      'v1.0.0.0 · © 2026-2027 Caderno de Direito'
    );
  });

  it('faixa acompanha anos além do seguinte (o segundo ano vem do argumento, não está fixo)', () => {
    expect(montarLinhaDeDireitos('1.0.0.0', 2026, 2030)).toBe(
      'v1.0.0.0 · © 2026-2030 Caderno de Direito'
    );
  });

  it('ano atual anterior ao de lançamento não produz faixa invertida', () => {
    expect(montarLinhaDeDireitos('0.1.0', 2026, 2025)).toBe('v0.1.0 · © 2026 Caderno de Direito');
  });

  it('nunca produz travessão longo nem meia-risca, em nenhum dos casos', () => {
    const saidas = [
      montarLinhaDeDireitos('1.0.0.0', 2026, 2026),
      montarLinhaDeDireitos('1.0.0.0', 2026, 2027),
      montarLinhaDeDireitos('0.1.0', 2026, 2030)
    ];
    for (const saida of saidas) {
      expect(saida).not.toMatch(TRAVESSOES);
    }
  });
});

/**
 * Titular sintético de propósito: o nome real não entra em nenhum spec (SB-F7). O quarto
 * parâmetro é o titular, que na tela vira link (SB-F5); titular vazio mantém o formato de hoje.
 */
const TITULAR_SINTETICO = 'Fulana de Tal Exemplo';

describe('montarLinhaDeDireitos com titular (SB-F4)', () => {
  it('no ano de lançamento, põe o titular entre o ano e o nome do caderno', () => {
    expect(montarLinhaDeDireitos('1.0.0.0', 2026, 2026, TITULAR_SINTETICO)).toBe(
      'v1.0.0.0 · © 2026 Fulana de Tal Exemplo · Caderno de Direito'
    );
  });

  it('com a faixa de anos, o titular vem depois da faixa', () => {
    expect(montarLinhaDeDireitos('1.0.0.0', 2026, 2027, TITULAR_SINTETICO)).toBe(
      'v1.0.0.0 · © 2026-2027 Fulana de Tal Exemplo · Caderno de Direito'
    );
  });

  it('titular vazio ou só com espaços devolve o formato de hoje, sem "undefined" nem vão duplo', () => {
    const formatoDeHoje = 'v1.0.0.0 · © 2026 Caderno de Direito';
    expect(montarLinhaDeDireitos('1.0.0.0', 2026, 2026, '')).toBe(formatoDeHoje);
    expect(montarLinhaDeDireitos('1.0.0.0', 2026, 2026, '   ')).toBe(formatoDeHoje);
    expect(montarLinhaDeDireitos('1.0.0.0', 2026, 2026)).toBe(formatoDeHoje);
  });

  it('tira espaços das bordas do titular', () => {
    expect(montarLinhaDeDireitos('1.0.0.0', 2026, 2026, '  Fulana de Tal Exemplo  ')).toBe(
      'v1.0.0.0 · © 2026 Fulana de Tal Exemplo · Caderno de Direito'
    );
  });

  it('separa a linha em antes, titular e depois, para a tela pôr o link no meio', () => {
    expect(partesDaLinhaDeDireitos('1.0.0.0', 2026, 2026, TITULAR_SINTETICO)).toEqual({
      antes: 'v1.0.0.0 · © 2026 ',
      titular: TITULAR_SINTETICO,
      depois: ' · Caderno de Direito'
    });
  });

  it('sem titular, as partes devolvem a linha inteira em antes e nada no link', () => {
    expect(partesDaLinhaDeDireitos('1.0.0.0', 2026, 2026, '')).toEqual({
      antes: 'v1.0.0.0 · © 2026 Caderno de Direito',
      titular: '',
      depois: ''
    });
  });
});
