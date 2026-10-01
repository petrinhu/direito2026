import { percorrer } from './arvoreMapa';
import type { NoMapa } from './tipos';

export interface AcaoTecla {
  /** Id do nó que deve receber o foco. */
  readonly foco?: string;
  readonly abrir?: string;
  readonly fechar?: string;
  readonly alternar?: string;
}

/** Estado inicial: raiz, eras e fases abertas; os pensadores começam fechados. */
export function abertosIniciais(raiz: NoMapa): Set<string> {
  const abertos = new Set<string>();
  for (const no of percorrer(raiz)) {
    const abreNoInicio = no.tipo === 'raiz' || no.tipo === 'era' || no.tipo === 'fase';
    if (abreNoInicio && no.filhos.length > 0) abertos.add(no.id);
  }
  return abertos;
}

/** Nós visíveis em ordem de leitura: o caminho inteiro até eles está aberto. */
export function nosVisiveis(raiz: NoMapa, abertos: ReadonlySet<string>): NoMapa[] {
  const saida: NoMapa[] = [];
  const visitar = (no: NoMapa): void => {
    saida.push(no);
    if (abertos.has(no.id)) no.filhos.forEach(visitar);
  };
  visitar(raiz);
  return saida;
}

function paiDe(raiz: NoMapa, id: string): NoMapa | undefined {
  return percorrer(raiz).find((no) => no.filhos.some((filho) => filho.id === id));
}

/**
 * Traduz uma tecla em ação sobre a árvore, seguindo o padrão de árvore do
 * WAI-ARIA Authoring Practices: setas verticais movem o foco, direita abre
 * ou desce, esquerda fecha ou sobe, Home e End vão às pontas, Enter e
 * Espaço alternam. Devolve undefined para tecla que a árvore não trata.
 */
export function interpretarTecla(
  raiz: NoMapa,
  abertos: ReadonlySet<string>,
  idFoco: string,
  tecla: string
): AcaoTecla | undefined {
  const visiveis = nosVisiveis(raiz, abertos);
  const posicao = visiveis.findIndex((no) => no.id === idFoco);
  const atual = visiveis[posicao];
  if (!atual) return undefined;
  const temFilhos = atual.filhos.length > 0;
  const estaAberto = abertos.has(atual.id);

  switch (tecla) {
    case 'ArrowDown':
      return { foco: (visiveis[posicao + 1] ?? atual).id };
    case 'ArrowUp':
      return { foco: (visiveis[posicao - 1] ?? atual).id };
    case 'Home':
      return { foco: visiveis[0]!.id };
    case 'End':
      return { foco: visiveis[visiveis.length - 1]!.id };
    case 'ArrowRight':
      if (!temFilhos) return {};
      return estaAberto ? { foco: atual.filhos[0]!.id } : { abrir: atual.id };
    case 'ArrowLeft': {
      if (temFilhos && estaAberto) return { fechar: atual.id };
      const pai = paiDe(raiz, atual.id);
      return pai ? { foco: pai.id } : {};
    }
    case 'Enter':
    case ' ':
      return temFilhos ? { alternar: atual.id } : {};
    default:
      return undefined;
  }
}
