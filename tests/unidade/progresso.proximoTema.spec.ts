import { describe, expect, it } from 'vitest';
import { proximoTema } from '@/core/progresso/proximoTema';

describe('proximoTema', () => {
  it('cicla sistema -> claro -> escuro -> sistema', () => {
    expect(proximoTema('sistema')).toBe('claro');
    expect(proximoTema('claro')).toBe('escuro');
    expect(proximoTema('escuro')).toBe('sistema');
  });
});
