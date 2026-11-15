import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { verificarParidade } from '@/core/versoes/paridade';

/**
 * HIST-F4 (plano da onda paralela, portão de paridade): relativo ao package.json, nunca a uma versão
 * literal. Toda versão de docs/versoes/novidades.json existe no histórico. O histórico pode ter UMA
 * versão a mais que o package.json (a que vai sair, gravada antes do publicar). No clone da tag, o topo
 * do histórico = o package.json = o topo do novidades.json.
 */
const RAIZ = resolve(__dirname, '../..');
const PACOTE_REAL = JSON.parse(readFileSync(resolve(RAIZ, 'package.json'), 'utf-8'))
  .version as string;
const HISTORICO_REAL = JSON.parse(
  readFileSync(resolve(RAIZ, 'src/dados/versoes/historico.json'), 'utf-8')
);
const NOVIDADES_REAL = JSON.parse(
  readFileSync(resolve(RAIZ, 'docs/versoes/novidades.json'), 'utf-8')
);

function entrada(versao: string) {
  return { versao, data: '2026-11-15', didatico: ['x'], tecnico: ['y'] };
}
function novidades(...versoes: string[]) {
  return { versoes: versoes.map((versao) => ({ versao, novidades: ['tecnica'] })) };
}

describe('verificarParidade com os arquivos reais', () => {
  it('o repositório passa no modo de desenvolvimento', () => {
    expect(
      verificarParidade({
        historico: HISTORICO_REAL,
        novidades: NOVIDADES_REAL,
        pacote: PACOTE_REAL
      })
    ).toEqual({ ok: true });
  });

  it('no clone da tag, topo do histórico = pacote = topo do novidades.json', () => {
    const modoTag = verificarParidade({
      historico: HISTORICO_REAL,
      novidades: NOVIDADES_REAL,
      pacote: PACOTE_REAL,
      clonDaTag: true
    });
    expect(modoTag).toEqual({ ok: true });
  });
});

describe('verificarParidade, regras', () => {
  it('versão de novidades.json que não está no histórico reprova', () => {
    const r = verificarParidade({
      historico: [entrada('1.0.0.0')],
      novidades: novidades('2.0.0.0'),
      pacote: '1.0.0.0'
    });
    expect(r.ok).toBe(false);
  });

  it('histórico com duas versões a mais que o pacote reprova', () => {
    const historico = [entrada('1.0.0.0'), entrada('1.1.0.0'), entrada('1.2.0.0')];
    const r = verificarParidade({ historico, novidades: novidades('1.0.0.0'), pacote: '1.0.0.0' });
    expect(r.ok).toBe(false);
  });

  it('uma versão a mais que o pacote é aceita no desenvolvimento, mas não no clone da tag', () => {
    const historico = [entrada('1.0.0.0'), entrada('1.1.0.0')];
    expect(
      verificarParidade({ historico, novidades: novidades('1.0.0.0'), pacote: '1.0.0.0' }).ok
    ).toBe(true);
    expect(
      verificarParidade({
        historico,
        novidades: novidades('1.0.0.0'),
        pacote: '1.0.0.0',
        clonDaTag: true
      }).ok
    ).toBe(false);
  });

  it('no clone da tag, o topo do novidades.json tem de ser o pacote', () => {
    const historico = [entrada('1.1.0.0'), entrada('1.0.0.0')];
    const r = verificarParidade({
      historico,
      novidades: novidades('1.0.0.0'),
      pacote: '1.1.0.0',
      clonDaTag: true
    });
    expect(r.ok).toBe(false);
  });
});
