/* global AudioBuffer, AudioBufferSourceNode, AudioContext, GainNode, OfflineAudioContext, location, performance */
// Sons de zoom. Os três buffers são renderizados no carregamento, sem gesto, com OfflineAudioContext
// a 48 kHz. O AudioContext nasce dentro do primeiro gesto de ativação (ou no carregamento, se
// navigator.getAutoplayPolicy disser 'allowed'), com resume() síncrono. Sem AudioContext, a figura
// fica muda: não há reserva por <audio> (a CSP do site não admite URL blob:). Nada é sintetizado no
// hover: o pedido só dispara um buffer pronto.
const PREFIXO = '[piramide] som:';
const TAXA = 48000;
const NOMES = ['entrar', 'sair', 'fundamental'] as const;
export type NomeSom = (typeof NOMES)[number];
const DURACAO: Readonly<Record<NomeSom, number>> = { entrar: 0.6, sair: 0.45, fundamental: 1.6 };
const INTERVALO_MIN_MS = 150;
const PICO_NORMAL_DB = -5;
const PICO_REDUZIDO_DB = -8;
const ESCALA_REDUZIDA = 0.6;
// Norma fundamental: ré maior aberto (D4, A4, D5, F#5), triângulo mais um seno uma oitava acima a 25%.
const NOTAS_FUNDAMENTAL = [293.66, 440, 587.33, 739.99];
const AMP_NOTA = 0.2;
const ATAQUE_FUNDAMENTAL_S = 0.25;

type ConjuntoDeBuffers = Record<NomeSom, AudioBuffer>;

const log = (msg: string): void => console.log(`${PREFIXO} ${msg}`);

function ruido(oc: OfflineAudioContext, dur: number, semente: number): AudioBuffer {
  const n = Math.ceil(dur * oc.sampleRate);
  const buf = oc.createBuffer(1, n, oc.sampleRate);
  const dados = buf.getChannelData(0);
  let s = semente >>> 0;
  for (let i = 0; i < n; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    dados[i] = s / 2147483648 - 1;
  }
  return buf;
}

// Entrada (sobe de 500 a 1700 Hz) e saída (desce de 1700 a 500 Hz): ruído com passa-faixa Q 0,9.
function varredura(oc: OfflineAudioContext, nome: NomeSom, dur: number): void {
  const subindo = nome === 'entrar';
  const f0 = subindo ? 500 : 1700;
  const f1 = subindo ? 1700 : 500;
  const fonte = oc.createBufferSource();
  fonte.buffer = ruido(oc, dur, subindo ? 7 : 11);
  const filtro = oc.createBiquadFilter();
  filtro.type = 'bandpass';
  filtro.Q.value = 0.9;
  filtro.frequency.setValueAtTime(f0, 0);
  filtro.frequency.exponentialRampToValueAtTime(f1, dur);
  const env = oc.createGain();
  env.gain.setValueAtTime(0.0001, 0);
  env.gain.exponentialRampToValueAtTime(1, dur * 0.2);
  env.gain.exponentialRampToValueAtTime(0.1, dur * 0.8);
  env.gain.linearRampToValueAtTime(0.0001, dur);
  // Passa-baixa de 3,2 kHz depois do passa-faixa: sem ele a cauda acima de 4 kHz passa de 5%.
  const suavizar = oc.createBiquadFilter();
  suavizar.type = 'lowpass';
  suavizar.frequency.value = 3200;
  suavizar.Q.value = 0.707;
  fonte.connect(filtro).connect(suavizar).connect(env).connect(oc.destination);
  fonte.start(0);
  fonte.stop(dur);
}

// Norma fundamental: quatro notas em triângulo com oitava de seno a 25%, passa-baixa em 2600 Hz,
// ataque de 0,25 s e cauda até o fim da duração.
function acorde(oc: OfflineAudioContext, dur: number): void {
  const filtro = oc.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.value = 2600;
  filtro.Q.value = 0.707;
  filtro.connect(oc.destination);
  for (const f of NOTAS_FUNDAMENTAL) {
    const tri = oc.createOscillator();
    tri.type = 'triangle';
    tri.frequency.value = f;
    const sen = oc.createOscillator();
    sen.type = 'sine';
    sen.frequency.value = 2 * f;
    const ganhoSen = oc.createGain();
    ganhoSen.gain.value = 0.25;
    const env = oc.createGain();
    env.gain.setValueAtTime(0.0001, 0);
    env.gain.linearRampToValueAtTime(AMP_NOTA, ATAQUE_FUNDAMENTAL_S);
    env.gain.exponentialRampToValueAtTime(0.0001, dur);
    tri.connect(env);
    sen.connect(ganhoSen).connect(env);
    env.connect(filtro);
    tri.start(0);
    sen.start(0);
    tri.stop(dur);
    sen.stop(dur);
  }
}

