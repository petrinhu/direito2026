import type { BlocoResumo, CategoriaQuiz, PerguntaMultiplaEscolha } from '../unidade/tipos';
import type {
  CodigoErroRestrito,
  ColunaSlide,
  ConteudoRestrito,
  LayoutSlide,
  Slide,
  ConteudoRestritoValidado,
  ErroValidacao,
  NoMapa,
  ResultadoValidacaoRestrita
} from './tipos';

export const QUANTIDADE_PERGUNTAS = 40;
export const QUANTIDADE_ALTERNATIVAS = 4;
/** Raiz no nível 0; o último nível aceito é o 4. */
export const PROFUNDIDADE_MAXIMA_MAPA = 4;
export const TAMANHO_MAXIMO_ROTULO = 90;
export const SLIDES_MINIMO = 10;
export const SLIDES_MAXIMO = 14;
export const NOTAS_PALAVRAS_MINIMO = 60;
export const NOTAS_PALAVRAS_MAXIMO = 160;
const LAYOUTS: readonly LayoutSlide[] = [
  'capa',
  'topicos',
  'destaque',
  'comparativo',
  'encerramento'
];
const MAXIMO_TITULO_SLIDE = 90;
const MAXIMO_SUBTITULO_SLIDE = 140;
const MAXIMO_ITEM_SLIDE = 120;
const MAXIMO_DESTAQUE_SLIDE = 200;
const MAXIMO_ITENS_SLIDE = 5;
const MAXIMO_ITENS_COLUNA = 4;
const MAXIMO_NOS_MAPA = 500;
const MAXIMO_BLOCOS = 60;
const MAXIMO_INTEGRANTES = 30;
const MAXIMO_CARACTERES_CAMPO = 60_000;
const MAXIMO_ERROS = 100;

const CATEGORIAS: readonly CategoriaQuiz[] = ['conceitos', 'aplicacao', 'fundamentos'];

const TAG_PERMITIDA =
  /<\/?(?:p|strong|em|ul|ol|li|blockquote|table|thead|tbody|tr|th|td|h3|h4)>|<br ?\/?>/g;
