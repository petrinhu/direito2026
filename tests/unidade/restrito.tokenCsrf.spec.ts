import { describe, expect, it } from 'vitest';
import { criarClienteApi } from '@/app/restrito/clienteApi';
import { criarFetchFalso } from './apoio/fetchFalso';

const sessaoAnonima = { json: { ok: true, autenticado: false, csrf: 'tok-1' } };

describe('token CSRF depois de sair', () => {
  it('o POST seguinte a sair busca sessao.php de novo e usa o token da nova sessão', async () => {
    const f = criarFetchFalso([
      sessaoAnonima,
      { json: { ok: true } },
      { json: { ok: true, autenticado: false, csrf: 'tok-3' } },
      { json: { ok: true } }
    ]);
    const cliente = criarClienteApi({ buscar: f.buscar });
    await cliente.sessao();
    await cliente.sair();
    await cliente.trocarSenha('Senha Atual 1234', 'Senha Nova 5678');
    expect(f.chamadas.map((c) => c.url)).toEqual([
      '/api/sessao.php',
      '/api/sair.php',
      '/api/sessao.php',
      '/api/trocar-senha.php'
    ]);
    expect(f.chamadas[3]!.cabecalhos['X-CSRF-Token']).toBe('tok-3');
  });
});
