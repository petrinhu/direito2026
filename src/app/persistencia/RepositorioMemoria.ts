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
  private avisoArmazenamentoVisto = false;
  private modoAdaptado = false;

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

  lerAvisoArmazenamentoVisto(): boolean {
    return this.avisoArmazenamentoVisto;
  }

  marcarAvisoArmazenamentoVisto(): boolean {
    // Nunca toca localStorage (é por isso que esta classe existe): a marca
    // dura só esta instância, ou seja, só a sessão atual. Sem laço porque
    // dentro da mesma sessão a leitura seguinte já vem true; volta a false
    // numa sessão nova porque nunca foi gravada de verdade.
    this.avisoArmazenamentoVisto = true;
    return true;
  }

  lerModoAdaptado(): boolean {
    return this.modoAdaptado;
  }

  salvarModoAdaptado(ativo: boolean): boolean {
    this.modoAdaptado = ativo;
    return true;
  }

  limparTudo(): void {
    this.registros.clear();
    this.tema = undefined;
    this.avisoArmazenamentoVisto = false;
    this.modoAdaptado = false;
  }
}
