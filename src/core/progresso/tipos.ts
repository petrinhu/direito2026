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
  /**
   * Modo de leitura adaptada (baixa visão), docs/modo-adaptado.md. Booleano,
   * não um tipo com "sistema": o modo nunca liga sozinho por preferência do
   * sistema (seção 7 da especificação), só pelo clique explícito no botão.
   */
  lerModoAdaptado(): boolean;
  salvarModoAdaptado(ativo: boolean): boolean;
  /**
   * Marca de que a faixa de aviso de armazenamento (ordem do líder,
   * 22/09/2026) já foi confirmada. Sobre localStorage, sobrevive a
   * recarregar a página; sobre a implementação em memória (armazenamento
   * indisponível), dura só a sessão atual, de propósito: sem isso a
   * faixa reapareceria a cada página, em laço, quando o navegador bloqueia
   * o armazenamento persistente.
   */
  lerAvisoArmazenamentoVisto(): boolean;
  marcarAvisoArmazenamentoVisto(): boolean;
  /** Apaga progresso, tema e a marca do aviso. Devolve o site ao estado inicial. */
  limparTudo(): void;
}
