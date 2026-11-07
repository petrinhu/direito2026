import { describe, expect, it, vi } from 'vitest';
import { carregarConteudoJuri } from '@/app/juri/conteudo';
import { ErroDeApi } from '@/app/restrito/clienteApi';
import { conteudoJuriFalso } from './apoio/conteudoJuriFalso';

describe('carregarConteudoJuri: carga direta, validada antes de qualquer tela', () => {
  it('conteúdo válido vira ok com o tipo validado, numa única chamada', async () => {
    const obter = vi.fn(async () => conteudoJuriFalso());
    const resultado = await carregarConteudoJuri(obter);
    expect(resultado.ok).toBe(true);
    expect(obter).toHaveBeenCalledTimes(1);
  });

  it('JSON que não valida vira invalido, sem lançar', async () => {
    const resultado = await carregarConteudoJuri(async () => ({ versao: 1 }));
    expect(resultado).toEqual({ ok: false, motivo: 'invalido' });
  });

  it('falha ao obter (rede, 401 ou 5xx) vira indisponivel, sem lançar', async () => {
    const resultado = await carregarConteudoJuri(async () => {
      throw new ErroDeApi(0, 'rede');
    });
    expect(resultado).toEqual({ ok: false, motivo: 'indisponivel' });
  });
});
