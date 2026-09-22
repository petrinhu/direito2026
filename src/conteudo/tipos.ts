/**
 * Tipos usados pelos dados de src/conteudo/. Tudo aqui já está definido em
 * src/core/*, que é a fonte canônica (docs/arquitetura.md, seção 4). Este
 * arquivo só REEXPORTA, para quem consome dados de src/conteudo/ não
 * precisar caçar o tipo em três módulos diferentes.
 *
 * Histórico: DispositivoLegal e CatalogoDispositivos nasceram definidos
 * aqui, porque src/core/dispositivos/ ainda não existia quando este
 * arquivo foi escrito pela primeira vez. Agora que existe, os dois
 * passaram a reexportar de lá, para não haver duas fontes de verdade do
 * mesmo tipo.
 */

export type {
  EstadoPublicacao,
  ChaveAba,
  ReferenciaUnidade,
  Cadeira,
  Periodo,
  Curriculo,
  ResolucaoRota,
} from '../core/curriculo/tipos';

export type {
  MetaUnidade,
  BlocoResumo,
  SecaoPeca,
  PecaComentada,
  CategoriaQuiz,
  PerguntaQuiz,
  ConteudoUnidade,
} from '../core/unidade/tipos';

export type { DispositivoLegal, CatalogoDispositivos } from '../core/dispositivos/tipos';
