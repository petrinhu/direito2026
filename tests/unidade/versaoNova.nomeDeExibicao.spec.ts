import { describe, expect, it } from 'vitest';
import { nomeDeExibicao } from '@/core/versaoNova/nomeDeExibicao';

/**
 * Nome no banner de versão nova (AV-F1). Regra do líder (14/11/2026, item 46c): ponto,
 * sublinhado e hífen viram espaço, e cada parte começa com maiúscula. O login aceito
 * (`^[A-Za-z0-9._-]{3,32}$`) é ASCII, mas a função aceita letra Unicode por segurança.
 */
describe('nomeDeExibicao: separadores viram espaço, cada parte com maiúscula', () => {
  it.each([
    ['ana.paula', 'Ana Paula'],
    ['joao_pedro', 'Joao Pedro'],
    ['maria-clara', 'Maria Clara'],
    ['ana..paula', 'Ana Paula'],
    ['ana__paula-x', 'Ana Paula X'],
    ['Ana', 'Ana'],
    ['2ana', '2Ana'],
    ['érica', 'Érica'],
    ['', '']
  ])('%s vira "%s"', (login, esperado) => {
    expect(nomeDeExibicao(login)).toBe(esperado);
  });
});
