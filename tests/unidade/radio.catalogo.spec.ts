import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { RADIOS, RADIO_PADRAO, ehIdRadio, radioPorId } from '@/core/radio/catalogo';

const RAIZ = fileURLToPath(new URL('../..', import.meta.url));

describe('catálogo do tocador (item 47: as 5 fixas, com crédito)', () => {
  it('traz exatamente as 5 rádios fixas, sem reservas', () => {
    expect(RADIOS.map((r) => r.nome)).toEqual([
      'Radio Swiss Classic',
      'Venice Classic Radio',
      'Ambient Sleeping Pill',
      'ambient.fm',
      '0N-Chillout'
    ]);
  });

  it('cada rádio tem link de stream https e site da emissora para o crédito', () => {
    for (const radio of RADIOS) {
      expect(new URL(radio.url).protocol).toBe('https:');
      expect(new URL(radio.site).protocol).toBe('https:');
    }
  });

  it('a rádio padrão é a Radio Swiss Classic', () => {
    expect(RADIO_PADRAO).toBe('radio-swiss-classic');
    expect(radioPorId(RADIO_PADRAO).nome).toBe('Radio Swiss Classic');
  });

  it('id desconhecido cai na rádio padrão, sem lançar erro (valor vindo do armazenamento)', () => {
    expect(radioPorId('minha-radio-colada')).toBe(radioPorId(RADIO_PADRAO));
    expect(radioPorId(42)).toBe(radioPorId(RADIO_PADRAO));
    expect(radioPorId(null)).toBe(radioPorId(RADIO_PADRAO));
  });

  it('ehIdRadio aceita só os ids do catálogo', () => {
    for (const radio of RADIOS) expect(ehIdRadio(radio.id)).toBe(true);
    expect(ehIdRadio('http://evil.example/stream')).toBe(false);
    expect(ehIdRadio(undefined)).toBe(false);
  });

  it('cada host de stream está na media-src da CSP de telas.php (e nenhum host aberto)', () => {
    const fonte = readFileSync(join(RAIZ, 'public', 'api', 'nucleo', 'telas.php'), 'utf8');
    const csp = /PORTAO_CSP_SHELL = "([^"]+)"/.exec(fonte)?.[1] ?? '';
    const midia = /media-src ([^;]+);/.exec(csp)?.[1]?.split(' ') ?? [];
    expect(midia).not.toContain('https:');
    expect(midia).not.toContain('*');
    for (const radio of RADIOS) {
      const u = new URL(radio.url);
      const origem = `${u.protocol}//${u.host}`;
      expect(midia).toContain(origem);
    }
  });
});