function desenhar(oc: OfflineAudioContext, nome: NomeSom, dur: number): void {
  if (nome === 'fundamental') acorde(oc, dur);
  else varredura(oc, nome, dur);
}

// Normaliza pelo pico do canal 0 até o alvo em dBFS.
function normalizarPico(buf: AudioBuffer, picoDb: number): AudioBuffer {
  const dados = buf.getChannelData(0);
  let max = 0;
  for (let i = 0; i < dados.length; i++) max = Math.max(max, Math.abs(dados[i] ?? 0));
  if (max === 0) return buf;
  const k = 10 ** (picoDb / 20) / max;
  for (let i = 0; i < dados.length; i++) dados[i] = (dados[i] ?? 0) * k;
  return buf;
}

async function renderizarConjunto(escala: number, picoDb: number): Promise<ConjuntoDeBuffers> {
  const out: Partial<ConjuntoDeBuffers> = {};
  for (const nome of NOMES) {
    const dur = DURACAO[nome] * escala;
    const oc = new OfflineAudioContext(1, Math.ceil((dur + 0.02) * TAXA), TAXA);
    desenhar(oc, nome, dur);
    out[nome] = normalizarPico(await oc.startRendering(), picoDb);
  }
  return out as ConjuntoDeBuffers;
}

// Cadeia de saída: ganho unitário até o destino. O pico já vem fixado em -5 dBFS pela normalização
// dos buffers. Sem DynamicsCompressor: o Chromium aplica ganho de compensação automático.
function montarCadeia(ctx: AudioContext): GainNode {
  const ganho = ctx.createGain();
  ganho.gain.value = 1;
  ganho.connect(ctx.destination);
  return ganho;
}

interface EstadoSomInterno {
  disponivel: boolean;
  erro: string | null;
  caminho: 'nenhum' | 'webaudio';
  desbloqueado: boolean;
  ativo: boolean;
  reduzido: boolean;
  inicios: number;
  aguardando: NomeSom | null;
  pendente: NomeSom | null;
  timer: ReturnType<typeof setTimeout> | 0;
  ultimoInicio: number;
  politica: string | null;
}

export interface Som {
  readonly estado: Readonly<EstadoSomInterno>;
  /** Resolve quando os buffers ficaram prontos (ou a tentativa falhou). */
  readonly pronto: Promise<void>;
  tocar(nome: NomeSom): void;
  gesto(tipo: string): Promise<string>;
  controle(tipo: string): Promise<string>;
  testar(tipo: string): Promise<string>;
  definirReduzido(reduzido: boolean): void;
}

