import { randomBytes } from 'node:crypto';
import { gunzipSync, gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { medirTamanhoComprimido } from '../../scripts/apoio/medirIndiceComprimido';
import { validarIndiceGerado } from '@/core/busca/validarIndice';
import { TETO_INDICE_BUSCA_BYTES } from '@/core/busca/tipos';

/**
 * RI6 (docs/arquitetura.md, seção 7): o teto de 300 KB é sobre o JSON
 * COMPRIMIDO. O portão mede gzip nível 9 do mesmo texto gravado em disco.
 * Estes casos provam a medição de verdade (zlib real), não um número
 * inventado: um índice cru acima do teto que comprime abaixo dele aprova;
 * um que não comprime (ruído) reprova.
 */
describe('medirTamanhoComprimido: medição do índice pelo tamanho gzip', () => {
  it('aprova um índice que passa do teto em bruto mas fica abaixo dele comprimido', () => {
    const json = JSON.stringify({ corpo: 'texto jurídico repetitivo '.repeat(20_000) });
    expect(Buffer.byteLength(json, 'utf-8')).toBeGreaterThan(TETO_INDICE_BUSCA_BYTES);

    const comprimido = medirTamanhoComprimido(json);

    expect(comprimido).toBeLessThan(TETO_INDICE_BUSCA_BYTES);
    expect(validarIndiceGerado(16, comprimido).ok).toBe(true);
  });

  it('mede o gzip de nível 9 do texto em UTF-8, o mesmo formato que o portão promete', () => {
    const json = JSON.stringify({ titulo: 'Império do Direito, ação', corpo: 'x'.repeat(5_000) });

    const comprimido = medirTamanhoComprimido(json);

    expect(comprimido).toBe(gzipSync(Buffer.from(json, 'utf-8'), { level: 9 }).byteLength);
    expect(gunzipSync(gzipSync(Buffer.from(json, 'utf-8'), { level: 9 })).toString('utf-8')).toBe(
      json
    );
  });

  it('reprova um índice cujo conteúdo não comprime e passa do teto comprimido', () => {
    const json = randomBytes(TETO_INDICE_BUSCA_BYTES + 16_384).toString('hex');

    const comprimido = medirTamanhoComprimido(json);
    // Precondição do caso: o ruído tem de continuar acima do teto depois do gzip.
    expect(comprimido).toBeGreaterThan(TETO_INDICE_BUSCA_BYTES);

    const resultado = validarIndiceGerado(16, comprimido);
    expect(resultado.ok).toBe(false);
    expect(resultado.mensagens.join(' ')).toMatch(/comprimidos/);
  });
});
