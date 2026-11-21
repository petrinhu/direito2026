import MiniSearch from 'minisearch';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { criarStoreBusca } from '@/app/stores/busca';
import { OPCOES_MINISEARCH } from '@/app/busca/criarMotorBuscaMiniSearch';
import type { DocumentoBusca } from '@/core/busca/tipos';

function documento(
  sobrescrito: Partial<DocumentoBusca> & Pick<DocumentoBusca, 'id' | 'corpo'>
): DocumentoBusca {
  return {
    url: '/p/p1/c/u1',
    periodo: 'p1',
    cadeira: 'c',
    unidade: 'u1',
    aba: 'resumo',
    titulo: 'Título',
    trecho: sobrescrito.corpo,
    ...sobrescrito
  };
}

function jsonDe(docs: readonly DocumentoBusca[]): string {
  const mini = new MiniSearch<DocumentoBusca>(OPCOES_MINISEARCH);
  mini.addAll(docs as DocumentoBusca[]);
  return JSON.stringify(mini.toJSON());
}

const DOC_PRINCIPAL = documento({ id: 'principal', corpo: 'palavra comum da aula' });
const DOC_TEXTO = documento({
  id: 'texto#secao-0',
  url: '/p/p1/c/u1/texto',
  aba: 'texto',
  titulo: 'Textura aberta',
  corpo: 'termo exclusivo zabelê'
});

const URL_TEXTO = 'assets/busca-texto-integral.json';

function fetchComIndices(opcoes: { textoStatus?: number; atrasoTexto?: Promise<void> } = {}) {
  return vi.fn(async (url: string) => {
    if (url.includes(URL_TEXTO)) {
      if (opcoes.atrasoTexto) await opcoes.atrasoTexto;
      if (opcoes.textoStatus !== undefined && opcoes.textoStatus !== 200) {
        return new Response('', { status: opcoes.textoStatus });
      }
      return new Response(jsonDe([DOC_TEXTO]), { status: 200 });
    }
    return new Response(jsonDe([DOC_PRINCIPAL]), { status: 200 });
  });
}

describe('busca no texto integral: índice separado, baixado sob demanda', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('a busca principal não baixa o índice do texto integral', async () => {
    const fetchSimulado = fetchComIndices();
    vi.stubGlobal('fetch', fetchSimulado);
    const store = criarStoreBusca();

    await store.garantirMotorCarregado();
    store.consultar('zabelê');

    const urls = fetchSimulado.mock.calls.map(([url]) => String(url));
    expect(urls.some((url) => url.includes(URL_TEXTO))).toBe(false);
  });

  it('buscarNoTextoIntegral baixa o índice do texto uma vez e acha termo que só existe nele', async () => {
    const fetchSimulado = fetchComIndices();
    vi.stubGlobal('fetch', fetchSimulado);
    const store = criarStoreBusca();
    await store.garantirMotorCarregado();
    store.consultar('zabelê');

    await store.buscarNoTextoIntegral();
    await store.buscarNoTextoIntegral();

    expect(store.estadoTexto.value).toBe('pronto');
    expect(store.resultadosTexto.value.map((d) => d.id)).toEqual(['texto#secao-0']);
    const chamadasTexto = fetchSimulado.mock.calls.filter(([url]) =>
      String(url).includes(URL_TEXTO)
    );
    expect(chamadasTexto).toHaveLength(1);
  });

  it('401 no texto chama o aviso de sessão, marca erro e não apaga os resultados principais', async () => {
    vi.stubGlobal('fetch', fetchComIndices({ textoStatus: 401 }));
    const aoNaoAutorizado = vi.fn();
    const store = criarStoreBusca(aoNaoAutorizado);
    await store.garantirMotorCarregado();
    store.consultar('palavra');
    expect(store.resultados.value).toHaveLength(1);

    await store.buscarNoTextoIntegral();

    expect(aoNaoAutorizado).toHaveBeenCalledOnce();
    expect(store.estadoTexto.value).toBe('erro');
    expect(store.resultados.value).toHaveLength(1);
  });

  it('erro de rede marca erro e permite tentar de novo', async () => {
    let tentativa = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (!url.includes(URL_TEXTO)) return new Response(jsonDe([DOC_PRINCIPAL]), { status: 200 });
        tentativa += 1;
        if (tentativa === 1) throw new TypeError('rede caiu');
        return new Response(jsonDe([DOC_TEXTO]), { status: 200 });
      })
    );
    const store = criarStoreBusca();
    await store.garantirMotorCarregado();
    store.consultar('zabelê');

    await store.buscarNoTextoIntegral();
    expect(store.estadoTexto.value).toBe('erro');

    await store.buscarNoTextoIntegral();
    expect(store.estadoTexto.value).toBe('pronto');
    expect(store.resultadosTexto.value).toHaveLength(1);
  });

  it('se o termo mudou durante a carga, o resultado antigo é descartado', async () => {
    let liberar: () => void = () => undefined;
    const atraso = new Promise<void>((resolver) => {
      liberar = resolver;
    });
    vi.stubGlobal('fetch', fetchComIndices({ atrasoTexto: atraso }));
    const store = criarStoreBusca();
    await store.garantirMotorCarregado();
    store.consultar('zabelê');

    const pendente = store.buscarNoTextoIntegral();
    store.consultar('outro termo');
    liberar();
    await pendente;

    expect(store.resultadosTexto.value).toEqual([]);
    expect(store.estadoTexto.value).toBe('parado');
  });

  it('trocar o termo limpa o resultado do texto integral da busca anterior', async () => {
    vi.stubGlobal('fetch', fetchComIndices());
    const store = criarStoreBusca();
    await store.garantirMotorCarregado();
    store.consultar('zabelê');
    await store.buscarNoTextoIntegral();
    expect(store.resultadosTexto.value).toHaveLength(1);

    store.consultar('outra coisa');

    expect(store.resultadosTexto.value).toEqual([]);
    expect(store.estadoTexto.value).toBe('parado');
  });
});
