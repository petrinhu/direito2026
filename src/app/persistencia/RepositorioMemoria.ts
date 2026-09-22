import type {
  ChaveUnidade,
  RegistroProgressoUnidade,
  RepositorioProgresso,
  TemaEscolhido
} from '@/core/progresso/tipos';

/**
 * Implementação em memória de RepositorioProgresso. Usada durante toda a
 * sessão quando o localStorage não está disponível (modo privado do
 * Safari, dados de site bloqueados, cota estourada), e é sempre a
 * implementação usada em teste de core que não deve tocar no navegador.
 */
export class RepositorioMemoria implements RepositorioProgresso {
  private readonly registros = new Map<ChaveUnidade, RegistroProgressoUnidade>();
  private tema: TemaEscolhido | undefined;

  ler(chave: ChaveUnidade): RegistroProgressoUnidade | undefined {
    return this.registros.get(chave);
  }

  salvar(chave: ChaveUnidade, registro: RegistroProgressoUnidade): boolean {
    this.registros.set(chave, registro);
    return true;
  }

  lerTema(): TemaEscolhido | undefined {
    return this.tema;
  }

  salvarTema(tema: TemaEscolhido): boolean {
    this.tema = tema;
    return true;
  }
}
