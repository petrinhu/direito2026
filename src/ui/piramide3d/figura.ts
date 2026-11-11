/* global HTMLElementTagNameMap, SVGLineElement, SVGSVGElement, performance */
// Uma figura em 3D montada: cria a cena, os rótulos ao lado da pirâmide, as guias e o leitor de
// tela, e trata ponteiro, teclado e toque. Quem decide SE a figura entra em 3D é a tela
// (FiguraPiramide.vue); aqui a figura já vai ser desenhada.
import * as THREE from 'three';
import {
  PERFIS,
  cantosDoRetangulo,
  cascoConvexo,
  dentroDoConvexo,
  nivelSobPonteiro
} from '@/app/piramide3d/nucleo';
import type { FiguraMontada, OpcoesFigura } from '@/app/piramide3d/tiposMotor';
import type {
  DadosFigura3d,
  FormaNivel,
  NivelFigura3d,
  Ponto,
  Retangulo
} from '@/core/piramide3d/tipos';
import { criarCena, type Cena, type Paleta } from './cena';
import { somDaPagina } from './controleSom';
import type { Som } from './sons';

const LADO_ESQ = 0.27; // fração da largura para a coluna de setas
const LADO_DIR = 0.31; // fração da largura para a coluna de níveis
const BORDA_ESQ = 0.3; // onde a coluna esquerda encosta na área da pirâmide
const BORDA_DIR = 0.66; // onde a coluna direita começa
const TOLERANCIA_SAIDA_MS = 120; // o mouse pode sair da zona por este tempo sem fechar
const IGNORAR_ROLAGEM_FOCO_MS = 150; // rolagem que o próprio foco provoca não fecha a fatia
const NS_SVG = 'http://www.w3.org/2000/svg';

interface ItemRotulo {
  readonly chave: string;
  readonly lado: 'esq' | 'dir';
  readonly el: HTMLElement;
  readonly linha: SVGLineElement;
  h: number;
  y: number;
  ideal: number;
  ax: number;
  ay: number;
}

function relaxar(itens: ItemRotulo[], altura: number, folga: number): void {
  itens.sort((a, b) => a.ideal - b.ideal);
  for (const it of itens) it.y = Math.min(Math.max(it.ideal, 0), altura - it.h);
  for (let rep = 0; rep < 90; rep++) {
    let mexeu = false;
    for (let i = 1; i < itens.length; i++) {
      const a = itens[i - 1] as ItemRotulo;
      const b = itens[i] as ItemRotulo;
      const sobra = a.y + a.h + folga - b.y;
      if (sobra > 0.01) {
        a.y -= sobra / 2;
        b.y += sobra / 2;
        mexeu = true;
      }
    }
    for (const it of itens) it.y = Math.min(Math.max(it.y, 0), altura - it.h);
    if (!mexeu) break;
  }
}

function lerPaleta(elemento: HTMLElement): Paleta {
  const cs = getComputedStyle(elemento);
  const v = (nome: string): string => cs.getPropertyValue(nome).trim();
  const cor = (nome: string): THREE.Color => new THREE.Color(v(nome));
  return {
    fundo: cor('--cor-fundo'),
    texto: cor('--cor-texto'),
    ouro: cor('--pir-ouro'),
    ouroLuz: cor('--pir-ouro-luz'),
    petroleo: cor('--pir-petroleo'),
    areia: cor('--pir-areia'),
    sombra: cor('--pir-sombra'),
    faceCores: {
      topo: v('--pir-face-topo'),
      base: v('--pir-face-base'),
      faixa: v('--pir-face-faixa'),
      nome: v('--pir-face-nome'),
      explicacao: v('--pir-face-explicacao'),
      exemploTexto: v('--pir-face-exemplo'),
      exemploRotulo: v('--pir-face-rotulo'),
      filete: v('--pir-face-filete')
    }
  };
}

function criarElemento<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  classe: string
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = classe;
  return el;
}

