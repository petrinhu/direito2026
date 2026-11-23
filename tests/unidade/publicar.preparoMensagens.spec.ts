import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * scripts/publicar.sh, mensagens do --preparar (PUB-PREPARAR-MSG). O --preparar troca o ponteiro
 * `atual` antes da conferência (trocar_ponteiro, em preparar_destinos), e o portão lê `atual`. Por
 * isso as mensagens de sucesso e de recusa não podem dizer que o público segue na versão atual nem
 * que nada foi virado. Este spec fixa o texto; o comportamento (a troca do ponteiro) não é testado aqui.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const FONTE = readFileSync(join(RAIZ, 'scripts/publicar.sh'), 'utf-8');

/** Corpo da função do publicar.sh; vazio se ela não existe (o caso então falha). */
function funcao(nome: string): string {
  const m = FONTE.match(new RegExp(`^${nome}\\(\\) \\{[\\s\\S]*?^\\}`, 'm'));
  return m ? m[0] : '';
}

describe('publicar.sh --preparar: mensagens batem com o que o ponteiro faz (PUB-PREPARAR-MSG)', () => {
  it('a função que prepara não contém a frase falsa "o público segue na versão atual"', () => {
    expect(funcao('preparar_destinos')).not.toBe('');
    expect(FONTE).not.toContain('o público segue na versão atual');
  });

  it('a recusa do preparo não diz "nada foi virado", porque o ponteiro já foi trocado', () => {
    expect(funcao('preparar_destinos')).not.toContain('nada foi virado');
  });

  it('a recusa do preparo diz que o ponteiro já aponta para a versão nova e que não foi desfeito', () => {
    const corpo = funcao('preparar_destinos');
    expect(corpo).toContain('o ponteiro atual já aponta para v$VERSAO_NOVA');
    expect(corpo).toContain('não desfeito');
  });

  it('a mensagem de sucesso do --preparar diz que o ponteiro já aponta para a versão nova', () => {
    expect(FONTE).toContain('O ponteiro atual já aponta para v$VERSAO_NOVA');
    expect(FONTE).toContain('pelo portão');
  });
});