interface AudioContextComFallback {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

/** Som ligado por padrão, inclusive com movimento reduzido (versão mais curta e um pouco mais baixa). */
export function criarSom({ reduzido }: { reduzido: boolean }): Som {
  const estado: EstadoSomInterno = {
    disponivel: false,
    erro: null,
    caminho: 'nenhum',
    desbloqueado: false,
    ativo: true,
    reduzido,
    inicios: 0,
    aguardando: null,
    pendente: null,
    timer: 0,
    ultimoInicio: -1e9,
    politica: null
  };
  let contexto: AudioContext | null = null;
  let entradaCadeia: GainNode | null = null;
  let bufs: ConjuntoDeBuffers | null = null;
  let bufsReduzidos: ConjuntoDeBuffers | null = null;
  let fonteAtiva: AudioBufferSourceNode | null = null;
  // O construtor do AudioContext lançou erro: não adianta tentar de novo a cada gesto.
  let semContexto = false;

  function criarContexto(): AudioContext {
    const janela = window as unknown as AudioContextComFallback;
    const Ctx = janela.AudioContext ?? janela.webkitAudioContext;
    if (!Ctx) throw new Error('AudioContext indisponível');
    const novo = new Ctx({ latencyHint: 'interactive' });
    contexto = novo;
    entradaCadeia = montarCadeia(novo);
    return novo;
  }

  // Toca um buffer mudo de uma amostra: destrava o grafo dentro do próprio gesto.
  function tocarMudo(ctx: AudioContext): void {
    const s = ctx.createBufferSource();
    s.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    s.connect(ctx.destination);
    s.start(0);
  }

  function iniciarFonte(nome: NomeSom): void {
    const conjunto = estado.reduzido ? bufsReduzidos : bufs;
    if (!contexto || !entradaCadeia || !conjunto) return;
    const src = contexto.createBufferSource();
    src.buffer = conjunto[nome];
    src.connect(entradaCadeia);
    if (fonteAtiva) {
      try {
        fonteAtiva.stop();
      } catch {
        /* já encerrada */
      }
    }
    src.start(0);
    fonteAtiva = src;
    estado.inicios += 1;
    estado.ultimoInicio = performance.now();
    log(`inicio=${nome} estado=${contexto.state} caminho=webaudio`);
  }

  // Respeita o intervalo mínimo; dentro dele guarda só o último pedido.
  function agendar(nome: NomeSom): void {
    const falta = INTERVALO_MIN_MS - (performance.now() - estado.ultimoInicio);
    if (falta <= 0) {
      log(`pedido=${nome} estado=running iniciou=sim`);
      iniciarFonte(nome);
      return;
    }
    log(`pedido=${nome} estado=running iniciou=adiado`);
    estado.pendente = nome;
    if (!estado.timer) {
      estado.timer = setTimeout(() => {
        estado.timer = 0;
        const p = estado.pendente;
        estado.pendente = null;
        if (p) iniciarFonte(p);
      }, falta);
    }
  }

  // Chamado dentro de cada gesto ouvido: cria o contexto se faltar, chama resume() de forma
  // síncrona e confere o estado. A promessa devolve o estado depois da tentativa.
  function gesto(tipo: string): Promise<string> {
    const antes = contexto ? contexto.state : 'nao-criado';
    if (!contexto && !semContexto) {
      try {
        criarContexto();
      } catch (e) {
        semContexto = true;
        estado.erro = e instanceof Error ? e.message : String(e);
        log(`erro=${estado.erro}`);
      }
    }
    let p: Promise<string>;
    const ctx = contexto;
    if (ctx) {
      tocarMudo(ctx);
      p = ctx.resume().then(
        () => ctx.state,
        () => ctx.state
      );
    } else {
      p = Promise.resolve('nao-criado');
    }
    void p.then((depois) => {
      log(`gesto=${tipo} estado_antes=${antes} estado_depois=${depois}`);
      if (depois === 'running' && !estado.desbloqueado) {
        estado.desbloqueado = true;
        if (estado.caminho === 'nenhum') {
          estado.caminho = 'webaudio';
          log('caminho=webaudio');
        }
        if (estado.aguardando && estado.ativo) {
          const n = estado.aguardando;
          estado.aguardando = null;
          iniciarFonte(n);
        }
      }
    });
    return p;
  }

  // Pedido de som vindo da figura (hover, foco, Esc). Nunca sintetiza: só dispara o buffer pronto.
  function tocar(nome: NomeSom): void {
    if (!estado.disponivel || !estado.ativo || !NOMES.includes(nome)) return;
    if (!estado.desbloqueado || !contexto) {
      // Antes do gesto não há como tocar: guarda o último pedido de entrada (saída não espera).
      if (nome !== 'sair') estado.aguardando = nome;
      log(`pedido=${nome} estado=${contexto ? contexto.state : 'nao-criado'} iniciou=nao`);
      return;
    }
    if (contexto.state !== 'running') {
      estado.aguardando = nome;
      void contexto.resume();
      log(`pedido=${nome} estado=${contexto.state} iniciou=nao`);
      return;
    }
    agendar(nome);
  }

  // Botão de três estados. Primeiro clique: liga (e destrava). Depois alterna ligado/desligado.
  function controle(tipo: string): Promise<string> {
    const primeiro = !estado.desbloqueado;
    const p = gesto(tipo);
    estado.ativo = primeiro ? true : !estado.ativo;
    return p;
  }

  // Botão "Testar som": toca a ida no próprio clique, sem esperar o intervalo mínimo.
  function testar(tipo: string): Promise<string> {
    if (!estado.disponivel) return Promise.resolve('indisponivel');
    const p = gesto(tipo);
    void p.then((st) => {
      if (st === 'running') iniciarFonte('entrar');
    });
    return p;
  }

  async function iniciar(): Promise<void> {
    const navegador = navigator as unknown as { getAutoplayPolicy?: (tipo: string) => string };
    estado.politica =
      typeof navegador.getAutoplayPolicy === 'function'
        ? navegador.getAutoplayPolicy('audiocontext')
        : 'indisponivel';
    log(`politica=${estado.politica} protocolo=${location.protocol}`);
    if (estado.politica === 'allowed') {
      try {
        const criado = criarContexto();
        if (criado.state === 'running') estado.desbloqueado = true;
      } catch (e) {
        estado.erro = e instanceof Error ? e.message : String(e);
      }
    }
    try {
      if (typeof OfflineAudioContext === 'undefined') {
        throw new Error('OfflineAudioContext indisponível');
      }
      bufs = await renderizarConjunto(1, PICO_NORMAL_DB);
      bufsReduzidos = await renderizarConjunto(ESCALA_REDUZIDA, PICO_REDUZIDO_DB);
      estado.disponivel = true;
      log('buffers=prontos');
    } catch (e) {
      estado.erro = e instanceof Error ? e.message : String(e);
      log(`erro=${estado.erro}`);
    }
  }

  const pronto = iniciar();
  return {
    estado,
    pronto,
    tocar,
    gesto,
    controle,
    testar,
    definirReduzido(valor: boolean) {
      estado.reduzido = valor;
    }
  };
}
