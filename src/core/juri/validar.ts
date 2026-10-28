import type { NoMapa } from '../restrito/tipos';
import { htmlRejeitado } from '../restrito/allowlist';
import { validarCitacaoDeAlternativa } from '../conteudo/validarCitacaoDeAlternativa';
import type { AlternativasQuiz, IndiceAlternativa } from '../unidade/tipos';
import type {
  BlocoResumoJuri,
  CodigoErroJuri,
  ConteudoJuri,
  ConteudoJuriValidado,
  ErroValidacaoJuri,
  FichaJuri,
  ImagemJuri,
  ItemRespostaDefesa,
  LinhaQuadroTermos,
  MnemonicoJuri,
  PerguntaJuri,
  ResultadoValidacaoJuri
} from './tipos';

export const QUANTIDADE_PERGUNTAS_JURI = 40;
export const QUADRO_TERMOS_MINIMO = 3;
/** Raiz no nível 0; o último nível aceito é o 4 (mesma regra do mapa restrito). */
export const PROFUNDIDADE_MAXIMA_MAPA_JURI = 4;
const MAXIMO_ERROS = 100;
/** Hex minúsculo de 128 bits: o nome do arquivo `imagens/<id>.juri` do acervo. */
const ID_IMAGEM = /^[0-9a-f]{32}$/;
// eslint-disable-next-line no-control-regex
const CONTROLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

type Objeto = Record<string, unknown>;
type Modo = 'puro' | 'html';

interface BasePergunta {
  readonly id: number;
  readonly categoria: string;
  readonly enunciadoHtml: string;
  readonly fonteExtra: false;
  readonly explicacaoHtml: string;
  readonly fontes: readonly string[];
}

class Coletor {
  readonly erros: ErroValidacaoJuri[] = [];
  erro(codigo: CodigoErroJuri, caminho: string): void {
    if (this.erros.length < MAXIMO_ERROS) this.erros.push({ codigo, caminho });
  }
}

