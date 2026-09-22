import type {
  ChaveUnidade,
  RegistroProgressoUnidade,
  RepositorioProgresso,
  TemaEscolhido
} from '@/core/progresso/tipos';

const PREFIXO = 'caderno-direito:v1';

function chaveProgresso(chave: ChaveUnidade): string {
  return `${PREFIXO}:progresso:${chave}`;
}

const CHAVE_TEMA = `${PREFIXO}:tema`;
const CHAVE_AVISO_ARMAZENAMENTO = `${PREFIXO}:aviso-armazenamento-visto`;
const CHAVE_MODO_ADAPTADO = `${PREFIXO}:modo-adaptado`;

/**
 * Implementação sobre localStorage. Toda operação fica em try/catch: a cota
 * pode estourar no meio da sessão mesmo depois de a sonda inicial ter
 * passado (seção 8 da arquitetura), e o Safari expira o storage inteiro
 * depois de 7 dias sem interação — isso não é erro do site, é comportamento
 * esperado do motor, e por isso nunca lança para quem chama.
 */
export class RepositorioLocalStorage implements RepositorioProgresso {
  ler(chave: ChaveUnidade): RegistroProgressoUnidade | undefined {
    try {
      const bruto = localStorage.getItem(chaveProgresso(chave));
      if (!bruto) return undefined;
      const registro = JSON.parse(bruto) as RegistroProgressoUnidade;
      if (registro.versao !== 1) return undefined; // versão desconhecida: descarta, não adivinha
      return registro;
    } catch {
      return undefined; // JSON corrompido ou leitura bloqueada: descarta, não lança
    }
  }

  salvar(chave: ChaveUnidade, registro: RegistroProgressoUnidade): boolean {
    try {
      localStorage.setItem(chaveProgresso(chave), JSON.stringify(registro));
      return true;
    } catch {
      // Cota estourada (seção 8): descarta o registro de unidade mais
      // antigo salvo por este site e tenta de novo, uma única vez.
      try {
        this.descartarMaisAntigo(chave);
        localStorage.setItem(chaveProgresso(chave), JSON.stringify(registro));
        return true;
      } catch {
        return false;
      }
    }
  }

  lerTema(): TemaEscolhido | undefined {
    try {
      const valor = localStorage.getItem(CHAVE_TEMA);
      if (valor === 'sistema' || valor === 'claro' || valor === 'escuro') return valor;
      return undefined;
    } catch {
      return undefined;
    }
  }

  salvarTema(tema: TemaEscolhido): boolean {
    try {
      localStorage.setItem(CHAVE_TEMA, tema);
      return true;
    } catch {
      return false;
    }
  }

  lerAvisoArmazenamentoVisto(): boolean {
    try {
      return localStorage.getItem(CHAVE_AVISO_ARMAZENAMENTO) === '1';
    } catch {
      return false;
    }
  }

  marcarAvisoArmazenamentoVisto(): boolean {
    try {
      localStorage.setItem(CHAVE_AVISO_ARMAZENAMENTO, '1');
      return true;
    } catch {
      return false;
    }
  }

  lerModoAdaptado(): boolean {
    try {
      return localStorage.getItem(CHAVE_MODO_ADAPTADO) === 'true';
    } catch {
      return false;
    }
  }

  salvarModoAdaptado(ativo: boolean): boolean {
    try {
      localStorage.setItem(CHAVE_MODO_ADAPTADO, ativo ? 'true' : 'false');
      return true;
    } catch {
      return false;
    }
  }

  limparTudo(): void {
    try {
      const chaves: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const chaveArmazenamento = localStorage.key(i);
        if (chaveArmazenamento?.startsWith(PREFIXO)) chaves.push(chaveArmazenamento);
      }
      for (const chaveArmazenamento of chaves) localStorage.removeItem(chaveArmazenamento);
    } catch {
      // Não há o que fazer: se não dá para ler/remover, não há o que limpar.
    }
  }

  private descartarMaisAntigo(chaveQueEntrando: ChaveUnidade): void {
    let chaveMaisAntiga: string | undefined;
    let dataMaisAntiga: string | undefined;
    for (let i = 0; i < localStorage.length; i++) {
      const chaveArmazenamento = localStorage.key(i);
      if (!chaveArmazenamento?.startsWith(`${PREFIXO}:progresso:`)) continue;
      if (chaveArmazenamento === chaveProgresso(chaveQueEntrando)) continue;
      try {
        const registro = JSON.parse(
          localStorage.getItem(chaveArmazenamento) ?? '{}'
        ) as RegistroProgressoUnidade;
        if (!dataMaisAntiga || registro.atualizadoEm < dataMaisAntiga) {
          dataMaisAntiga = registro.atualizadoEm;
          chaveMaisAntiga = chaveArmazenamento;
        }
      } catch {
        // registro ilegível: candidato natural a descarte
        chaveMaisAntiga = chaveArmazenamento;
        break;
      }
    }
    if (chaveMaisAntiga) localStorage.removeItem(chaveMaisAntiga);
  }
}
