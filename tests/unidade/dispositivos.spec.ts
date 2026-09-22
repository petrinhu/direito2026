import { describe, expect, it } from 'vitest';
import { montarRotuloDispositivo } from '@/core/dispositivos/rotulo';
import { extrairCitacoes } from '@/core/dispositivos/extrairCitacoes';
import { validarDispositivo } from '@/core/dispositivos/validar';
import type { DispositivoLegal } from '@/core/dispositivos/tipos';

const cc186: DispositivoLegal = {
  id: 'cc-186',
  diploma: 'Código Civil',
  diplomaSigla: 'CC',
  artigo: '186',
  texto: 'Aquele que, por ação ou omissão voluntária...',
  urlFonte: 'https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm',
  dataConsulta: '2026-09-21'
};

const cpc319ii: DispositivoLegal = {
  id: 'cpc-319-ii',
  diploma: 'Código de Processo Civil',
  diplomaSigla: 'CPC',
  artigo: '319',
  inciso: 'II',
  texto: 'os nomes, os prenomes, o estado civil...',
  urlFonte: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm',
  dataConsulta: '2026-09-21'
};

describe('montarRotuloDispositivo', () => {
  it('sem inciso: sigla e artigo', () => {
    expect(montarRotuloDispositivo(cc186)).toBe('art. 186 do CC');
  });

  it('com inciso: sigla, artigo e inciso', () => {
    expect(montarRotuloDispositivo(cpc319ii)).toBe('art. 319, II, do CPC');
  });
});

describe('extrairCitacoes', () => {
  it('extrai um data-dispositivo de um botão de citação', () => {
    const html = 'Ver <button data-dispositivo="cc-186">art. 186</button> do CC.';
    expect(extrairCitacoes(html)).toEqual(['cc-186']);
  });

  it('extrai várias citações, com duplicata contada só uma vez', () => {
    const html =
      '<button data-dispositivo="cc-186">a</button> e de novo ' +
      '<button data-dispositivo="cc-186">b</button> mais ' +
      '<button data-dispositivo="cpc-319-ii">c</button>';
    expect(extrairCitacoes(html).sort()).toEqual(['cc-186', 'cpc-319-ii']);
  });

  it('sem citação nenhuma devolve lista vazia', () => {
    expect(extrairCitacoes('<p>sem citação</p>')).toEqual([]);
  });
});

describe('validarDispositivo', () => {
  it('dispositivo completo não tem campo faltando', () => {
    expect(validarDispositivo(cc186)).toEqual([]);
  });

  it('dispositivo sem urlFonte reporta o campo que falta', () => {
    const incompleto = { ...cc186, urlFonte: '' };
    expect(validarDispositivo(incompleto)).toEqual(['urlFonte']);
  });
});
