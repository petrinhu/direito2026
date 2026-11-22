import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FERIADOS } from '@/conteudo/calendario/feriados';

const feriadosDoSemestre = FERIADOS.filter((f) => f.semestre === '2026.2');

/**
 * Os feriados municipais do Recife não têm fonte oficial conferida (leitura de
 * 22/11/2026: o portal da Prefeitura não resolveu e a lei citada só apareceu em
 * fonte não oficial). O comentário de cada um traz essa nota, e o teste lê o
 * arquivo para travá-la e impedir a volta de fonte secundária.
 */
const NOTA_SEM_FONTE = 'sem fonte oficial conferida em 22/11/2026';

const CAMINHO_FONTE = resolve(__dirname, '../../src/conteudo/calendario/feriados.ts');
const fonte = readFileSync(CAMINHO_FONTE, 'utf-8');

/**
 * Texto entre o item anterior (o último `}` antes do feriado) e o `{` do
 * próprio feriado: é o comentário que fica logo acima dele, e só ele. Um
 * comentário de feriado anterior não pode valer para este.
 */
function comentarioAcima(titulo: string): string {
  const indice = fonte.indexOf(`titulo: '${titulo}'`);
  expect(indice).toBeGreaterThan(-1);
  const antes = fonte.slice(0, indice);
  const inicioDoObjeto = antes.lastIndexOf('{');
  const fimDoAnterior = antes.lastIndexOf('}', inicioDoObjeto);
  return antes.slice(fimDoAnterior + 1, inicioDoObjeto);
}

const municipais = () =>
  feriadosDoSemestre.filter((f) => f.descricao === 'Feriado municipal do Recife.');

describe('feriados municipais do Recife: nota de fonte', () => {
  it('16/07 e 08/12 estão presentes na janela (outro município novo não quebra)', () => {
    expect(municipais().map((f) => f.inicio)).toEqual(
      expect.arrayContaining(['2026-07-16', '2026-12-08'])
    );
  });

  it('todo feriado municipal do semestre traz a nota de fonte no comentário logo acima dele', () => {
    expect(municipais().length).toBeGreaterThan(0);
    for (const f of municipais()) {
      expect(comentarioAcima(f.titulo), f.titulo).toContain(NOTA_SEM_FONTE);
    }
  });

  it('o comentário do feriado de 16/07 traz a nota de fonte', () => {
    expect(comentarioAcima('Nossa Senhora do Carmo')).toContain(NOTA_SEM_FONTE);
  });

  it('o comentário do feriado de 08/12 traz a nota de fonte', () => {
    expect(comentarioAcima('Nossa Senhora da Conceição')).toContain(NOTA_SEM_FONTE);
  });

  it('não há mais marca de fonte secundária nem pendência de conferência', () => {
    expect(fonte).not.toMatch(/secundári/i);
    expect(fonte).not.toMatch(/\bpendência/i);
    expect(fonte).not.toMatch(/TRT6/);
    expect(fonte).not.toMatch(/Diário de Pernambuco/);
  });

  it('São João (24/06) não entra: a janela começa em 01/07/2026', () => {
    expect(feriadosDoSemestre.map((f) => f.inicio)).not.toContain('2026-06-24');
    expect(feriadosDoSemestre.every((f) => f.inicio >= '2026-07-01')).toBe(true);
  });
});
