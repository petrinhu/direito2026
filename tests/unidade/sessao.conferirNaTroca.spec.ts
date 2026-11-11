import { describe, expect, it, vi } from 'vitest';
import { criarConferirNaTroca } from '@/app/sessao/conferirNaTroca';
import { criarSessaoGlobal, type Navegador } from '@/app/sessao/sessaoGlobal';

/**
 * SU-F1 (plano da sessão única, seção 1.6): a troca de página confere a sessão
 * no servidor, no máximo uma vez a cada 30 s. Aqui só a regra do intervalo, com
 * relógio falso; a ligação ao router fica em main.ts e é provada no e2e.
 */

const INTERVALO = 30_000;

function criarRelogio(inicio = 0) {
  let agora = inicio;
  return {
    agora: () => agora,
    avancar(ms: number) {
      agora += ms;
    }
  };
}

describe('criarConferirNaTroca: intervalo de conferência', () => {
  it('sessão única: a primeira troca de página confere a sessão uma vez', () => {
    const conferir = vi.fn();
    const relogio = criarRelogio(1_000);
    const trocar = criarConferirNaTroca({ conferir, agora: relogio.agora });

    trocar();

    expect(conferir).toHaveBeenCalledTimes(1);
  });

  it('sessão única: duas trocas em menos de 30 s conferem uma vez só', () => {
    const conferir = vi.fn();
    const relogio = criarRelogio();
    const trocar = criarConferirNaTroca({ conferir, agora: relogio.agora });

    trocar();
    relogio.avancar(5_000);
    trocar();
    relogio.avancar(20_000);
    trocar();

    expect(conferir).toHaveBeenCalledTimes(1);
  });

  it('sessão única: 29 999 ms não confere e 30 000 ms confere (borda exata)', () => {
    const conferir = vi.fn();
    const relogio = criarRelogio();
    const trocar = criarConferirNaTroca({ conferir, agora: relogio.agora });

    trocar();
    relogio.avancar(INTERVALO - 1);
    trocar();
    expect(conferir).toHaveBeenCalledTimes(1);

    relogio.avancar(1);
    trocar();
    expect(conferir).toHaveBeenCalledTimes(2);
  });

  it('sessão única: depois de 30 s desde a última conferência, confere de novo', () => {
    const conferir = vi.fn();
    const relogio = criarRelogio();
    const trocar = criarConferirNaTroca({ conferir, agora: relogio.agora });

    trocar();
    relogio.avancar(INTERVALO);
    trocar();
    relogio.avancar(INTERVALO);
    trocar();

    expect(conferir).toHaveBeenCalledTimes(3);
  });

  it('sessão única: uma troca barrada pelo intervalo não reinicia a janela', () => {
    const conferir = vi.fn();
    const relogio = criarRelogio();
    const trocar = criarConferirNaTroca({ conferir, agora: relogio.agora });

    trocar(); // t=0, confere
    relogio.avancar(20_000);
    trocar(); // t=20 s, barrada
    relogio.avancar(10_000);
    trocar(); // t=30 s, confere: a janela conta desde a última conferência, não desde a barrada

    expect(conferir).toHaveBeenCalledTimes(2);
  });

  it('sessão única: a troca não espera a conferência terminar', () => {
    const conferir = vi.fn(() => new Promise<void>(() => undefined));
    const relogio = criarRelogio();
    const trocar = criarConferirNaTroca({ conferir, agora: relogio.agora });

    const retorno = trocar();

    expect(retorno).toBeUndefined();
    expect(conferir).toHaveBeenCalledTimes(1);
  });
});

describe('criarConferirNaTroca com a sessão global', () => {
  function criarNavegadorFalso() {
    const navegador: Navegador = {
      caminhoAtual: () => '/calendario',
      substituir: vi.fn(),
      recarregar: vi.fn(),
      limparCachesESW: vi.fn(async () => undefined)
    };
    return navegador;
  }

  function criarClienteFalso(autenticado: boolean) {
    return {
      sessao: vi.fn(async () =>
        autenticado ? { autenticado: true, usuario: 'ana', admin: false } : { autenticado: false }
      ),
      sair: vi.fn(async () => undefined),
      trocarSenha: vi.fn(async () => undefined),
      listarUsuarios: vi.fn(async () => []),
      acaoUsuario: vi.fn(async () => ({}))
    };
  }

  it('sessão única: sessão vencida na troca de página recarrega a página (cai no portão)', async () => {
    const navegador = criarNavegadorFalso();
    const cliente = criarClienteFalso(false);
    const sessao = criarSessaoGlobal({ cliente, navegador });
    const relogio = criarRelogio();
    const trocar = criarConferirNaTroca({
      conferir: () => sessao.conferirAoVoltar(),
      agora: relogio.agora
    });

    trocar();
    await vi.waitFor(() => expect(navegador.recarregar).toHaveBeenCalledTimes(1));

    expect(cliente.sessao).toHaveBeenCalledTimes(1);
  });

  it('sessão única: sessão válida na troca de página não recarrega', async () => {
    const navegador = criarNavegadorFalso();
    const cliente = criarClienteFalso(true);
    const sessao = criarSessaoGlobal({ cliente, navegador });
    const relogio = criarRelogio();
    const trocar = criarConferirNaTroca({
      conferir: () => sessao.conferirAoVoltar(),
      agora: relogio.agora
    });

    trocar();
    await vi.waitFor(() => expect(cliente.sessao).toHaveBeenCalledTimes(1));

    expect(navegador.recarregar).not.toHaveBeenCalled();
  });
});
