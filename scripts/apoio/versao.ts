// Regra de versão do Caderno de Direito, igual à do GlintFx: A.B.C.D.
// recurso novo sobe B (zera C e D); só correção sobe C (zera D); só
// construção, empacotamento ou teste sobe D. A só muda por ordem expressa do
// líder, por isso não existe tipo que mexa em A: ele entra só por --versao.
// Puro: não lê nem grava arquivo. Quem toca o disco é scripts/apoio/versao-cli.ts.

export type TipoMudanca = 'recurso' | 'correcao' | 'construcao';

export type Versao = readonly [number, number, number, number];

const TIPOS_VALIDOS: readonly TipoMudanca[] = ['recurso', 'correcao', 'construcao'];

// Sem zero à esquerda: "01.0.0.0" e "1.0.0.0" seriam duas grafias da mesma versão.
const NUMERO = '(0|[1-9]\\d*)';
const PADRAO_TRES = new RegExp(`^${NUMERO}\\.${NUMERO}\\.${NUMERO}$`);
const PADRAO_QUATRO = new RegExp(`^${NUMERO}\\.${NUMERO}\\.${NUMERO}\\.${NUMERO}$`);

export function ehTipo(valor: string): valor is TipoMudanca {
  return (TIPOS_VALIDOS as readonly string[]).includes(valor);
}

// Aceita 3 números (versão antiga do package.json, ex. 0.1.0) e trata o quarto
// como zero. Não aceita o que não é versão.
export function lerVersao(texto: string): Versao {
  const quatro = PADRAO_QUATRO.exec(texto);
  if (quatro) {
    return [Number(quatro[1]), Number(quatro[2]), Number(quatro[3]), Number(quatro[4])];
  }
  const tres = PADRAO_TRES.exec(texto);
  if (tres) {
    return [Number(tres[1]), Number(tres[2]), Number(tres[3]), 0];
  }
  throw new Error(`versão atual inválida: "${texto}" (esperado A.B.C ou A.B.C.D)`);
}

export function formatarVersao(versao: Versao): string {
  return versao.join('.');
}

// Comparação componente a componente, como número (1.10 > 1.9).
export function compararVersoes(a: Versao, b: Versao): number {
  const [a1, a2, a3, a4] = a;
  const [b1, b2, b3, b4] = b;
  return a1 - b1 || a2 - b2 || a3 - b3 || a4 - b4;
}

export function proximaVersao(atual: Versao, tipo: TipoMudanca): Versao {
  const [a, b, c, d] = atual;
  switch (tipo) {
    case 'recurso':
      return [a, b + 1, 0, 0];
    case 'correcao':
      return [a, b, c + 1, 0];
    case 'construcao':
      return [a, b, c, d + 1];
  }
}

// --versao forçada: exatamente 4 números, sem zero à esquerda, e estritamente
// maior que a versão atual.
export function validarVersaoForcada(texto: string, atual: Versao): Versao {
  const casa = PADRAO_QUATRO.exec(texto);
  if (!casa) {
    throw new Error(`--versao "${texto}" inválida: precisa ter quatro números (A.B.C.D)`);
  }
  const forcada: Versao = [Number(casa[1]), Number(casa[2]), Number(casa[3]), Number(casa[4])];
  if (compararVersoes(forcada, atual) <= 0) {
    throw new Error(
      `--versao ${texto} precisa ser maior que a versão atual ${formatarVersao(atual)}`
    );
  }
  return forcada;
}

// Ponto de entrada da regra: versão atual + tipo (+ --versao opcional) -> versão
// nova já formatada com 4 números. Lança Error com mensagem em pt-br.
export function calcularVersao(atualTexto: string, tipo: string, forcadaTexto?: string): string {
  if (!ehTipo(tipo)) {
    throw new Error(`tipo "${tipo}" inválido: use recurso, correcao ou construcao`);
  }
  const atual = lerVersao(atualTexto);
  if (forcadaTexto !== undefined) {
    return formatarVersao(validarVersaoForcada(forcadaTexto, atual));
  }
  return formatarVersao(proximaVersao(atual, tipo));
}

// Troca só o campo "version" de um package.json. Recusa arquivo que não esteja
// no formato que JSON.stringify(_, null, 2) + quebra de linha reproduz byte a
// byte: assim a reescrita nunca reformata o resto do arquivo.
export function reescreverVersaoDoPackage(texto: string, novaVersao: string): string {
  const objeto: unknown = JSON.parse(texto);
  if (typeof objeto !== 'object' || objeto === null || !('version' in objeto)) {
    throw new Error('package.json sem campo "version"');
  }
  const formatoPadrao = `${JSON.stringify(objeto, null, 2)}\n`;
  if (formatoPadrao !== texto) {
    throw new Error(
      'package.json fora do formato padrão (2 espaços e quebra final): recuso reescrever'
    );
  }
  (objeto as { version: string }).version = novaVersao;
  return `${JSON.stringify(objeto, null, 2)}\n`;
}
