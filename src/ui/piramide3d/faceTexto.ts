// Texto pintado na face da fatia. Mede e pinta num canvas 2D na resolução final; a cena usa o canvas
// como textura de uma pele sem luz. Nada aqui escreve frase: o texto chega do conteúdo.
import {
  BARRA,
  FATOR_NOME,
  FATOR_NOME_NORMA,
  fonteCorpo,
  fonteNome,
  fonteRotulo,
  leiaute
} from '@/app/piramide3d/nucleo';
import type { LeiauteFace, Medidor } from '@/core/piramide3d/layoutFace';
import type { NivelFigura3d } from '@/core/piramide3d/tipos';

/** Cores da face (variáveis --pir-face-* de estilo.css, lidas por figura.ts). */
export interface CoresDaFace {
  readonly topo: string;
  readonly base: string;
  readonly faixa: string;
  readonly nome: string;
  readonly explicacao: string;
  readonly exemploTexto: string;
  readonly exemploRotulo: string;
  readonly filete: string;
}

/** Medidor de texto sobre um contexto 2D: o core mede sem saber de canvas. */
export function medidorDoCanvas(ctx: CanvasRenderingContext2D): Medidor {
  return {
    definirFonte(fonte) {
      ctx.font = fonte;
    },
    largura(texto) {
      return ctx.measureText(texto).width;
    }
  };
}

export interface EntradaPintarFace {
  readonly info: NivelFigura3d;
  readonly Lpx: number;
  readonly AmaxPx: number;
  readonly razao: number;
  readonly cores: CoresDaFace;
  readonly escala: number;
  readonly medida: Medidor;
  /** Moldura dupla de filete (10 e 14 px da borda), só da norma fundamental. */
  readonly ornamento: boolean;
}

/** Pinta a face inteira: pedra, filete, faixa e barra do exemplo, e o texto. */
export function pintarFace({
  info,
  Lpx,
  AmaxPx,
  razao,
  cores,
  escala,
  medida,
  ornamento
}: EntradaPintarFace): { canvas: HTMLCanvasElement; layout: LeiauteFace } {
  const lay = leiaute(medida, info, Lpx, razao, AmaxPx, ornamento ? FATOR_NOME_NORMA : FATOR_NOME);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(Lpx * escala);
  canvas.height = Math.round(lay.Apx * escala);
  const g = canvas.getContext('2d');
  if (!g) throw new Error('canvas 2D indisponível para pintar a face');
  g.setTransform(canvas.width / Lpx, 0, 0, canvas.height / lay.Apx, 0, 0);

  const degrade = g.createLinearGradient(0, 0, 0, lay.Apx);
  degrade.addColorStop(0, cores.topo);
  degrade.addColorStop(1, cores.base);
  g.fillStyle = degrade;
  g.fillRect(0, 0, Lpx, lay.Apx);

  if (ornamento) {
    g.strokeStyle = cores.filete;
    for (const [inset, espessura] of [
      [10, 1.5],
      [14, 1]
    ] as const) {
      g.lineWidth = espessura;
      g.strokeRect(inset, inset, Lpx - 2 * inset, lay.Apx - 2 * inset);
    }
  }

  if (lay.exemplo) {
    g.fillStyle = cores.faixa;
    g.fillRect(lay.exemplo.bloco.x, lay.exemplo.bloco.y, lay.exemplo.bloco.w, lay.exemplo.bloco.h);
    g.fillStyle = cores.filete;
    g.fillRect(lay.exemplo.bloco.x, lay.exemplo.bloco.y, BARRA, lay.exemplo.bloco.h);
  }
  g.fillStyle = cores.filete;
  g.fillRect(lay.filete.x, lay.filete.y, lay.filete.w, lay.filete.h);

  g.textBaseline = 'middle';
  g.font = fonteNome(lay.f, lay.fatorNome);
  g.fillStyle = cores.nome;
  g.textAlign = 'center';
  lay.nome.linhas.forEach((l, i) =>
    g.fillText(l.t, Lpx / 2, lay.nome.caixa.y + (i + 0.5) * lay.nome.hLinha)
  );
  g.textAlign = 'left';
  g.font = fonteCorpo(lay.f);
  g.fillStyle = cores.explicacao;
  lay.explicacao.linhas.forEach((l, i) =>
    g.fillText(
      l.t,
      lay.explicacao.caixa.x,
      lay.explicacao.caixa.y + (i + 0.5) * lay.explicacao.hLinha
    )
  );
  const ex = lay.exemplo;
  if (ex) {
    g.font = fonteRotulo(lay.f);
    g.fillStyle = cores.exemploRotulo;
    g.fillText('Exemplo', ex.rotulo.x, ex.rotulo.y + ex.hRotuloLinha / 2);
    g.font = fonteCorpo(lay.f);
    g.fillStyle = cores.exemploTexto;
    ex.linhas.forEach((l, i) => g.fillText(l.t, ex.texto.x, ex.texto.y + (i + 0.5) * ex.hLinha));
  }

  return { canvas, layout: lay };
}
