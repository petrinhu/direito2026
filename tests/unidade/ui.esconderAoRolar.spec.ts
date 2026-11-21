import { describe, expect, it } from 'vitest';
import {
  estadoInicialPilha,
  reduzirPilha,
  type EstadoPilha
} from '@/ui/composables/esconderAoRolar';

/* FLUTUANTES-ROLAGEM: a lógica de quando a pilha inferior some é pura e testada sem DOM. */

const celular = (): EstadoPilha => ({ ...estadoInicialPilha(), celular: true });

describe('reduzirPilha (esconder ao rolar)', () => {
  it('rolar para baixo no celular esconde a pilha', () => {
    const depois = reduzirPilha(celular(), { tipo: 'rolou', y: 120 });
    expect(depois.escondida).toBe(true);
  });

  it('rolar para cima mostra a pilha de novo', () => {
    const escondida = reduzirPilha(celular(), { tipo: 'rolou', y: 300 });
    const subiu = reduzirPilha(escondida, { tipo: 'rolou', y: 200 });
    expect(subiu.escondida).toBe(false);
  });

  it('parar de rolar mostra a pilha (o temporizador manda o evento "parou")', () => {
    const escondida = reduzirPilha(celular(), { tipo: 'rolou', y: 300 });
    expect(reduzirPilha(escondida, { tipo: 'parou' }).escondida).toBe(false);
  });

  it('um deslocamento de até 4 px não muda o estado (tremor do toque)', () => {
    const escondida = reduzirPilha(celular(), { tipo: 'rolou', y: 300 });
    expect(reduzirPilha(escondida, { tipo: 'rolou', y: 302 }).escondida).toBe(true);
    const visivel = celular();
    expect(reduzirPilha(visivel, { tipo: 'rolou', y: 3 }).escondida).toBe(false);
  });

  it('com foco dentro da pilha, rolar para baixo não a esconde', () => {
    const comFoco = reduzirPilha(celular(), { tipo: 'foco', dentro: true });
    const depois = reduzirPilha(comFoco, { tipo: 'rolou', y: 500 });
    expect(depois.escondida).toBe(false);
  });

  it('se o foco entra numa pilha já escondida, ela volta', () => {
    const escondida = reduzirPilha(celular(), { tipo: 'rolou', y: 300 });
    expect(reduzirPilha(escondida, { tipo: 'foco', dentro: true }).escondida).toBe(false);
  });

  it('depois que o foco sai, rolar para baixo volta a esconder', () => {
    const comFoco = reduzirPilha(celular(), { tipo: 'foco', dentro: true });
    const saiu = reduzirPilha(comFoco, { tipo: 'foco', dentro: false });
    expect(reduzirPilha(saiu, { tipo: 'rolou', y: 500 }).escondida).toBe(true);
  });

  it('no computador nada se esconde', () => {
    const desktop = estadoInicialPilha();
    expect(reduzirPilha(desktop, { tipo: 'rolou', y: 800 }).escondida).toBe(false);
  });

  it('se a tela deixa de ser celular, a pilha volta na hora', () => {
    const escondida = reduzirPilha(celular(), { tipo: 'rolou', y: 300 });
    expect(reduzirPilha(escondida, { tipo: 'tela', celular: false }).escondida).toBe(false);
  });
});
