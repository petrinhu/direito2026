import { describe, expect, it } from 'vitest';
import { ErroDeArgumento, interpretarArgumentos } from '../../scripts/apoio/novaUnidade/argumentos';

/**
 * Formato dos argumentos do `npm run nova-unidade` (F6). Um teste por regra
 * (L-35): cada caso quebra uma coisa e nomeia o valor ruim na mensagem.
 */
describe('interpretarArgumentos: formatos aceitos', () => {
  it('devolve os quatro posicionais e as flags vazias', () => {
    expect(interpretarArgumentos(['p1', 'filosofia-juridica', 'u4', 'Título'])).toEqual({
      periodo: 'p1',
      cadeira: 'filosofia-juridica',
      unidade: 'u4',
      titulo: 'Título',
      peticao: false
    });
  });

  it('lê --peticao e --cadeira "Nome"', () => {
    const lido = interpretarArgumentos([
      'p10',
      'sociologia-juridica',
      'u12',
      'Título',
      '--peticao',
      '--cadeira',
      'Sociologia Jurídica'
    ]);
    expect(lido.peticao).toBe(true);
    expect(lido.nomeCadeira).toBe('Sociologia Jurídica');
    expect(lido.periodo).toBe('p10');
  });

  it('lê --raiz para apontar outra raiz de projeto (uso em teste)', () => {
    const lido = interpretarArgumentos(['p1', 'x', 'u1', 'T', '--raiz', '/var/tmp/copia']);
    expect(lido.raiz).toBe('/var/tmp/copia');
  });
});

describe('interpretarArgumentos: formatos recusados', () => {
  it.each(['p0', 'p11', 'P1', '1', 'p01', 'pp1', 'p1a'])('periodo %s é recusado', (periodo) => {
    expect(() => interpretarArgumentos([periodo, 'x-y', 'u1', 'T'])).toThrow(ErroDeArgumento);
    expect(() => interpretarArgumentos([periodo, 'x-y', 'u1', 'T'])).toThrow(`"${periodo}"`);
  });

  it.each([
    'Filosofia Jurídica',
    'filosofia_juridica',
    'Filosofia',
    'filosofia--juridica',
    '-filosofia',
    'filosofia-',
    'filosofia-jurídica',
    'filosofia juridica'
  ])('cadeira "%s" fora do kebab-case sem acento é recusada', (cadeira) => {
    expect(() => interpretarArgumentos(['p1', cadeira, 'u1', 'T'])).toThrow(ErroDeArgumento);
  });

  it.each(['u0', 'u', '3', 'U3', 'u03', 'unidade3'])('unidade %s é recusada', (unidade) => {
    expect(() => interpretarArgumentos(['p1', 'x-y', unidade, 'T'])).toThrow(ErroDeArgumento);
  });

  it('título vazio ou só com espaço é recusado', () => {
    expect(() => interpretarArgumentos(['p1', 'x-y', 'u1', '   '])).toThrow(ErroDeArgumento);
  });

  it('--cadeira sem nome é recusado', () => {
    expect(() => interpretarArgumentos(['p1', 'x-y', 'u1', 'T', '--cadeira', ' '])).toThrow(
      ErroDeArgumento
    );
  });

  it('falta de posicional e excesso de posicional são recusados', () => {
    expect(() => interpretarArgumentos(['p1', 'x-y', 'u1'])).toThrow(ErroDeArgumento);
    expect(() => interpretarArgumentos(['p1', 'x-y', 'u1', 'T', 'extra'])).toThrow(ErroDeArgumento);
  });

  it('flag desconhecida é recusada', () => {
    expect(() => interpretarArgumentos(['p1', 'x-y', 'u1', 'T', '--forca'])).toThrow(
      ErroDeArgumento
    );
  });
});
