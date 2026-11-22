import { describe, expect, it } from 'vitest';
import { compararContagensIndice, validarIndiceGerado } from '@/core/busca/validarIndice';
import { TETO_INDICE_BUSCA_BYTES } from '@/core/busca/tipos';

/**
 * Item 9 da onda: prova, com teste real (não suposição), que
 * scripts/gerar-indice-busca.ts reprova quando indexa zero documento
 * (piso de varredura, L-36). A validação foi extraída para
 * src/core/busca/validarIndice.ts (Foundation, sem I/O) justamente para
 * este teste poder exercitar o caminho de falha sem precisar montar um
 * currículo de teste inteiro no disco - o script real (linha "if
 * (documentos.length === 0)") chama exatamente esta função.
 */
describe('validarIndiceGerado: piso de varredura do índice de busca', () => {
  it('reprova (ok=false) quando zero documento foi indexado', () => {
    const resultado = validarIndiceGerado(0, 0);
    expect(resultado.ok).toBe(false);
    expect(resultado.mensagens.join(' ')).toMatch(/zero documento indexado/);
  });

  it('aprova quando há pelo menos um documento e o tamanho está dentro do teto', () => {
    const resultado = validarIndiceGerado(16, 63_812);
    expect(resultado.ok).toBe(true);
    expect(resultado.mensagens).toEqual([]);
  });

  it('reprova quando o índice comprimido passa do teto de tamanho, mesmo com documentos', () => {
    const resultado = validarIndiceGerado(16, TETO_INDICE_BUSCA_BYTES + 1);
    expect(resultado.ok).toBe(false);
    expect(resultado.mensagens.join(' ')).toMatch(/passou do teto/);
    expect(resultado.mensagens.join(' ')).toMatch(/bytes comprimidos/);
  });

  it('acumula as duas mensagens quando os dois problemas ocorrem juntos', () => {
    const resultado = validarIndiceGerado(0, TETO_INDICE_BUSCA_BYTES + 1);
    expect(resultado.ok).toBe(false);
    expect(resultado.mensagens).toHaveLength(2);
  });
});

/**
 * INDICE-NM: N (documentos encontrados) e M (documentos de fato indexados no
 * MiniSearch) têm de bater. O cabeçalho de scripts/gerar-indice-busca.ts
 * promete saída com erro quando divergem; o script antes imprimia a mesma
 * contagem duas vezes e nunca comparava.
 */
describe('compararContagensIndice: encontrados (N) contra indexados (M)', () => {
  it('aprova quando N e M são iguais e positivos', () => {
    const resultado = compararContagensIndice(486, 486);
    expect(resultado.ok).toBe(true);
    expect(resultado.mensagens).toEqual([]);
  });

  it('reprova quando M é menor que N, e a mensagem traz os dois números', () => {
    const resultado = compararContagensIndice(486, 480);
    expect(resultado.ok).toBe(false);
    const texto = resultado.mensagens.join(' ');
    expect(texto).toMatch(/486/);
    expect(texto).toMatch(/480/);
    expect(texto).toMatch(/divergi/);
  });

  it('reprova quando M é maior que N', () => {
    const resultado = compararContagensIndice(10, 11);
    expect(resultado.ok).toBe(false);
    expect(resultado.mensagens.join(' ')).toMatch(/divergi/);
  });
});
