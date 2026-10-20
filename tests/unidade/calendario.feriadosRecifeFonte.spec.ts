import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FERIADOS_2026_2 } from '@/conteudo/calendario/feriados';

/**
 * Fonte oficial dos feriados municipais do Recife (confirmada pelo líder,
 * 20/10/2026). A fonte fica em comentário, então o teste lê o arquivo: trava
 * a fonte nos dois feriados municipais e impede a volta das fontes secundárias
 * e da pendência antiga.
 */
const FONTE_OFICIAL =
  'Prefeitura do Recife, https://www2.recife.pe.gov.br/pagina/feriados (Lei Municipal nº 9.777, de junho de 1967)';

const CAMINHO_FONTE = resolve(__dirname, '../../src/conteudo/calendario/feriados.ts');
const fonte = readFileSync(CAMINHO_FONTE, 'utf-8');

function comentarioAcima(titulo: string): string {
  const indice = fonte.indexOf(`titulo: '${titulo}'`);
  expect(indice).toBeGreaterThan(-1);
  const antes = fonte.slice(0, indice);
  const inicioDoObjeto = antes.lastIndexOf('{');
  return antes.slice(0, inicioDoObjeto);
}

describe('feriados municipais do Recife: fonte oficial', () => {
  it('são 16/07 e 08/12, e os dois existem na janela', () => {
    const municipais = FERIADOS_2026_2.filter(
      (f) => f.descricao === 'Feriado municipal do Recife.'
    );
    expect(municipais.map((f) => f.inicio)).toEqual(['2026-07-16', '2026-12-08']);
  });

  it('o comentário do feriado de 16/07 traz a fonte oficial', () => {
    expect(comentarioAcima('Nossa Senhora do Carmo')).toContain(FONTE_OFICIAL);
  });

  it('o comentário do feriado de 08/12 traz a fonte oficial', () => {
    expect(comentarioAcima('Nossa Senhora da Conceição')).toContain(FONTE_OFICIAL);
  });

  it('não há mais marca de fonte secundária nem pendência de conferência', () => {
    expect(fonte).not.toMatch(/secundári/i);
    expect(fonte).not.toMatch(/\bpendência/i);
    expect(fonte).not.toMatch(/TRT6/);
    expect(fonte).not.toMatch(/Diário de Pernambuco/);
  });

  it('São João (24/06) não entra: a janela começa em 01/07/2026', () => {
    expect(FERIADOS_2026_2.map((f) => f.inicio)).not.toContain('2026-06-24');
    expect(FERIADOS_2026_2.every((f) => f.inicio >= '2026-07-01')).toBe(true);
  });
});
