import { describe, expect, it } from 'vitest';
import { descreverEstado, transicionar, type EstadoRadio } from '@/core/radio/maquina';

describe('consentimento antes da primeira conexão (LGPD, item 77 e pedido de 21/11)', () => {
  it('sem consentimento, tocar só pede o aviso e não manda conectar', () => {
    expect(transicionar('parado', 'tocar', false)).toEqual({ estado: 'pedindoConsentimento' });
  });

  it('"Tocar mesmo assim" conecta; a gravação do consentimento é feita pela store', () => {
    expect(transicionar('pedindoConsentimento', 'consentir', false)).toEqual({
      estado: 'conectando',
      comando: 'conectar'
    });
  });

  it('"Cancelar" volta a parado e não conecta', () => {
    expect(transicionar('pedindoConsentimento', 'cancelar', false)).toEqual({ estado: 'parado' });
  });

  it('com consentimento já dado, tocar conecta direto, sem aviso', () => {
    expect(transicionar('parado', 'tocar', true)).toEqual({
      estado: 'conectando',
      comando: 'conectar'
    });
  });

  it('consentir ou cancelar fora do aviso não muda nada', () => {
    expect(transicionar('tocando', 'consentir', true)).toEqual({ estado: 'tocando' });
    expect(transicionar('parado', 'cancelar', false)).toEqual({ estado: 'parado' });
  });
});

describe('máquina de estados: conectando, tocando e erro', () => {
  it('conectando vira tocando quando o áudio começa', () => {
    expect(transicionar('conectando', 'tocando', true)).toEqual({ estado: 'tocando' });
  });

  it('espera do stream (waiting/stalled) volta a conectando', () => {
    expect(transicionar('tocando', 'aguardar', true)).toEqual({ estado: 'conectando' });
  });

  it('falha ao conectar ou cair no meio vai para erro e desconecta', () => {
    expect(transicionar('conectando', 'falhar', true)).toEqual({
      estado: 'erro',
      comando: 'desconectar'
    });
    expect(transicionar('tocando', 'falhar', true)).toEqual({
      estado: 'erro',
      comando: 'desconectar'
    });
  });

  it('"Tentar de novo" no erro conecta outra vez', () => {
    expect(transicionar('erro', 'tocar', true)).toEqual({
      estado: 'conectando',
      comando: 'conectar'
    });
  });

  it('parar, em qualquer estado ativo, desconecta', () => {
    for (const estado of ['conectando', 'tocando', 'erro'] as const) {
      expect(transicionar(estado, 'parar', true)).toEqual({
        estado: 'parado',
        comando: 'desconectar'
      });
    }
  });

  it('evento tardio do elemento com a rádio parada é ignorado (o próprio stop dispara error/abort/emptied)', () => {
    expect(transicionar('parado', 'falhar', true)).toEqual({ estado: 'parado' });
    expect(transicionar('parado', 'tocando', true)).toEqual({ estado: 'parado' });
    expect(transicionar('parado', 'aguardar', true)).toEqual({ estado: 'parado' });
  });

  it('tocar com a rádio já conectando ou tocando não reconecta', () => {
    expect(transicionar('tocando', 'tocar', true)).toEqual({ estado: 'tocando' });
    expect(transicionar('conectando', 'tocar', true)).toEqual({ estado: 'conectando' });
  });
});

describe('descreverEstado (texto do aviso para leitor de tela)', () => {
  const nome = 'Radio Swiss Classic';
  const casos: Array<[EstadoRadio, string]> = [
    ['parado', 'Rádio parada'],
    ['pedindoConsentimento', 'Aguardando a sua confirmação antes de conectar'],
    ['conectando', 'Conectando a Radio Swiss Classic'],
    ['tocando', 'Tocando Radio Swiss Classic'],
    ['erro', 'Não foi possível tocar Radio Swiss Classic. Tente de novo.']
  ];
  for (const [estado, texto] of casos) {
    it(`${estado} anuncia "${texto}"`, () => {
      expect(descreverEstado(estado, nome)).toBe(texto);
    });
  }

  it('nenhum texto anunciado usa travessão', () => {
    for (const [estado] of casos) {
      expect(descreverEstado(estado, 'Venice Classic Radio')).not.toMatch(/[–—]/);
    }
  });
});
