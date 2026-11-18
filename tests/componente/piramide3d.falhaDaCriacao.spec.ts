// @vitest-environment jsdom
// PIR-H1: quando a cena 3D não abre, a figura devolve null, esvazia o palco e deixa a causa no console.
// Sem o aviso, a falha some em silêncio e a página só mostra a versão plana, sem rastro para quem investiga.
import { describe, expect, it, vi } from 'vitest';
import { criarFigura } from '@/ui/piramide3d/figura';
import type { OpcoesFigura } from '@/app/piramide3d/tiposMotor';

const cena = vi.hoisted(() => ({
  criar: vi.fn<(...args: unknown[]) => never>(() => {
    throw new Error('contexto indisponível');
  })
}));

vi.mock('@/ui/piramide3d/cena', () => ({
  criarCena: (...args: unknown[]) => cena.criar(...args)
}));

vi.mock('@/ui/piramide3d/controleSom', () => ({
  somDaPagina: () => ({ tocar: () => undefined })
}));

describe('falha na criação da cena 3D', () => {
  it('devolve null, esvazia o palco e registra a causa no console', () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const palco = document.createElement('div');
    document.body.appendChild(palco);
    const opcoes: OpcoesFigura = {
      palco,
      chave: 'piramide-kelsen',
      dados: { aria: 'descrição sintética', niveis: [] },
      reduzido: false,
      escuro: false
    };

    const figura = criarFigura(opcoes);

    // Montagem válida: a criação foi de fato tentada.
    expect(cena.criar).toHaveBeenCalledTimes(1);
    expect(figura).toBeNull();
    expect(palco.childElementCount).toBe(0);

    const avisos = aviso.mock.calls.filter((c) => String(c[0]).includes('[piramide3d]'));
    expect(avisos).toHaveLength(1);
    expect((avisos[0]?.[1] as Error).message).toBe('contexto indisponível');

    aviso.mockRestore();
    palco.remove();
  });
});
