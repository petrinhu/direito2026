import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import type { Curriculo } from '@/core/curriculo/tipos';
import {
  analisarNovidade,
  textoFinalDoItem,
  validarNovidades,
  travaDeTermos,
  verificarComScript
} from '../../scripts/apoio/novidades';

/**
 * Novidades da publicação (AV-F3). Currículo e termos SINTÉTICOS: nenhum nome real, e a
 * lista privada nunca é aberta. O termo proibido de teste vem de um arquivo temporário,
 * pela variável VERIFICAR_PROIBICOES_TERMOS (padrão do portão).
 */
const CURRICULO: Curriculo = [
  {
    id: 'p1',
    numero: 1,
    rotulo: '1º período',
    cadeiras: [
      { id: 'filosofia-juridica', nome: 'Filosofia Jurídica', estado: 'publicado', unidades: [] },
      {
        id: 'interdisciplinar',
        nome: 'Interdisciplinar',
        estado: 'publicado',
        restrita: true,
        unidades: []
      }
    ]
  }
];

const TERMO_SINTETICO = 'termosinteticoxyz';
const DIRETORIO = mkdtempSync(join(tmpdir(), 'novidades-spec-'));
const ARQUIVO_TERMOS = join(DIRETORIO, 'termos.txt');
writeFileSync(ARQUIVO_TERMOS, `${TERMO_SINTETICO}\n`, 'utf-8');
afterAll(() => rmSync(DIRETORIO, { recursive: true, force: true }));

const NAO_LIMPO = (texto: string): boolean => !texto.includes(TERMO_SINTETICO);

describe('analisarNovidade: tipo, cadeira e texto', () => {
  it('cadeira comum vira "<nome> (<período>) atualizada"', () => {
    const r = analisarNovidade('cadeira:p1/filosofia-juridica', CURRICULO);
    expect(r.ok && textoFinalDoItem(r.item)).toBe('Filosofia Jurídica (1º período) atualizada');
  });

  it('usabilidade vira "Novo: <texto>"', () => {
    const r = analisarNovidade('usabilidade:rádio para estudar', CURRICULO);
    expect(r.ok && textoFinalDoItem(r.item)).toBe('Novo: rádio para estudar');
  });

  it('tecnica vira "Melhoria técnica"', () => {
    const r = analisarNovidade('tecnica', CURRICULO);
    expect(r.ok && textoFinalDoItem(r.item)).toBe('Melhoria técnica');
  });

  it('tipo desconhecido recusa', () => {
    expect(analisarNovidade('blog:x', CURRICULO).ok).toBe(false);
  });

  it('cadeira inexistente recusa', () => {
    expect(analisarNovidade('cadeira:p1/nao-existe', CURRICULO).ok).toBe(false);
  });

  it('cadeira restrita não é anunciada por nome', () => {
    expect(analisarNovidade('cadeira:p1/interdisciplinar', CURRICULO).ok).toBe(false);
  });

  it('usabilidade de 41 caracteres recusa; de 40 passa', () => {
    expect(analisarNovidade(`usabilidade:${'a'.repeat(41)}`, CURRICULO).ok).toBe(false);
    expect(analisarNovidade(`usabilidade:${'a'.repeat(40)}`, CURRICULO).ok).toBe(true);
  });

  it('usabilidade com menos de 3 caracteres recusa', () => {
    expect(analisarNovidade('usabilidade:ab', CURRICULO).ok).toBe(false);
  });

  it('travessão (U+2013 e U+2014) recusa', () => {
    expect(analisarNovidade('usabilidade:rádio — estudar', CURRICULO).ok).toBe(false);
    expect(analisarNovidade('usabilidade:rádio – estudar', CURRICULO).ok).toBe(false);
  });

  it('aspas duplas, "<" e ">" recusam', () => {
    expect(analisarNovidade('usabilidade:rádio "novo"', CURRICULO).ok).toBe(false);
    expect(analisarNovidade('usabilidade:rádio <b>', CURRICULO).ok).toBe(false);
  });

  it('endereço (www, http e domínio) recusa', () => {
    expect(analisarNovidade('usabilidade:veja www.exemplo.com', CURRICULO).ok).toBe(false);
    expect(analisarNovidade('usabilidade:veja https://exemplo.org', CURRICULO).ok).toBe(false);
    expect(analisarNovidade('usabilidade:escreva a alguem@example.com', CURRICULO).ok).toBe(false);
  });

  it('texto final de mais de 60 caracteres recusa', () => {
    const nome = 'N'.repeat(60);
    const curriculo: Curriculo = [
      {
        id: 'p9',
        numero: 9,
        rotulo: '9º período',
        cadeiras: [{ id: 'longa', nome, estado: 'publicado', unidades: [] }]
      }
    ];
    expect(analisarNovidade('cadeira:p9/longa', curriculo).ok).toBe(false);
  });
});

describe('validarNovidades: quantidade e tipo de publicação', () => {
  it('recurso sem novidade recusa', () => {
    expect(validarNovidades('recurso', [], CURRICULO).ok).toBe(false);
  });

  it('correção sem novidade recusa', () => {
    expect(validarNovidades('correcao', [], CURRICULO).ok).toBe(false);
  });

  it('construção recebe "tecnica" sozinha, sem pedir', () => {
    const r = validarNovidades('construcao', [], CURRICULO);
    expect(r.ok && r.itens.map(textoFinalDoItem)).toEqual(['Melhoria técnica']);
  });

  it('seis novidades recusam; cinco passam', () => {
    const seis = Array.from({ length: 6 }, (_, i) => `usabilidade:recurso ${i}`);
    const cinco = seis.slice(0, 5);
    expect(validarNovidades('recurso', seis, CURRICULO).ok).toBe(false);
    expect(validarNovidades('recurso', cinco, CURRICULO).ok).toBe(true);
  });

  it('uma novidade inválida recusa a lista inteira', () => {
    expect(
      validarNovidades('recurso', ['usabilidade:rádio', 'cadeira:p1/nao-existe'], CURRICULO).ok
    ).toBe(false);
  });
});

describe('trava de termos: recusa sem imprimir o termo', () => {
  const ambiente = process.env.VERIFICAR_PROIBICOES_TERMOS;
  process.env.VERIFICAR_PROIBICOES_TERMOS = ARQUIVO_TERMOS;
  afterAll(() => {
    if (ambiente === undefined) delete process.env.VERIFICAR_PROIBICOES_TERMOS;
    else process.env.VERIFICAR_PROIBICOES_TERMOS = ambiente;
  });

  it('texto sem o termo passa pela trava real (o script)', () => {
    expect(verificarComScript('usabilidade: rádio para estudar')).toBe(true);
  });

  it('texto com o termo sintético recusa pela trava real (o script)', () => {
    expect(verificarComScript(`usabilidade: ${TERMO_SINTETICO}`)).toBe(false);
  });

  it('a novidade com o termo sintético é recusada, e o motivo não traz o termo', () => {
    const r = analisarNovidade(`usabilidade:${TERMO_SINTETICO}`, CURRICULO, verificarComScript);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).not.toContain(TERMO_SINTETICO);
  });

  it('travaDeTermos aceita texto limpo com a checagem injetada', () => {
    expect(travaDeTermos('Novo: rádio', NAO_LIMPO)).toBe(true);
    expect(travaDeTermos(`Novo: ${TERMO_SINTETICO}`, NAO_LIMPO)).toBe(false);
  });
});
