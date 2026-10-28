import { describe, expect, it } from 'vitest';
import { criarClienteJuri } from '@/app/juri/clienteJuri';
import { criarSessaoJuri } from '@/app/juri/sessaoJuri';
import { ErroCifra } from '@/core/juri/cifra';
import { conteudoJuriFalso } from './apoio/conteudoJuriFalso';
import { bytesParaHex } from './apoio/cifraJuri';
import { criarServidorJuriFalso } from './apoio/servidorJuriFalso';

const SENHA = 'senha-sintetica-de-quinze-ou-mais';
const ID = 'ab'.repeat(16);
const ID_OUTRO = 'cd'.repeat(16);
/** PNG de 1 pixel, sintético: só os bytes de assinatura, nunca foto real. */
const PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52
]);

async function sessaoAbertaComServidor() {
  const servidor = criarServidorJuriFalso();
  await servidor.criarConta('admin', SENHA);
  const sessao = criarSessaoJuri({ cliente: criarClienteJuri({ buscar: servidor.buscar }) });
  await sessao.iniciar();
  await sessao.entrar('admin', SENHA);
  return { servidor, sessao };
}

describe('abrirImagem: decifra com a CEK da sessão', () => {
  it('sem sessão aberta não há CEK e a imagem é recusada', async () => {
    const servidor = criarServidorJuriFalso();
    await servidor.criarConta('admin', SENHA);
    const sessao = criarSessaoJuri({ cliente: criarClienteJuri({ buscar: servidor.buscar }) });
    await sessao.iniciar();
    await expect(sessao.abrirImagem(ID)).rejects.toMatchObject({ codigo: 'sem-chave' });
  });

  it('com a sessão aberta, decifra e devolve o tipo e os bytes originais', async () => {
    const { servidor, sessao } = await sessaoAbertaComServidor();
    await servidor.definirImagemCifrada(ID, PNG, 'png');
    const aberta = await sessao.abrirImagem(ID);
    expect(aberta.mime).toBe('image/png');
    expect(bytesParaHex(aberta.bytes)).toBe(bytesParaHex(PNG));
  });

  it('arquivo de OUTRO id entregue para este id é recusado por erro de id', async () => {
    const { servidor, sessao } = await sessaoAbertaComServidor();
    const bytesDoOutro = await servidor.definirImagemCifrada(ID_OUTRO, PNG, 'png');
    servidor.definirImagem(ID, bytesDoOutro);
    await expect(sessao.abrirImagem(ID)).rejects.toMatchObject({ codigo: 'id' });
    await expect(sessao.abrirImagem(ID)).rejects.toBeInstanceOf(ErroCifra);
  });

  it('401 do servidor descarta a CEK e leva a fase a deslogado', async () => {
    const { servidor, sessao } = await sessaoAbertaComServidor();
    await servidor.definirImagemCifrada(ID, PNG, 'png');
    servidor.derrubarSessao();
    await expect(sessao.abrirImagem(ID)).rejects.toMatchObject({ status: 401 });
    expect(sessao.fase.value).toBe('deslogado');
    await expect(sessao.abrirImagem(ID)).rejects.toMatchObject({ codigo: 'sem-chave' });
  });

  it('CEK descartada enquanto a imagem baixava: a imagem que chega depois não é entregue', async () => {
    const servidor = criarServidorJuriFalso();
    await servidor.criarConta('admin', SENHA);
    let chegou: () => void = () => {};
    const imagemLiberada = new Promise<void>((resolver) => {
      chegou = resolver;
    });
    const sessao = criarSessaoJuri({
      cliente: criarClienteJuri({
        buscar: async (url, init) => {
          if (url.includes('imagem.php')) await imagemLiberada;
          return servidor.buscar(url, init);
        }
      })
    });
    await sessao.iniciar();
    await sessao.entrar('admin', SENHA);
    await servidor.definirImagemCifrada(ID, PNG, 'png');
    // Sair da página (descartar) com o download em curso: a CEK em memória já não existe.
    const pendente = sessao.abrirImagem(ID);
    sessao.descartar();
    chegou();
    await expect(pendente).rejects.toMatchObject({ codigo: 'sem-chave' });
  });
});

describe('carregarConteudo: conteúdo validado antes da interface', () => {
  it('com a sessão aberta devolve o conteúdo já validado', async () => {
    const { sessao } = await sessaoAbertaComServidor();
    const resultado = await sessao.carregarConteudo();
    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.conteudo.quiz).toHaveLength(40);
  });

  it('conteúdo inválido no servidor vira motivo invalido, sem conteúdo', async () => {
    const { servidor, sessao } = await sessaoAbertaComServidor();
    servidor.definirConteudo({ ...conteudoJuriFalso(), quiz: [] });
    const resultado = await sessao.carregarConteudo();
    expect(resultado).toEqual({ ok: false, motivo: 'invalido' });
  });

  it('401 ao carregar o conteúdo descarta a CEK', async () => {
    const { servidor, sessao } = await sessaoAbertaComServidor();
    servidor.derrubarSessao();
    expect(await sessao.carregarConteudo()).toEqual({ ok: false, motivo: 'indisponivel' });
    expect(sessao.fase.value).toBe('deslogado');
  });
});
