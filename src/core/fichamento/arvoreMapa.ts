import type { FichaPensador, MapaFichamento, NoMapa } from './tipos';

/** Percorre a árvore em pré-ordem (ordem de leitura), a raiz primeiro. */
export function percorrer(raiz: NoMapa): NoMapa[] {
  const saida: NoMapa[] = [];
  const visitar = (no: NoMapa): void => {
    saida.push(no);
    no.filhos.forEach(visitar);
  };
  visitar(raiz);
  return saida;
}

/** Ids dos nós que podem abrir e fechar, isto é, os que têm filhos. */
export function idsExpansiveis(raiz: NoMapa): string[] {
  return percorrer(raiz)
    .filter((no) => no.filhos.length > 0)
    .map((no) => no.id);
}

function rotuloPensador(ficha: FichaPensador): string {
  return ficha.datas ? `${ficha.nome} (${ficha.datas})` : ficha.nome;
}

function nosDoPensador(ficha: FichaPensador): NoMapa[] {
  const base = `mapa-${ficha.id}`;
  const nos: NoMapa[] = [
    {
      id: `${base}-modo`,
      tipo: 'modo',
      rotulo: 'Modo de pensar',
      detalhe: ficha.modoDePensar,
      filhos: []
    }
  ];
  if (ficha.conceitos.length > 0) {
    nos.push({
      id: `${base}-conceitos`,
      tipo: 'conceitos',
      rotulo: 'Conceitos-chave',
      filhos: ficha.conceitos.map((conceito, indice) => ({
        id: `${base}-conceito-${indice}`,
        tipo: 'conceito' as const,
        rotulo: conceito,
        filhos: []
      }))
    });
  }
  nos.push({
    id: `${base}-direito`,
    tipo: 'direito',
    rotulo: 'Para o Direito hoje',
    detalhe: ficha.paraODireito,
    filhos: []
  });
  if (ficha.ressalva) {
    nos.push({
      id: `${base}-ressalva`,
      tipo: 'ressalva',
      rotulo: 'Ressalva das fontes',
      detalhe: ficha.ressalva,
      filhos: []
    });
  }
  return nos;
}

/**
 * Monta a árvore do mapa mental a partir dos dados do fichamento: a mesma
 * fonte alimenta as duas abas. Falha alto se um pensador aponta para fase
 * que não existe, em vez de sumir com ele do mapa sem avisar.
 */
export function construirArvoreMapa(dados: MapaFichamento): NoMapa {
  const fasesConhecidas = new Set(dados.eras.flatMap((era) => era.fases.map((f) => f.id)));
  for (const ficha of dados.pensadores) {
    if (!fasesConhecidas.has(ficha.faseId)) {
      throw new Error(`Pensador "${ficha.id}" aponta para a fase inexistente "${ficha.faseId}"`);
    }
  }

  return {
    id: 'mapa-raiz',
    tipo: 'raiz',
    rotulo: dados.titulo,
    filhos: dados.eras.map((era) => ({
      id: `mapa-era-${era.id}`,
      tipo: 'era' as const,
      rotulo: era.datas ? `${era.nome} (${era.datas})` : era.nome,
      filhos: era.fases.map((fase) => ({
        id: `mapa-fase-${fase.id}`,
        tipo: 'fase' as const,
        rotulo: fase.datas ? `${fase.nome} (${fase.datas})` : fase.nome,
        filhos: dados.pensadores
          .filter((ficha) => ficha.faseId === fase.id)
          .map((ficha) => ({
            id: `mapa-pensador-${ficha.id}`,
            tipo: 'pensador' as const,
            rotulo: rotuloPensador(ficha),
            fichaId: ficha.id,
            filhos: nosDoPensador(ficha)
          }))
      }))
    }))
  };
}
