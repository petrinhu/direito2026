import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { verificarParidade } from '@/core/versoes/paridade';

/**
 * HIST-F4 (portão de paridade), revisão HIST ALTO 2. Relativo ao package.json, nunca a uma versão literal.
 * Dois estados aceitos na árvore (a publicação grava o histórico ANTES do commit de release, que só toca
 * package.json e novidades.json, publicar.sh:392):
 *   A: o topo do histórico é a SEGUINTE ao pacote (uma subida de um degrau: patch, minor, major ou
 *      a subida de um degrau no 3º campo) e a segunda é o pacote;
 *   B: o topo do histórico é o pacote.
 * No clone da tag só vale B, e o topo do novidades.json é o pacote.
 */
const RAIZ = resolve(__dirname, '../..');
const PACOTE_REAL = JSON.parse(readFileSync(resolve(RAIZ, 'package.json'), 'utf-8')).version as string;
const HISTORICO_REAL = JSON.parse(readFileSync(resolve(RAIZ, 'src/dados/versoes/historico.json'), 'utf-8'));
const NOVIDADES_REAL = JSON.parse(readFileSync(resolve(RAIZ, 'docs/versoes/novidades.json'), 'utf-8'));

function entrada(versao: string) {
  return { versao, data: '2026-11-15', didatico: ['x'], tecnico: ['y'] };
}
function novidades(...versoes: string[]) {
  return { versoes: versoes.map((versao) => ({ versao, novidades: ['tecnica'] })) };
}

describe('verificarParidade com os arquivos reais (modo de desenvolvimento)', () => {
  it('o repositório passa: estado A ou estado B', () => {
    expect(verificarParidade({ historico: HISTORICO_REAL, novidades: NOVIDADES_REAL, pacote: PACOTE_REAL })).toEqual({ ok: true });
  });
});

describe('verificarParidade, estados aceitos', () => {
  it('estado B: o topo do histórico é o pacote', () => {
    const historico = [entrada('1.0.0.0'), entrada('1.1.0.0')];
    expect(verificarParidade({ historico, novidades: novidades('1.1.0.0'), pacote: '1.1.0.0' })).toEqual({ ok: true });
  });

  it('estado A: o topo é a seguinte (uma subida de um degrau) e a segunda é o pacote', () => {
    const historico = [entrada('1.0.0.0'), entrada('1.0.0.1')];
    expect(verificarParidade({ historico, novidades: novidades('1.0.0.0'), pacote: '1.0.0.0' })).toEqual({ ok: true });
    const minor = [entrada('1.0.0.0'), entrada('1.1.0.0')];
    expect(verificarParidade({ historico: minor, novidades: novidades('1.0.0.0'), pacote: '1.0.0.0' })).toEqual({ ok: true });
  });
});

describe('verificarParidade, estados inválidos (C)', () => {
  it('topo que não é a seguinte (pulou versões) reprova, mesmo com um só acima do pacote', () => {
    const historico = [entrada('1.13.0.0'), entrada('1.20.0.0')];
    const r = verificarParidade({ historico, novidades: novidades('1.13.0.0'), pacote: '1.13.0.0' });
    expect(r.ok).toBe(false);
  });

  it('topo de um degrau, mas a segunda não é o pacote, reprova', () => {
    const historico = [entrada('1.12.0.0'), entrada('1.14.0.0')];
    const r = verificarParidade({ historico, novidades: novidades('1.12.0.0'), pacote: '1.13.0.0' });
    expect(r.ok).toBe(false);
  });

  it('versão de novidades.json que não está no histórico reprova', () => {
    const r = verificarParidade({ historico: [entrada('1.0.0.0')], novidades: novidades('2.0.0.0'), pacote: '1.0.0.0' });
    expect(r.ok).toBe(false);
  });

  it('pacote fora do formato A.B.C.D reprova', () => {
    const historico = [entrada('1.0.0.0')];
    expect(verificarParidade({ historico, novidades: novidades('1.0.0.0'), pacote: 'x' }).ok).toBe(false);
  });
});

describe('verificarParidade, clone da tag', () => {
  it('estado B no clone: topo do histórico e topo do novidades.json são o pacote', () => {
    const historico = [entrada('1.0.0.0'), entrada('1.1.0.0')];
    expect(verificarParidade({ historico, novidades: novidades('1.1.0.0'), pacote: '1.1.0.0', clonDaTag: true })).toEqual({ ok: true });
  });

  it('o estado A não vale no clone: o topo tem de ser o pacote', () => {
    const historico = [entrada('1.0.0.0'), entrada('1.1.0.0')];
    expect(verificarParidade({ historico, novidades: novidades('1.0.0.0'), pacote: '1.0.0.0', clonDaTag: true }).ok).toBe(false);
  });

  it('no clone, o topo do novidades.json tem de ser o pacote', () => {
    const historico = [entrada('1.1.0.0'), entrada('1.0.0.0')];
    expect(verificarParidade({ historico, novidades: novidades('1.0.0.0'), pacote: '1.1.0.0', clonDaTag: true }).ok).toBe(false);
  });
});
