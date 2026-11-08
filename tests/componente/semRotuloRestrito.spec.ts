// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import Home from '@/ui/paginas/Home.vue';
import MenuCurriculo from '@/ui/componentes/MenuCurriculo.vue';
import PainelAdmin from '@/ui/usuarios/PainelAdmin.vue';
import { CHAVE_CURRICULO } from '@/app/chaves';
import type { ClienteApi, UsuarioAdmin } from '@/app/sessao/administracao';
import { curriculo } from '@/conteudo/curriculo';
import { montarDocumentosCadeirasRestritas } from '@/core/busca/montarIndice';

/**
 * Ordem do líder (08/11/2026): o Interdisciplinar entra sem senha, então o
 * menu e as placas não podem mais anunciar "acesso restrito". Varre o que a
 * pessoa LÊ ou o leitor de tela ANUNCIA nos componentes de navegação: texto
 * visível, aria-label e o trecho dos títulos de cadeira da busca.
 *
 * Fora de escopo, de propósito: o texto das unidades (src/conteudo). Ele pode
 * conter a palavra por acaso ("visão restrita", "restrito à esfera privada"),
 * e não é rótulo de cadeira (L-41: varre o componente, não o conteúdo).
 */

const usuarios: UsuarioAdmin[] = [
  {
    usuario: 'chefe',
    admin: true,
    ativo: true,
    deveTrocarSenha: false,
    criadoEm: '2026-10-01',
    ultimoLogin: '2026-10-05'
  }
];

const CADEADO = 'svg rect[x="5"][y="11"]';
/** NodeFilter.SHOW_TEXT: só nós de texto (o global NodeFilter não está no eslint do projeto). */
const SOMENTE_TEXTO = 4;
type Raiz = HTMLElement;

interface Achado {
  readonly onde: string;
  readonly texto: string;
}

interface Varredura {
  readonly analisados: number;
  readonly achados: Achado[];
  readonly cadeados: number;
}

function varrerElemento(onde: string, raiz: Raiz): { textos: Achado[]; analisados: number } {
  const textos: Achado[] = [];
  let analisados = 0;

  // Nó de texto por nó de texto: um rótulo ao lado de um ícone SVG é texto do
  // mesmo elemento pai, e a folha de elementos perderia esse caso.
  const caminhante = raiz.ownerDocument.createTreeWalker(raiz, SOMENTE_TEXTO);
  for (let no = caminhante.nextNode(); no; no = caminhante.nextNode()) {
    const texto = no.textContent?.trim() ?? '';
    if (texto === '') continue;
    analisados += 1;
    if (/restrit/i.test(texto)) textos.push({ onde: `${onde} texto`, texto });
  }

  for (const el of Array.from(raiz.querySelectorAll('[aria-label]'))) {
    const rotulo = el.getAttribute('aria-label') ?? '';
    analisados += 1;
    if (/restrit/i.test(rotulo)) textos.push({ onde: `${onde} aria-label`, texto: rotulo });
  }

  return { textos, analisados };
}

function contarCadeados(raiz: Raiz): number {
  return raiz.querySelectorAll(CADEADO).length;
}

/**
 * Clica uma vez em cada botão fechado; repete enquanto um clique abrir níveis
 * novos. Período em preparo não tem filhos e continua fechado: é esperado.
 */
async function abrirOsNiveisQueAbrem(w: VueWrapper): Promise<void> {
  const clicados = new Set<unknown>();
  for (let rodada = 0; rodada < 20; rodada++) {
    const novos = w
      .findAll('button[aria-expanded="false"]')
      .filter((b) => !clicados.has(b.element));
    if (novos.length === 0) return;
    for (const botao of novos) {
      clicados.add(botao.element);
      await botao.trigger('click');
    }
  }
  throw new Error('o menu não estabilizou em 20 rodadas de cliques');
}

async function varrerTudo(): Promise<Varredura> {
  const achados: Achado[] = [];
  let analisados = 0;
  let cadeados = 0;

  const home = mount(Home, {
    global: {
      provide: { [CHAVE_CURRICULO as unknown as symbol]: curriculo },
      stubs: { teleport: true }
    }
  });
  const varreHome = varrerElemento('Home', home.element);
  achados.push(...varreHome.textos);
  analisados += varreHome.analisados;
  cadeados += contarCadeados(home.element);

  const menu = mount(MenuCurriculo, { props: { curriculo, caminhoAtual: '' } });
  await abrirOsNiveisQueAbrem(menu);
  const varreMenu = varrerElemento('Menu', menu.element);
  achados.push(...varreMenu.textos);
  analisados += varreMenu.analisados;
  cadeados += contarCadeados(menu.element);

  const cliente = {
    listarUsuarios: vi.fn(async () => usuarios),
    acaoUsuario: vi.fn(async () => ({}))
  } as unknown as ClienteApi;
  const administrar = async <T>(f: (c: ClienteApi) => Promise<T>) => ({
    ok: true as const,
    valor: await f(cliente)
  });
  const painel = mount(PainelAdmin, { props: { usuarioAtual: 'chefe', administrar } });
  await flushPromises();
  const varrePainel = varrerElemento('PainelAdmin', painel.element);
  achados.push(...varrePainel.textos);
  analisados += varrePainel.analisados;
  cadeados += contarCadeados(painel.element);

  for (const doc of montarDocumentosCadeirasRestritas(curriculo)) {
    for (const [campo, texto] of [
      ['titulo', doc.titulo],
      ['trecho', doc.trecho]
    ] as const) {
      analisados += 1;
      if (/restrit/i.test(texto)) achados.push({ onde: `Busca ${doc.id} ${campo}`, texto });
    }
  }

  return { analisados, achados, cadeados };
}

describe('sem rótulo de acesso restrito na navegação', () => {
  it('Home, menu aberto, painel e busca não anunciam "restrit" nem mostram cadeado', async () => {
    const varredura = await varrerTudo();

    console.log(
      `semRotuloRestrito: analisados=${varredura.analisados} encontrados=${varredura.achados.length} cadeados=${varredura.cadeados}`
    );

    // Piso: zero análise é varredura quebrada, não página limpa (L-36).
    expect(varredura.analisados, 'varredura analisou menos de 6 nós').toBeGreaterThanOrEqual(6);
    expect(
      varredura.achados.map((a) => `${a.onde}: ${a.texto}`),
      'texto de restrito visível ou anunciado'
    ).toEqual([]);
    expect(varredura.cadeados, 'ícone de cadeado nas telas de navegação').toBe(0);
  });
});
