// Repasse do domínio puro de core/piramide3d para src/ui/piramide3d: por desenho (gate
// "ui-nao-pula-app"), a tela importa lógica de core sempre por trás de um módulo de app. Tipos
// continuam indo direto (import type).
export {
  ALTURA,
  GIRO,
  arestasTronco,
  blocosNorma,
  cantosFaceFrente,
  cantosTronco,
  dimsRepouso,
  fatiasRepouso,
  posicoesTronco
} from '@/core/piramide3d/geometria';
export { PERFIS } from '@/core/piramide3d/perfil';
export {
  cantosDoRetangulo,
  cascoConvexo,
  dentroDoConvexo,
  nivelSobPonteiro
} from '@/core/piramide3d/ponteiro';
export {
  FRACAO_ALTURA_FACE,
  FRACAO_LARGURA_VOO,
  PLANO_DISTANTE,
  PLANO_PROXIMO,
  TG_V,
  easeInOutCubic,
  easeOutCubic,
  limitesDaProjecao,
  poseDeVoo
} from '@/core/piramide3d/voo';
export {
  FATOR_NOME,
  FATOR_NOME_NORMA,
  BARRA,
  escalaDaTextura,
  fonteCorpo,
  fonteNome,
  fonteRotulo,
  leiaute
} from '@/core/piramide3d/layoutFace';
