import medidas from './sprites/medidas.json';
import corrida0 from './sprites/kelsen-correndo-0.png';
import corrida1 from './sprites/kelsen-correndo-1.png';
import abaixado0 from './sprites/kelsen-abaixado-0.png';
import abaixado1 from './sprites/kelsen-abaixado-1.png';
import parado0 from './sprites/kelsen-parado-0.png';
import corrida0Escuro from './sprites/kelsen-correndo-0-escuro.png';
import corrida1Escuro from './sprites/kelsen-correndo-1-escuro.png';
import abaixado0Escuro from './sprites/kelsen-abaixado-0-escuro.png';
import abaixado1Escuro from './sprites/kelsen-abaixado-1-escuro.png';
import parado0Escuro from './sprites/kelsen-parado-0-escuro.png';
import nuvem from './sprites/nuvem.png';
import nuvemEscura from './sprites/nuvem-escuro.png';

/**
 * Quadros do Kelsen, gerados no PixelLab a partir do retrato de Hans Kelsen de cerca de 1930, de
 * Georg Fayer, em domínio público (ÖNB, via Wikimedia Commons). Normalizados pelo pé pelo script de
 * geração; o escuro é a versão invertida (branco sobre preto). A nuvem também é do PixelLab, com o
 * mesmo critério de versão escura.
 */
const URLS: Record<string, string> = {
  'correndo-0': corrida0,
  'correndo-1': corrida1,
  'abaixado-0': abaixado0,
  'abaixado-1': abaixado1,
  'parado-0': parado0,
  'correndo-0-escuro': corrida0Escuro,
  'correndo-1-escuro': corrida1Escuro,
  'abaixado-0-escuro': abaixado0Escuro,
  'abaixado-1-escuro': abaixado1Escuro,
  'parado-0-escuro': parado0Escuro,
  nuvem,
  'nuvem-escuro': nuvemEscura
};

const imagens = new Map<string, globalThis.HTMLImageElement>();

/** Canvas de cada quadro do Kelsen (todos do mesmo tamanho, pés na última linha). */
export const TAMANHO_QUADRO = medidas.canvas;

/**
 * Imagem do quadro, quando já carregou; undefined enquanto não carrega ou se não carregar, e então
 * quem desenha usa o traço de reserva. Carrega sob demanda, uma vez por quadro.
 */
export function imagemDoQuadro(
  nome: string,
  escuro: boolean
): globalThis.HTMLImageElement | undefined {
  const chave = escuro ? `${nome}-escuro` : nome;
  let img = imagens.get(chave);
  if (!img) {
    const url = URLS[chave];
    if (url === undefined || typeof globalThis.Image === 'undefined') return undefined;
    img = new globalThis.Image();
    img.src = url;
    imagens.set(chave, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : undefined;
}