/** Os elementos da cena, criados por DOM (createElement, sem marcação injetada). */
function montarDom(
  palco: HTMLElement,
  dados: DadosFigura3d
): {
  cenaEl: HTMLElement;
  canvas: HTMLCanvasElement;
  sobreposicao: HTMLElement;
  guias: SVGSVGElement;
  leitor: HTMLElement;
} {
  const cenaEl = criarElemento('div', 'pir-cena');
  const canvas = criarElemento('canvas', 'pir-tela');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', dados.aria);
  const sobreposicao = criarElemento('div', 'pir-sobreposicao');
  const guias = document.createElementNS(NS_SVG, 'svg');
  guias.setAttribute('class', 'pir-guias');
  guias.setAttribute('aria-hidden', 'true');
  guias.setAttribute('focusable', 'false');
  const leitor = criarElemento('div', 'pir-leitor');
  leitor.setAttribute('aria-live', 'polite');
  cenaEl.append(canvas, sobreposicao, guias, leitor);
  palco.replaceChildren(cenaEl);
  return { cenaEl, canvas, sobreposicao, guias, leitor };
}

class FiguraTresD implements FiguraMontada {
  private readonly nomes: Map<string, NivelFigura3d>;
  private readonly perfil: (typeof PERFIS)['kelsen'];
  private readonly figuraEl: HTMLElement;
  private itens: ItemRotulo[] = [];
  private hover: string | null = null;
  private foco: string | null = null;
  private travado: string | null = null;
  private ativo: string | null = null;
  private visivel = true;
  private rafId = 0;
  private ultimoT = 0;
  private saidaHoverTimer: ReturnType<typeof setTimeout> | 0 = 0;
  private ignorarRolagemAte = 0;
  private readonly observadorPosicao: IntersectionObserver | undefined;
  private removerEventos: (() => void) | null = null;

  constructor(
    private readonly palco: HTMLElement,
    private readonly dados: DadosFigura3d,
    private readonly cena: Cena,
    private readonly dom: ReturnType<typeof montarDom>,
    private readonly som: Som,
    perfil: (typeof PERFIS)['kelsen']
  ) {
    this.perfil = perfil;
    this.nomes = new Map(dados.niveis.map((n) => [n.nivel, n]));
    this.figuraEl = palco.closest('figure') ?? palco;
    if (typeof IntersectionObserver === 'function') {
      this.observadorPosicao = new IntersectionObserver((entradas) => {
        this.visivel = entradas.some((e) => e.isIntersecting);
        if (this.visivel) this.pedirQuadro();
      });
      this.observadorPosicao.observe(this.figuraEl);
    }
    this.construirRotulos();
    this.registrarEventos();
    this.redimensionar();
    this.pedirQuadro();
  }

  /** Aviso da tela: a página ou a janela mudou de tamanho. */
  redimensionar(): void {
    const r = this.dom.cenaEl.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    this.cena.redimensionar(window.devicePixelRatio || 1);
    this.dom.guias.setAttribute('viewBox', `0 0 ${w} ${h}`);
    for (const it of this.itens) {
      it.el.style.width = `${Math.round(w * (it.lado === 'dir' ? LADO_DIR : LADO_ESQ))}px`;
    }
    for (const it of this.itens) it.h = it.el.offsetHeight;
    this.pedirQuadro();
  }

  destruir(): void {
    this.fecharTudo();
    this.pararQuadro();
    this.removerEventos?.();
    this.removerEventos = null;
    this.observadorPosicao?.disconnect();
    this.cena.dispose();
    this.dom.sobreposicao.replaceChildren();
    this.dom.guias.replaceChildren();
    this.itens = [];
    this.palco.replaceChildren();
  }