const ENTIDADE_PERMITIDA = /&(?:amp|lt|gt|quot|#39|nbsp);/g;
// eslint-disable-next-line no-control-regex
const CONTROLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

type Objeto = Record<string, unknown>;

function ehObjeto(valor: unknown): valor is Objeto {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

class Coletor {
  readonly erros: ErroValidacao[] = [];
  erro(codigo: CodigoErroRestrito, caminho: string): void {
    if (this.erros.length < MAXIMO_ERROS) this.erros.push({ codigo, caminho });
  }
}

/**
 * Allowlist por remoção: tira cada tag permitida (minúscula, sem nenhum
 * atributo) e exige que o resto não tenha `<` nem `>`. Comentário, CDATA,
 * maiúscula, atributo e tag pela metade sobram como `<` e reprovam.
 */
function htmlRejeitado(texto: string): CodigoErroRestrito | undefined {
  const semTags = texto.replace(TAG_PERMITIDA, '');
  if (semTags.includes('<') || semTags.includes('>')) return 'html-proibido';
  if (semTags.replace(ENTIDADE_PERMITIDA, '').includes('&')) return 'entidade-proibida';
  return undefined;
}

function lerTexto(
  c: Coletor,
  pai: Objeto,
  chave: string,
  caminho: string,
  modo: 'puro' | 'html',
  opcoes: { vazioOk?: boolean } = {}
): string {
  const valor = pai[chave];
  const onde = `${caminho}.${chave}`;
  if (typeof valor !== 'string') {
    c.erro(valor === undefined ? 'campo-ausente' : 'tipo-invalido', onde);
    return '';
  }
  return validarTexto(c, valor, onde, modo, opcoes);
}

function validarTexto(
  c: Coletor,
  valor: string,
  onde: string,
  modo: 'puro' | 'html',
  opcoes: { vazioOk?: boolean } = {}
): string {
  if (valor.length === 0 && !opcoes.vazioOk) c.erro('campo-ausente', onde);
  if (valor.length > MAXIMO_CARACTERES_CAMPO) c.erro('limite', onde);
  if (CONTROLE.test(valor)) c.erro('caractere-invalido', onde);
  if (modo === 'html') {
    const codigo = htmlRejeitado(valor);
    if (codigo) c.erro(codigo, onde);
  } else if (valor.includes('<') || valor.includes('>')) {
    c.erro('texto-com-marcacao', onde);
  }
  return valor;
}

function lerBloco(c: Coletor, bruto: unknown, caminho: string): BlocoResumo {
  if (!ehObjeto(bruto)) {
    c.erro('tipo-invalido', caminho);
    return { id: '', numero: 0, titulo: '', fonte: '', corpoHtml: '', resumo: [], exemploHtml: '' };
  }
  if ('componenteExtra' in bruto) c.erro('campo-proibido', `${caminho}.componenteExtra`);
  const numero = bruto.numero;
  if (typeof numero !== 'number' || !Number.isInteger(numero) || numero < 1) {
    c.erro('tipo-invalido', `${caminho}.numero`);
  }
  const itens = Array.isArray(bruto.resumo) ? bruto.resumo : undefined;
  if (!itens) c.erro('tipo-invalido', `${caminho}.resumo`);
  const bloco: BlocoResumo = {
    id: lerTexto(c, bruto, 'id', caminho, 'puro'),
    numero: typeof numero === 'number' ? numero : 0,
    titulo: lerTexto(c, bruto, 'titulo', caminho, 'puro'),
    fonte: lerTexto(c, bruto, 'fonte', caminho, 'puro'),
    ...(bruto.badge !== undefined ? { badge: lerTexto(c, bruto, 'badge', caminho, 'puro') } : {}),
    corpoHtml: lerTexto(c, bruto, 'corpoHtml', caminho, 'html'),
    resumo: (itens ?? []).map((item, i) =>
      typeof item === 'string'
        ? validarTexto(c, item, `${caminho}.resumo[${i}]`, 'puro')
        : (c.erro('tipo-invalido', `${caminho}.resumo[${i}]`), '')
    ),
    exemploHtml: lerTexto(c, bruto, 'exemploHtml', caminho, 'html', { vazioOk: true })
  };
  return bloco;
}

function lerPergunta(c: Coletor, bruto: unknown, indice: number): PerguntaMultiplaEscolha {
  const caminho = `quiz[${indice}]`;
  const vazia = {
    id: 0,
    categoria: 'conceitos',
    enunciadoHtml: '',
    fonteExtra: false,
    explicacaoHtml: '',
    alternativasHtml: ['', '', '', ''],
    correta: 0
  } as const satisfies PerguntaMultiplaEscolha;
  if (!ehObjeto(bruto)) {
    c.erro('tipo-invalido', caminho);
    return vazia;
  }
  for (const proibido of ['origem', 'gabaritoDoCaderno']) {
    if (proibido in bruto) c.erro('campo-proibido', `${caminho}.${proibido}`);
  }
  if (bruto.fonteExtra !== false) c.erro('campo-proibido', `${caminho}.fonteExtra`);
  if (bruto.id !== indice + 1 || typeof bruto.id !== 'number')
    c.erro('id-invalido', `${caminho}.id`);
  const categoria = CATEGORIAS.find((cat) => cat === bruto.categoria);
  if (!categoria) c.erro('categoria', `${caminho}.categoria`);
  const correta = bruto.correta;
  if (typeof correta !== 'number' || !Number.isInteger(correta) || correta < 0 || correta > 3) {
    c.erro('correta-fora', `${caminho}.correta`);
  }
  const alts = Array.isArray(bruto.alternativasHtml) ? bruto.alternativasHtml : undefined;
  if (!alts) c.erro('tipo-invalido', `${caminho}.alternativasHtml`);
  else if (alts.length !== QUANTIDADE_ALTERNATIVAS)
    c.erro('quantidade', `${caminho}.alternativasHtml`);
  const lidas = (alts ?? []).map((alt, i) =>
    typeof alt === 'string'
      ? validarTexto(c, alt, `${caminho}.alternativasHtml[${i}]`, 'html')
      : (c.erro('tipo-invalido', `${caminho}.alternativasHtml[${i}]`), '')
  );
  return {
    id: typeof bruto.id === 'number' ? bruto.id : 0,
    categoria: categoria ?? 'conceitos',
    enunciadoHtml: lerTexto(c, bruto, 'enunciadoHtml', caminho, 'html'),
    fonteExtra: false,
    explicacaoHtml: lerTexto(c, bruto, 'explicacaoHtml', caminho, 'html'),
    alternativasHtml: [lidas[0] ?? '', lidas[1] ?? '', lidas[2] ?? '', lidas[3] ?? ''],
    correta: (typeof correta === 'number' && correta >= 0 && correta <= 3 ? correta : 0) as
      0 | 1 | 2 | 3
  };
}

function lerMapa(c: Coletor, bruto: unknown): NoMapa {
  let total = 0;
  const visitar = (no: unknown, nivel: number, caminho: string): NoMapa => {
    total += 1;
    if (total > MAXIMO_NOS_MAPA) {
      if (total === MAXIMO_NOS_MAPA + 1) c.erro('limite', 'mapa');
      return { rotulo: '' };
    }
    if (!ehObjeto(no)) {
      c.erro('tipo-invalido', caminho);
      return { rotulo: '' };
    }
    const rotulo = lerTexto(c, no, 'rotulo', caminho, 'puro');
    if (rotulo.length > TAMANHO_MAXIMO_ROTULO) c.erro('rotulo-longo', `${caminho}.rotulo`);
    const filhosBrutos = no.filhos;
    if (filhosBrutos === undefined) return { rotulo };
    if (!Array.isArray(filhosBrutos)) {
      c.erro('tipo-invalido', `${caminho}.filhos`);
      return { rotulo };
    }
    if (filhosBrutos.length > 0 && nivel >= PROFUNDIDADE_MAXIMA_MAPA) {
      c.erro('profundidade', caminho);
      return { rotulo };
    }
    return {
      rotulo,
      filhos: filhosBrutos.map((f, i) => visitar(f, nivel + 1, `${caminho}.filhos[${i}]`))
    };
  };
  const raiz = visitar(bruto, 0, 'mapa');
  if (!raiz.filhos || raiz.filhos.length === 0) c.erro('quantidade', 'mapa');
  return raiz;
}

function textoLimitado(c: Coletor, valor: unknown, onde: string, limite: number): string {
  if (typeof valor !== 'string') {
    c.erro(valor === undefined ? 'campo-ausente' : 'tipo-invalido', onde);
    return '';
  }
  validarTexto(c, valor, onde, 'puro');
  if ([...valor].length > limite) c.erro('campo-longo', onde);
  return valor;
}

function listaDeTextos(
  c: Coletor,
  valor: unknown,
  onde: string,
  maximoItens: number,
  maximoCaracteres: number
): string[] {
  if (!Array.isArray(valor)) {
    c.erro(valor === undefined ? 'campo-ausente' : 'tipo-invalido', onde);
    return [];
  }
  if (valor.length === 0 || valor.length > maximoItens) c.erro('quantidade', onde);
  return valor.map((item, i) => textoLimitado(c, item, `${onde}[${i}]`, maximoCaracteres));
}

function lerColuna(c: Coletor, bruta: unknown, onde: string): ColunaSlide {
  if (!ehObjeto(bruta)) {
    c.erro('tipo-invalido', onde);
    return { titulo: '', itens: [] };
  }
  return {
    titulo: textoLimitado(c, bruta.titulo, `${onde}.titulo`, MAXIMO_TITULO_SLIDE),
    itens: listaDeTextos(c, bruta.itens, `${onde}.itens`, MAXIMO_ITENS_COLUNA, MAXIMO_ITEM_SLIDE)
  };
}

function lerSlide(c: Coletor, bruto: unknown, indice: number): Slide {
  const onde = `slides[${indice}]`;
  const vazio: Slide = { id: 0, layout: 'topicos', titulo: '', notas: '' };
  if (!ehObjeto(bruto)) {
    c.erro('tipo-invalido', onde);
    return vazio;
  }
  if (bruto.id !== indice + 1) c.erro('id-invalido', `${onde}.id`);
  const layout = LAYOUTS.find((l) => l === bruto.layout);
  if (!layout || (indice === 0 && layout !== 'capa')) c.erro('layout', `${onde}.layout`);

  const notas = textoLimitado(c, bruto.notas, `${onde}.notas`, MAXIMO_CARACTERES_CAMPO);
  const palavras = notas.split(/\s+/).filter((p) => p.length > 0).length;
  if (palavras < NOTAS_PALAVRAS_MINIMO || palavras > NOTAS_PALAVRAS_MAXIMO) {
    c.erro('palavras', `${onde}.notas`);
  }

  const slide: Slide = {
    id: indice + 1,
    layout: layout ?? 'topicos',
    titulo: textoLimitado(c, bruto.titulo, `${onde}.titulo`, MAXIMO_TITULO_SLIDE),
    ...(bruto.subtitulo !== undefined
      ? {
          subtitulo: textoLimitado(c, bruto.subtitulo, `${onde}.subtitulo`, MAXIMO_SUBTITULO_SLIDE)
        }
      : {}),
    ...(bruto.itens !== undefined || layout === 'topicos'
      ? {
          itens: listaDeTextos(
            c,
            bruto.itens,
            `${onde}.itens`,
            MAXIMO_ITENS_SLIDE,
            MAXIMO_ITEM_SLIDE
          )
        }
      : {}),
    ...(bruto.destaque !== undefined || layout === 'destaque'
      ? { destaque: textoLimitado(c, bruto.destaque, `${onde}.destaque`, MAXIMO_DESTAQUE_SLIDE) }
      : {}),
    notas
  };

  if (layout === 'comparativo') {
    const colunas = bruto.colunas;
    if (colunas === undefined) c.erro('campo-ausente', `${onde}.colunas`);
    else if (!Array.isArray(colunas) || colunas.length < 2 || colunas.length > 3) {
      c.erro('colunas', `${onde}.colunas`);
    }
    const lidas = Array.isArray(colunas)
      ? colunas.map((col, i) => lerColuna(c, col, `${onde}.colunas[${i}]`))
      : [];
    return { ...slide, colunas: lidas };
  }
  if (bruto.colunas !== undefined) c.erro('colunas', `${onde}.colunas`);
  return slide;
}

function congelar<T>(valor: T): T {
  if (typeof valor === 'object' && valor !== null && !Object.isFrozen(valor)) {
    Object.values(valor).forEach(congelar);
    Object.freeze(valor);
  }
  return valor;
}

/**
 * Valida o JSON restrito vindo da API ANTES de qualquer renderização. Função
 * pura (roda no navegador, no Node e no portão de vazamento). Rejeita o
 * payload inteiro ao primeiro defeito de HTML: não há "limpar e seguir".
 * Constrói um objeto novo, só com os campos conhecidos, e o congela.
 */
export function validarConteudoRestrito(json: unknown): ResultadoValidacaoRestrita {
  const c = new Coletor();
  if (!ehObjeto(json)) {
    c.erro('tipo-invalido', '(raiz)');
    return { ok: false, erros: c.erros };
  }
  if (json.versao !== 1) c.erro('versao', 'versao');

  const meta = ehObjeto(json.meta) ? json.meta : (c.erro('tipo-invalido', 'meta'), {});
  const equipe = ehObjeto(json.equipe) ? json.equipe : (c.erro('tipo-invalido', 'equipe'), {});
  const integrantes = Array.isArray(equipe.integrantes) ? equipe.integrantes : undefined;
  if (!integrantes || integrantes.length === 0 || integrantes.length > MAXIMO_INTEGRANTES) {
    c.erro(integrantes ? 'quantidade' : 'tipo-invalido', 'equipe.integrantes');
  }

  const blocos = Array.isArray(json.resumo) ? json.resumo : undefined;
  if (!blocos) c.erro('tipo-invalido', 'resumo');
  else if (blocos.length === 0 || blocos.length > MAXIMO_BLOCOS) c.erro('quantidade', 'resumo');

  const slides = Array.isArray(json.slides) ? json.slides : undefined;
  if (!slides) c.erro(json.slides === undefined ? 'campo-ausente' : 'tipo-invalido', 'slides');
  else if (slides.length < SLIDES_MINIMO || slides.length > SLIDES_MAXIMO) {
    c.erro('quantidade', 'slides');
  }

  const perguntas = Array.isArray(json.quiz) ? json.quiz : undefined;
  if (!perguntas) c.erro('tipo-invalido', 'quiz');
  else if (perguntas.length !== QUANTIDADE_PERGUNTAS) c.erro('quantidade', 'quiz');

  const conteudo: ConteudoRestrito = {
    versao: 1,
    meta: {
      titulo: lerTexto(c, meta, 'titulo', 'meta', 'puro'),
      subtitulo: lerTexto(c, meta, 'subtitulo', 'meta', 'puro'),
      descricao: lerTexto(c, meta, 'descricao', 'meta', 'puro')
    },
    equipe: {
      instituicao: lerTexto(c, equipe, 'instituicao', 'equipe', 'puro'),
      integrantes: (integrantes ?? []).map((nome, i) =>
        typeof nome === 'string'
          ? validarTexto(c, nome, `equipe.integrantes[${i}]`, 'puro')
          : (c.erro('tipo-invalido', `equipe.integrantes[${i}]`), '')
      )
    },
    resumo: (blocos ?? []).map((b, i) => lerBloco(c, b, `resumo[${i}]`)),
    mapa: lerMapa(c, json.mapa),
    slides: (slides ?? []).map((sl, i) => lerSlide(c, sl, i)),
    quiz: (perguntas ?? []).map((p, i) => lerPergunta(c, p, i))
  };

  if (c.erros.length > 0) return { ok: false, erros: c.erros };
  return { ok: true, conteudo: congelar(conteudo) as ConteudoRestritoValidado };
}