function ehObjeto(valor: unknown): valor is Objeto {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function lerObjeto(c: Coletor, bruto: unknown, caminho: string): Objeto | undefined {
  if (ehObjeto(bruto)) return bruto;
  c.erro('tipo-invalido', caminho);
  return undefined;
}

function validarTexto(c: Coletor, valor: string, onde: string, modo: Modo): string {
  if (valor.trim().length === 0) c.erro('campo-ausente', onde);
  if (CONTROLE.test(valor)) c.erro('caractere-invalido', onde);
  if (modo === 'html') {
    const codigo = htmlRejeitado(valor);
    if (codigo) c.erro(codigo, onde);
  } else if (valor.includes('<') || valor.includes('>')) {
    c.erro('texto-com-marcacao', onde);
  }
  return valor;
}

function lerTexto(c: Coletor, pai: Objeto, chave: string, caminho: string, modo: Modo): string {
  const valor = pai[chave];
  const onde = caminho ? `${caminho}.${chave}` : chave;
  if (typeof valor !== 'string') {
    c.erro(valor === undefined ? 'campo-ausente' : 'tipo-invalido', onde);
    return '';
  }
  return validarTexto(c, valor, onde, modo);
}

/** Fonte é obrigatória em todo item: sem lista, lista vazia ou fonte vazia reprova. */
function lerFontes(c: Coletor, pai: Objeto, caminho: string): string[] {
  const onde = `${caminho}.fontes`;
  const bruto = pai.fontes;
  if (bruto === undefined) {
    c.erro('campo-ausente', onde);
    return [];
  }
  if (!Array.isArray(bruto) || bruto.length === 0) {
    c.erro('fontes', onde);
    return [];
  }
  return bruto.map((fonte, i) => {
    const ondeFonte = `${onde}[${i}]`;
    if (typeof fonte !== 'string' || fonte.trim().length === 0) {
      c.erro('fontes', ondeFonte);
      return '';
    }
    return validarTexto(c, fonte, ondeFonte, 'puro');
  });
}

function lerLista<T>(
  c: Coletor,
  bruto: unknown,
  caminho: string,
  limites: { readonly minimo: number; readonly maximo?: number },
  ler: (item: unknown, indice: number, caminhoItem: string) => T
): T[] {
  if (!Array.isArray(bruto)) {
    c.erro(bruto === undefined ? 'campo-ausente' : 'tipo-invalido', caminho);
    return [];
  }
  const { minimo, maximo } = limites;
  if (bruto.length < minimo || (maximo !== undefined && bruto.length > maximo)) {
    c.erro('quantidade', caminho);
  }
  return bruto.map((item, i) => ler(item, i, `${caminho}[${i}]`));
}

function lerBlocoResumo(c: Coletor, bruto: unknown, caminho: string): BlocoResumoJuri {
  const vazio: BlocoResumoJuri = { id: '', titulo: '', corpoHtml: '', fontes: [] };
  const obj = lerObjeto(c, bruto, caminho);
  if (!obj) return vazio;
  const linhaA = obj.linhaA;
  const linhaB = obj.linhaB;
  if ((linhaA === undefined) !== (linhaB === undefined)) c.erro('linha-impar', caminho);
  return {
    id: lerTexto(c, obj, 'id', caminho, 'puro'),
    titulo: lerTexto(c, obj, 'titulo', caminho, 'puro'),
    corpoHtml: lerTexto(c, obj, 'corpoHtml', caminho, 'html'),
    ...(linhaA !== undefined ? { linhaA: lerTexto(c, obj, 'linhaA', caminho, 'html') } : {}),
    ...(linhaB !== undefined ? { linhaB: lerTexto(c, obj, 'linhaB', caminho, 'html') } : {}),
    fontes: lerFontes(c, obj, caminho)
  };
}

function lerLinhaTermo(c: Coletor, bruto: unknown, caminho: string): LinhaQuadroTermos {
  const vazio: LinhaQuadroTermos = { termo: '', definicaoHtml: '', regiao: '', fontes: [] };
  const obj = lerObjeto(c, bruto, caminho);
  if (!obj) return vazio;
  return {
    termo: lerTexto(c, obj, 'termo', caminho, 'puro'),
    definicaoHtml: lerTexto(c, obj, 'definicaoHtml', caminho, 'html'),
    regiao: lerTexto(c, obj, 'regiao', caminho, 'puro'),
    fontes: lerFontes(c, obj, caminho)
  };
}

function lerFicha(c: Coletor, bruto: unknown, caminho: string): FichaJuri {
  const vazia: FichaJuri = {
    id: '',
    titulo: '',
    oQueEHtml: '',
    fonteDizHtml: '',
    acusacaoUsaHtml: '',
    defesaAtacaHtml: '',
    fontes: []
  };
  const obj = lerObjeto(c, bruto, caminho);
  if (!obj) return vazia;
  return {
    id: lerTexto(c, obj, 'id', caminho, 'puro'),
    titulo: lerTexto(c, obj, 'titulo', caminho, 'puro'),
    oQueEHtml: lerTexto(c, obj, 'oQueEHtml', caminho, 'html'),
    fonteDizHtml: lerTexto(c, obj, 'fonteDizHtml', caminho, 'html'),
    acusacaoUsaHtml: lerTexto(c, obj, 'acusacaoUsaHtml', caminho, 'html'),
    defesaAtacaHtml: lerTexto(c, obj, 'defesaAtacaHtml', caminho, 'html'),
    fontes: lerFontes(c, obj, caminho)
  };
}

function lerRespostaDefesa(c: Coletor, bruto: unknown, caminho: string): ItemRespostaDefesa {
  const vazio: ItemRespostaDefesa = {
    id: '',
    teseHtml: '',
    respostaHtml: '',
    limiteHtml: '',
    fontes: []
  };
  const obj = lerObjeto(c, bruto, caminho);
  if (!obj) return vazio;
  return {
    id: lerTexto(c, obj, 'id', caminho, 'puro'),
    teseHtml: lerTexto(c, obj, 'teseHtml', caminho, 'html'),
    respostaHtml: lerTexto(c, obj, 'respostaHtml', caminho, 'html'),
    limiteHtml: lerTexto(c, obj, 'limiteHtml', caminho, 'html'),
    fontes: lerFontes(c, obj, caminho)
  };
}

function lerMnemonico(c: Coletor, bruto: unknown, caminho: string): MnemonicoJuri {
  const vazio: MnemonicoJuri = { id: '', dicaHtml: '', respostaHtml: '', fontes: [] };
  const obj = lerObjeto(c, bruto, caminho);
  if (!obj) return vazio;
  return {
    id: lerTexto(c, obj, 'id', caminho, 'puro'),
    dicaHtml: lerTexto(c, obj, 'dicaHtml', caminho, 'html'),
    respostaHtml: lerTexto(c, obj, 'respostaHtml', caminho, 'html'),
    fontes: lerFontes(c, obj, caminho)
  };
}

function lerImagem(
  c: Coletor,
  bruto: unknown,
  caminho: string,
  idsDoAcervo: ReadonlySet<string>
): ImagemJuri {
  const obj = lerObjeto(c, bruto, caminho);
  if (!obj) return { id: '', legenda: '', fontes: [] };
  const id = obj.id;
  const onde = `${caminho}.id`;
  if (typeof id !== 'string') c.erro(id === undefined ? 'campo-ausente' : 'tipo-invalido', onde);
  else if (!ID_IMAGEM.test(id)) c.erro('imagem-id-invalido', onde);
  else if (!idsDoAcervo.has(id)) c.erro('imagem-fora-do-indice', onde);
  return {
    id: typeof id === 'string' ? id : '',
    legenda: lerTexto(c, obj, 'legenda', caminho, 'puro'),
    fontes: lerFontes(c, obj, caminho)
  };
}

/** Constrói a tupla de 4 ou 5 alternativas; o tamanho já foi conferido pelo chamador. */
function alternativasDe(lidas: readonly string[]): AlternativasQuiz {
  const [a1 = '', a2 = '', a3 = '', a4 = '', a5 = ''] = lidas;
  return lidas.length === 5 ? [a1, a2, a3, a4, a5] : [a1, a2, a3, a4];
}

function lerMultiplaEscolha(
  c: Coletor,
  obj: Objeto,
  caminho: string,
  base: BasePergunta
): PerguntaJuri {
  const alternativas = obj.alternativasHtml;
  const onde = `${caminho}.alternativasHtml`;
  let lidas: string[] = [];
  if (!Array.isArray(alternativas)) {
    c.erro(alternativas === undefined ? 'campo-ausente' : 'tipo-invalido', onde);
  } else {
    if (alternativas.length !== 4 && alternativas.length !== 5) c.erro('quantidade', onde);
    lidas = alternativas.map((alt, i) =>
      typeof alt === 'string'
        ? validarTexto(c, alt, `${onde}[${i}]`, 'html')
        : (c.erro('tipo-invalido', `${onde}[${i}]`), '')
    );
  }
  const correta = obj.correta;
  const corretaValida =
    typeof correta === 'number' &&
    Number.isInteger(correta) &&
    correta >= 0 &&
    correta < lidas.length;
  if (!corretaValida) c.erro('correta-fora', `${caminho}.correta`);
  const indiceCorreto: IndiceAlternativa = corretaValida ? (correta as IndiceAlternativa) : 0;
  return { ...base, alternativasHtml: alternativasDe(lidas), correta: indiceCorreto };
}

const PERGUNTA_VAZIA: PerguntaJuri = {
  id: 0,
  categoria: '',
  enunciadoHtml: '',
  fonteExtra: false,
  explicacaoHtml: '',
  alternativasHtml: ['', '', '', ''],
  correta: 0,
  fontes: []
};

function lerPergunta(c: Coletor, bruto: unknown, indice: number, caminho: string): PerguntaJuri {
  const obj = lerObjeto(c, bruto, caminho);
  if (!obj) return PERGUNTA_VAZIA;
  // A Júri não declara fonteExtra: a fonte é o campo `fontes`. Se vier, reprova.
  if ('fonteExtra' in obj) c.erro('campo-proibido', `${caminho}.fonteExtra`);
  if (obj.id !== indice + 1) c.erro('id-invalido', `${caminho}.id`);
  const base: BasePergunta = {
    id: indice + 1,
    categoria: lerTexto(c, obj, 'categoria', caminho, 'puro'),
    enunciadoHtml: lerTexto(c, obj, 'enunciadoHtml', caminho, 'html'),
    fonteExtra: false,
    explicacaoHtml: lerTexto(c, obj, 'explicacaoHtml', caminho, 'html'),
    fontes: lerFontes(c, obj, caminho)
  };
  if (obj.tipo === 'verdadeiro-ou-falso') {
    const correta = obj.correta;
    if (typeof correta !== 'boolean') c.erro('correta-fora', `${caminho}.correta`);
    return { ...base, tipo: 'verdadeiro-ou-falso', correta: correta === true };
  }
  if (obj.tipo !== undefined && obj.tipo !== 'multipla-escolha') {
    c.erro('tipo-invalido', `${caminho}.tipo`);
  }
  return lerMultiplaEscolha(c, obj, caminho, base);
}

function lerMapa(c: Coletor, bruto: unknown): NoMapa {
  const visitar = (no: unknown, nivel: number, caminho: string): NoMapa => {
    const obj = lerObjeto(c, no, caminho);
    if (!obj) return { rotulo: '' };
    const rotulo = lerTexto(c, obj, 'rotulo', caminho, 'puro');
    const filhos = obj.filhos;
    if (filhos === undefined) return { rotulo };
    if (!Array.isArray(filhos)) {
      c.erro('tipo-invalido', `${caminho}.filhos`);
      return { rotulo };
    }
    if (filhos.length > 0 && nivel >= PROFUNDIDADE_MAXIMA_MAPA_JURI) {
      c.erro('profundidade', caminho);
      return { rotulo };
    }
    return {
      rotulo,
      filhos: filhos.map((f, i) => visitar(f, nivel + 1, `${caminho}.filhos[${i}]`))
    };
  };
  const raiz = visitar(bruto, 0, 'mapa');
  if (!raiz.filhos || raiz.filhos.length === 0) c.erro('quantidade', 'mapa');
  return raiz;
}

/** Só `validarConteudoJuri` chama isto; o objeto construído já é próprio, então congela-se. */
function congelar<T>(valor: T): T {
  if (typeof valor === 'object' && valor !== null && !Object.isFrozen(valor)) {
    Object.values(valor).forEach(congelar);
    Object.freeze(valor);
  }
  return valor;
}

/** Mesma regra do quiz das páginas: alternativas homogêneas e sem letra nem posição. */
function validarQuiz(c: Coletor, quiz: readonly PerguntaJuri[]): void {
  const tamanhos = new Set(
    quiz.flatMap((p) => ('alternativasHtml' in p ? [p.alternativasHtml.length] : []))
  );
  if (tamanhos.size > 1) c.erro('alternativas-homogeneas', 'quiz');
  for (const erro of validarCitacaoDeAlternativa(quiz)) {
    // O detalhe do validador traz o trecho citado: descartado, o erro não ecoa valor.
    c.erro('citacao-de-alternativa', erro.caminho);
  }
}

/**
 * Valida o JSON da Júri ANTES de qualquer renderização. Função pura (roda no
 * navegador, no Node e no portão de vazamento). `idsDoAcervo` é o índice de
 * imagens cifradas: uma imagem fora dele reprova. Rejeita o payload inteiro ao
 * primeiro defeito; não há "limpar e seguir". Constrói um objeto novo, só com
 * os campos conhecidos, e o congela.
 */
export function validarConteudoJuri(
  json: unknown,
  idsDoAcervo: ReadonlySet<string>
): ResultadoValidacaoJuri {
  const c = new Coletor();
  const raiz = lerObjeto(c, json, '');
  if (!raiz) return { ok: false, erros: c.erros };

  const quiz = lerLista(
    c,
    raiz.quiz,
    'quiz',
    { minimo: QUANTIDADE_PERGUNTAS_JURI, maximo: QUANTIDADE_PERGUNTAS_JURI },
    (item, indice, caminho) => lerPergunta(c, item, indice, caminho)
  );
  validarQuiz(c, quiz);

  const conteudo: ConteudoJuri = {
    titulo: lerTexto(c, raiz, 'titulo', '', 'puro'),
    resumo: lerLista(c, raiz.resumo, 'resumo', { minimo: 1 }, (b, _i, cam) =>
      lerBlocoResumo(c, b, cam)
    ),
    quadroTermos: lerLista(
      c,
      raiz.quadroTermos,
      'quadroTermos',
      { minimo: QUADRO_TERMOS_MINIMO },
      (l, _i, cam) => lerLinhaTermo(c, l, cam)
    ),
    fichamento: lerLista(c, raiz.fichamento, 'fichamento', { minimo: 1 }, (f, _i, cam) =>
      lerFicha(c, f, cam)
    ),
    respostasDefesa: lerLista(
      c,
      raiz.respostasDefesa,
      'respostasDefesa',
      { minimo: 1 },
      (r, _i, cam) => lerRespostaDefesa(c, r, cam)
    ),
    mnemonicos: lerLista(c, raiz.mnemonicos, 'mnemonicos', { minimo: 1 }, (m, _i, cam) =>
      lerMnemonico(c, m, cam)
    ),
    mapa: lerMapa(c, raiz.mapa),
    quiz,
    imagens: lerLista(c, raiz.imagens, 'imagens', { minimo: 0 }, (img, _i, cam) =>
      lerImagem(c, img, cam, idsDoAcervo)
    )
  };

  if (c.erros.length > 0) return { ok: false, erros: c.erros };
  return { ok: true, conteudo: congelar(conteudo) as ConteudoJuriValidado };
}
