/** Servidor falso: fila de respostas, registro das chamadas. Nada de rede. */
export interface ChamadaRegistrada {
  readonly url: string;
  readonly metodo: string;
  readonly cabecalhos: Record<string, string>;
  readonly corpo: unknown;
  readonly credentials: RequestCredentials | undefined;
}

export interface RespostaFalsa {
  readonly status?: number;
  readonly json?: unknown;
  readonly textoCru?: string;
  readonly falhaDeRede?: boolean;
}

export function criarFetchFalso(respostas: RespostaFalsa[]) {
  const chamadas: ChamadaRegistrada[] = [];
  const buscar = async (url: string, init: RequestInit = {}): Promise<Response> => {
    chamadas.push({
      url,
      metodo: init.method ?? 'GET',
      cabecalhos: { ...(init.headers as Record<string, string>) },
      corpo: typeof init.body === 'string' ? JSON.parse(init.body) : undefined,
      credentials: init.credentials
    });
    const proxima = respostas.shift();
    if (!proxima) throw new Error('sem resposta falsa na fila');
    if (proxima.falhaDeRede) throw new TypeError('Failed to fetch');
    const corpo = proxima.textoCru ?? JSON.stringify(proxima.json ?? {});
    return new Response(corpo, {
      status: proxima.status ?? 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };
  return { buscar, chamadas };
}
