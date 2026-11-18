/* global WebGL2RenderingContext */
// Mede o que o navegador do leitor aguenta. Nada aqui faz rede. É a única parte de src/app/piramide3d
// que lê janela, canvas e tema; o resto recebe fatos já medidos.

let webgl2Cache: boolean | null = null;

/** O navegador entrega um contexto WebGL2? Medido uma vez: criar contexto é caro. */
export function temWebGL2(): boolean {
  if (webgl2Cache !== null) return webgl2Cache;
  try {
    const tela = document.createElement('canvas');
    const contexto = tela.getContext('webgl2');
    // A resposta já está decidida antes de liberar: uma falha na liberação não muda o resultado.
    webgl2Cache = contexto !== null;
    liberarContexto(contexto);
  } catch {
    webgl2Cache = false;
  }
  return webgl2Cache;
}

// A sondagem abre um contexto só para perguntar. Sem liberá-lo, cada carga de página deixa um a mais.
function liberarContexto(contexto: WebGL2RenderingContext | null): void {
  try {
    contexto?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    // Só higiene: a resposta da sondagem já foi gravada.
  }
}

/** Tamanho da janela útil, sem a barra de rolagem. */
export function medirJanela(): { largura: number; altura: number } {
  const raiz = document.documentElement;
  return { largura: raiz.clientWidth, altura: raiz.clientHeight };
}

/** O tema escuro está valendo? Atributo data-theme manda; sem ele, a preferência do sistema. */
export function temaEscuro(): boolean {
  const atributo = document.documentElement.getAttribute('data-theme');
  if (atributo === 'dark') return true;
  if (atributo === 'light') return false;
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
}
