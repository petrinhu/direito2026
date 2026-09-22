/** Chave completa de progresso de uma unidade, ex.: 'p1/intr-direito/u1'. */
export type ChaveUnidade = string;

export interface RegistroProgressoUnidade {
  readonly versao: 1;
  readonly atualizadoEm: string;
  /** Ids de bloco do resumo já lidos. */
  readonly blocosLidos: readonly string[];
  readonly ultimaAba: 'resumo' | 'peticao' | 'quiz';
  /** Semente do embaralhamento da rodada de quiz em curso ou concluída. */
  readonly quizSemente?: number;
  /** Mapa id da pergunta -> índice escolhido, na ordem embaralhada da semente acima. */
  readonly quizRespostas?: Readonly<Record<number, 0 | 1 | 2 | 3>>;
  readonly quizFinalizado?: boolean;
}

export type TemaEscolhido = 'sistema' | 'claro' | 'escuro';

/**
 * Porta de saída de core para persistência (Dependency Inversion, seção 2 da
 * arquitetura). app/persistencia traz as implementações concretas.
 * Toda operação pode falhar (Safari em modo privado, cota estourada, ITP de
 * 7 dias): por isso ler nunca lança, e escrever devolve se funcionou.
 */
export interface RepositorioProgresso {
  ler(chave: ChaveUnidade): RegistroProgressoUnidade | undefined;
  salvar(chave: ChaveUnidade, registro: RegistroProgressoUnidade): boolean;
  lerTema(): TemaEscolhido | undefined;
  salvarTema(tema: TemaEscolhido): boolean;
}
