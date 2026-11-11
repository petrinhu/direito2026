import type { ChaveFigura3d, DadosFigura3d } from '@/core/piramide3d/tipos';

/** O que a tela entrega ao motor para desenhar uma figura em 3D. */
export interface OpcoesFigura {
  /** Elemento vazio, dentro da página, onde o motor monta a cena. */
  readonly palco: HTMLElement;
  readonly chave: ChaveFigura3d;
  readonly dados: DadosFigura3d;
  readonly reduzido: boolean;
  readonly escuro: boolean;
}

/** Uma figura montada: a tela redimensiona quando a página muda e destrói quando sai. */
export interface FiguraMontada {
  redimensionar(): void;
  destruir(): void;
}

export interface EstadoSom {
  /** Os três sons já foram preparados e o navegador sabe tocar áudio. */
  readonly disponivel: boolean;
  /** O navegador liberou o áudio (houve um gesto do leitor). */
  readonly desbloqueado: boolean;
  readonly ativo: boolean;
}

/** Controle de som compartilhado pelas figuras da página. */
export interface ControleSom {
  estado(): EstadoSom;
  /** Chama `aoMudar` quando o estado muda; devolve a função que cancela. */
  ouvir(aoMudar: () => void): () => void;
  alternar(): void;
  testar(): void;
  definirReduzido(reduzido: boolean): void;
}

/** O pedaço carregado sob demanda: a biblioteca gráfica e tudo que depende dela. */
export interface MotorFigura {
  criarFigura(opcoes: OpcoesFigura): FiguraMontada | null;
  obterSom(reduzido: boolean): ControleSom;
}