  private construirRotulos(): void {
    this.dom.sobreposicao.replaceChildren();
    this.dom.guias.replaceChildren();
    this.itens = [];
    const adicionar = (chave: string, lado: 'esq' | 'dir', botao: boolean, texto: string): void => {
      let el: HTMLElement;
      if (botao) {
        const b = criarElemento('button', 'pir-rotulo');
        b.type = 'button';
        b.dataset.nivel = chave;
        b.addEventListener('focus', () => {
          this.foco = chave;
          this.ignorarRolagemAte = performance.now() + IGNORAR_ROLAGEM_FOCO_MS;
          this.atualizarAtivo();
        });
        b.addEventListener('blur', () => {
          if (this.foco === chave) this.foco = null;
          this.atualizarAtivo();
        });
        b.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.travado = this.travado === chave ? null : chave;
            this.atualizarAtivo();
          }
        });
        el = b;
      } else {
        el = criarElemento('span', 'pir-rotulo pir-rotulo--texto');
        el.setAttribute('aria-hidden', 'true');
      }
      el.textContent = texto;
      this.dom.sobreposicao.appendChild(el);
      const linha = document.createElementNS(NS_SVG, 'line');
      linha.setAttribute('class', 'pir-guia');
      this.dom.guias.appendChild(linha);
      this.itens.push({ chave, lado, el, linha, h: 0, y: 0, ideal: 0, ax: 0, ay: 0 });
    };

    // Rótulo curto no desenho parado (campo rotulo do conteúdo, ou o nome se faltar).
    const rotuloDe = (nivel: string): string => {
      const info = this.nomes.get(nivel);
      return info ? info.rotulo || info.nome : nivel;
    };
    for (const nivel of this.perfil.fantasma) adicionar(nivel, 'dir', true, rotuloDe(nivel));
    for (const c of this.perfil.camadas) adicionar(c.nivel, 'dir', true, rotuloDe(c.nivel));
    for (const s of this.perfil.setas) adicionar(s.nivel, 'esq', false, rotuloDe(s.nivel));
  }

  // Eventos: ponteiro e saídas ficam no documento e na janela, nunca no canvas (que não recebe ponteiro).
  private registrarEventos(): void {
    const aoMover = (e: PointerEvent): void => {
      if (e.pointerType !== 'mouse') return;
      this.testarPonteiro(e.clientX, e.clientY);
    };
    const aoSairJanela = (e: MouseEvent): void => {
      if (e.relatedTarget === null) this.sairHover();
    };
    const aoTocar = (e: PointerEvent): void => {
      if (e.pointerType === 'mouse') return;
      if (this.travado) {
        this.travado = null;
        this.atualizarAtivo();
        return;
      }
      const nivel = this.nivelEm(e.clientX, e.clientY);
      if (nivel) this.travado = nivel;
      this.atualizarAtivo();
    };
    const aoClicar = (e: MouseEvent): void => {
      if (!this.ativo) return;
      const pt = { x: e.clientX, y: e.clientY };
      const poligono = this.cena.poligonoFinal(this.ativo);
      if (poligono && dentroDoConvexo(pt, cascoConvexo(poligono))) {
        // Dentro da fatia: o clique não chega a nada que esteja escondido embaixo dela.
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      this.fecharTudo();
    };
    const aoTeclar = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') this.fecharTudo();
    };
    const aoRolar = (): void => {
      if (performance.now() < this.ignorarRolagemAte) return;
      this.fecharTudo();
    };
    const aoFicarOculto = (): void => {
      if (document.visibilityState === 'hidden') this.fecharTudo();
    };
    const aoPerderFoco = (): void => this.fecharTudo();
    document.addEventListener('pointermove', aoMover);
    document.addEventListener('pointerdown', aoTocar, true);
    document.addEventListener('click', aoClicar, true);
    document.addEventListener('keydown', aoTeclar);
    document.addEventListener('visibilitychange', aoFicarOculto);
    window.addEventListener('scroll', aoRolar, { passive: true });
    window.addEventListener('wheel', aoRolar, { passive: true });
    window.addEventListener('blur', aoPerderFoco);
    document.documentElement.addEventListener('mouseleave', aoSairJanela);
    this.removerEventos = () => {
      document.removeEventListener('pointermove', aoMover);
      document.removeEventListener('pointerdown', aoTocar, true);
      document.removeEventListener('click', aoClicar, true);
      document.removeEventListener('keydown', aoTeclar);
      document.removeEventListener('visibilitychange', aoFicarOculto);
      window.removeEventListener('scroll', aoRolar);
      window.removeEventListener('wheel', aoRolar);
      window.removeEventListener('blur', aoPerderFoco);
      document.documentElement.removeEventListener('mouseleave', aoSairJanela);
      clearTimeout(this.saidaHoverTimer);
    };
  }

  // Formas do ponteiro, em px do cliente: silhueta de repouso (zona de permanência), face da frente
  // de repouso (quem decide o nível sob o ponteiro) e rótulo.
  private formas(): FormaNivel[] {
    const silhuetas = this.cena.silhuetas();
    const frentes = this.cena.frentes();
    const formas: FormaNivel[] = [];
    for (const it of this.itens) {
      const silhueta = silhuetas.get(it.chave);
      const frente = frentes.get(it.chave);
      if (!silhueta || !frente) continue;
      formas.push({
        nivel: it.chave,
        repouso: cascoConvexo(silhueta),
        frente: cascoConvexo(frente.poligono),
        profundidade: frente.profundidade,
        rotulo: this.retanguloCliente(it.el)
      });
    }
    return formas;
  }

  private retanguloCliente(el: HTMLElement): Retangulo {
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  }

  // Zona de permanência do nível ativo: casco de (polígono final + silhueta + rótulo).
  private zonas(): Map<string, Ponto[]> {
    const mapa = new Map<string, Ponto[]>();
    if (!this.ativo) return mapa;
    const poligono = this.cena.poligonoFinal(this.ativo);
    const forma = this.formas().find((f) => f.nivel === this.ativo);
    if (!poligono || !forma || !forma.repouso || !forma.rotulo) return mapa;
    const pontos = [...poligono, ...forma.repouso, ...cantosDoRetangulo(forma.rotulo)];
    mapa.set(this.ativo, cascoConvexo(pontos));
    return mapa;
  }

  private nivelEm(x: number, y: number): string | null {
    const cenaR = this.dom.cenaEl.getBoundingClientRect();
    const dentro = x >= cenaR.left && x <= cenaR.right && y >= cenaR.top && y <= cenaR.bottom;
    if (!this.ativo && !dentro) return null;
    return nivelSobPonteiro({
      p: { x, y },
      ativo: this.ativo,
      formas: this.formas(),
      zonas: this.zonas()
    });
  }

  private testarPonteiro(x: number, y: number): void {
    const nivel = this.nivelEm(x, y);
    if (this.ativo && this.hover === this.ativo && nivel === this.ativo) return;
    if (nivel) {
      clearTimeout(this.saidaHoverTimer);
      this.saidaHoverTimer = 0;
      this.hover = nivel;
      this.atualizarAtivo();
      return;
    }
    if (this.hover && !this.saidaHoverTimer) {
      // Sair da zona só fecha depois de um pequeno intervalo: evita piscar na borda.
      this.saidaHoverTimer = setTimeout(() => this.sairHover(), TOLERANCIA_SAIDA_MS);
    }
  }

  private sairHover(): void {
    clearTimeout(this.saidaHoverTimer);
    this.saidaHoverTimer = 0;
    if (this.hover === null) return;
    this.hover = null;
    this.atualizarAtivo();
  }

  // Fecha tudo (Esc, clique fora, rolagem, perda de foco): a volta é animada.
  private fecharTudo(): void {
    clearTimeout(this.saidaHoverTimer);
    this.saidaHoverTimer = 0;
    if (!this.hover && !this.foco && !this.travado) return;
    this.hover = this.foco = this.travado = null;
    this.atualizarAtivo();
  }

  private atualizarAtivo(): void {
    const novo = this.travado ?? this.foco ?? this.hover ?? null;
    if (novo === this.ativo) return;
    const anterior = this.ativo;
    this.ativo = novo;
    this.cena.setAtivo(novo);
    this.dom.cenaEl.dataset.zoom = novo ? 'sim' : 'nao';
    const info = novo ? this.nomes.get(novo) : undefined;
    if (novo && info) {
      this.anunciar(info);
      this.som.tocar(novo === 'norma-fundamental' ? 'fundamental' : 'entrar');
    } else {
      this.dom.leitor.textContent = '';
      if (anterior) this.som.tocar('sair');
    }
    for (const it of this.itens) it.el.classList.toggle('pir-rotulo--ativo', it.chave === novo);
    this.pedirQuadro();
  }

  // O texto da fatia vai para o leitor de tela (a fatia traz o texto pintado na textura).
  private anunciar(info: NivelFigura3d): void {
    this.dom.leitor.textContent = info.exemplo
      ? `${info.nome}. ${info.explicacao} Exemplo: ${info.exemplo}`
      : `${info.nome}. ${info.explicacao}`;
  }

  private atualizarRotulos(): void {
    if (!this.itens.length) return;
    const opacidade = this.cena.opacidadeRotulos();
    this.dom.guias.style.opacity = String(opacidade);
    const r = this.dom.cenaEl.getBoundingClientRect();
    const w = r.width;
    const h = r.height;
    const esq: ItemRotulo[] = [];
    const dir: ItemRotulo[] = [];
    for (const it of this.itens) {
      const p = this.cena.projetar(it.chave);
      it.ax = p.x;
      it.ay = p.y;
      it.ideal = p.y - it.h / 2;
      (it.lado === 'esq' ? esq : dir).push(it);
    }
    relaxar(esq, h, 8);
    relaxar(dir, h, 8);
    for (const it of this.itens) {
      it.el.style.transform = `translate(${it.lado === 'esq' ? BORDA_ESQ * w - it.el.offsetWidth : BORDA_DIR * w}px, ${it.y}px)`;
      it.el.style.opacity = String(opacidade);
      const ex = it.lado === 'esq' ? BORDA_ESQ * w + 4 : BORDA_DIR * w - 4;
      const ey = it.y + it.h / 2;
      it.linha.setAttribute('x1', it.ax.toFixed(1));
      it.linha.setAttribute('y1', it.ay.toFixed(1));
      it.linha.setAttribute('x2', ex.toFixed(1));
      it.linha.setAttribute('y2', ey.toFixed(1));
    }
  }

  private pedirQuadro(): void {
    if (this.rafId || !this.visivel) return;
    this.rafId = requestAnimationFrame((t) => this.quadro(t));
  }

  private pararQuadro(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.ultimoT = 0;
  }

  private quadro(t: number): void {
    this.rafId = 0;
    const dt = this.ultimoT ? Math.min((t - this.ultimoT) / 1000, 0.05) : 0.016;
    this.ultimoT = t;
    const anim = this.cena.animar(t, dt);
    this.cena.render();
    this.atualizarRotulos();
    if (anim && this.visivel) {
      this.rafId = requestAnimationFrame((t2) => this.quadro(t2));
    } else {
      this.ultimoT = 0;
    }
  }
}

/** Monta a figura em 3D dentro do palco. Devolve null se o navegador não entrega a cena (WebGL). */
export function criarFigura(opcoes: OpcoesFigura): FiguraMontada | null {
  const perfil = PERFIS[opcoes.chave === 'piramide-kelsen' ? 'kelsen' : 'brasil'];
  const dom = montarDom(opcoes.palco, opcoes.dados);
  const textos = new Map(opcoes.dados.niveis.map((n) => [n.nivel, n]));
  let cena: Cena;
  try {
    cena = criarCena({
      canvas: dom.canvas,
      cenaEl: dom.cenaEl,
      perfil,
      paleta: lerPaleta(opcoes.palco),
      escuro: opcoes.escuro,
      reduzido: opcoes.reduzido,
      textos
    });
  } catch {
    opcoes.palco.replaceChildren();
    return null;
  }
  return new FiguraTresD(
    opcoes.palco,
    opcoes.dados,
    cena,
    dom,
    somDaPagina(opcoes.reduzido),
    perfil
  );
}
