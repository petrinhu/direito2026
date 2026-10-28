import { describe, expect, it } from 'vitest';
import { validarConteudoBruto } from '@/app/juri/conteudo';
import { criarClienteJuri, ErroDeApi } from '@/app/juri/clienteJuri';
import { conteudoJuriFalso } from './apoio/conteudoJuriFalso';
import { criarFetchFalso } from './apoio/fetchFalso';

describe('validarConteudoBruto: o JSON só vira conteúdo depois do validador', () => {
  it('aceita a fixture sintética e devolve o tipo validado', () => {
    const resultado = validarConteudoBruto(conteudoJuriFalso());
    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.conteudo.titulo).toBe('Título fictício da área');
  });

  it('quiz com 39 perguntas reprova e não devolve conteúdo algum', () => {
    const bruto = conteudoJuriFalso();
    const quiz = (bruto.quiz as unknown[]).slice(0, 39);
    const resultado = validarConteudoBruto({ ...bruto, quiz });
    expect(resultado).toEqual({ ok: false, motivo: 'invalido' });
  });

  it('HTML fora da allowlist (script) reprova o payload inteiro', () => {
    const bruto = conteudoJuriFalso() as { resumo: { corpoHtml: string }[] };
    const primeiro = bruto.resumo[0]!;
    bruto.resumo[0] = { ...primeiro, corpoHtml: '<script>alert(1)</script>' };
    expect(validarConteudoBruto(bruto)).toEqual({ ok: false, motivo: 'invalido' });
  });

  it('entrada que não é objeto reprova', () => {
    expect(validarConteudoBruto(null)).toEqual({ ok: false, motivo: 'invalido' });
    expect(validarConteudoBruto('texto')).toEqual({ ok: false, motivo: 'invalido' });
  });

  it('imagem com id fora do formato do acervo reprova', () => {
    const bruto = conteudoJuriFalso() as { imagens: { id: string }[] };
    bruto.imagens[0] = { ...bruto.imagens[0]!, id: 'nao-e-hex' };
    expect(validarConteudoBruto(bruto)).toEqual({ ok: false, motivo: 'invalido' });
  });
});

describe('clienteJuri.conteudo: envelope {ok, conteudo}', () => {
  it('devolve o objeto conteudo do envelope', async () => {
    const falso = criarFetchFalso([{ json: { ok: true, conteudo: { titulo: 'x' } } }]);
    const cliente = criarClienteJuri({ buscar: falso.buscar });
    await expect(cliente.conteudo()).resolves.toEqual({ titulo: 'x' });
    expect(falso.chamadas[0]?.url).toBe('/api/juri/conteudo.php');
    expect(falso.chamadas[0]?.metodo).toBe('GET');
  });

  it('conteudo que não é objeto é resposta inválida', async () => {
    const falso = criarFetchFalso([{ json: { ok: true, conteudo: 'texto' } }]);
    const cliente = criarClienteJuri({ buscar: falso.buscar });
    const erro = await cliente.conteudo().catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(ErroDeApi);
    expect(erro).toMatchObject({ codigo: 'resposta-invalida' });
  });
});
