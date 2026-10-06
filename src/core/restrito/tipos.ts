import type { BlocoResumo, PerguntaMultiplaEscolha } from '../unidade/tipos';

/** Nó genérico do mapa mental restrito. Rótulo em texto puro. */
export interface NoMapa {
  readonly rotulo: string;
  readonly filhos?: readonly NoMapa[];
}

export interface MetaRestrita {
  readonly titulo: string;
  readonly subtitulo: string;
  readonly descricao: string;
}

export interface EquipeRestrita {
  readonly instituicao: string;
  readonly integrantes: readonly string[];
}

/** Forma do JSON restrito entregue pela API depois do login (versão 1). */
export interface ConteudoRestrito {
  readonly versao: 1;
  readonly meta: MetaRestrita;
  readonly equipe: EquipeRestrita;
  readonly resumo: readonly BlocoResumo[];
  readonly mapa: NoMapa;
  readonly quiz: readonly PerguntaMultiplaEscolha[];
}

declare const marcaValidado: unique symbol;

/**
 * Só `validarConteudoRestrito` produz este tipo. É a prova, no sistema de
 * tipos, de que os campos `*Html` passaram pelo allowlist antes de qualquer
 * `v-html`: JSON cru não satisfaz o tipo.
 */
export type ConteudoRestritoValidado = ConteudoRestrito & { readonly [marcaValidado]: true };

export type CodigoErroRestrito =
  | 'tipo-invalido'
  | 'campo-ausente'
  | 'versao'
  | 'html-proibido'
  | 'entidade-proibida'
  | 'caractere-invalido'
  | 'texto-com-marcacao'
  | 'quantidade'
  | 'id-invalido'
  | 'correta-fora'
  | 'categoria'
  | 'campo-proibido'
  | 'rotulo-longo'
  | 'profundidade'
  | 'limite';

/** Erro de validação: nunca carrega o valor, só onde e por quê. */
export interface ErroValidacao {
  readonly codigo: CodigoErroRestrito;
  readonly caminho: string;
}

export type ResultadoValidacaoRestrita =
  | { readonly ok: true; readonly conteudo: ConteudoRestritoValidado }
  | { readonly ok: false; readonly erros: readonly ErroValidacao[] };
