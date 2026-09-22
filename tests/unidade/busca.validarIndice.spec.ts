import { describe, expect, it } from 'vitest';
import { validarIndiceGerado } from '@/core/busca/validarIndice';
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

  it('reprova quando o índice passa do teto de tamanho, mesmo com documentos', () => {
    const resultado = validarIndiceGerado(16, TETO_INDICE_BUSCA_BYTES + 1);
    expect(resultado.ok).toBe(false);
    expect(resultado.mensagens.join(' ')).toMatch(/passou do teto/);
  });

  it('acumula as duas mensagens quando os dois problemas ocorrem juntos', () => {
    const resultado = validarIndiceGerado(0, TETO_INDICE_BUSCA_BYTES + 1);
    expect(resultado.ok).toBe(false);
    expect(resultado.mensagens).toHaveLength(2);
  });
});
