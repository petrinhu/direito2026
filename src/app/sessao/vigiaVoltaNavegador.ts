import { vigiarVolta, type FonteVolta } from './vigiarVolta';

/** Parte da janela que a volta usa: só os ouvintes de pageshow. */
export interface JanelaVolta {
  addEventListener(
    tipo: 'pageshow',
    ouvinte: (evento: { readonly persisted: boolean }) => void
  ): void;
  removeEventListener(
    tipo: 'pageshow',
    ouvinte: (evento: { readonly persisted: boolean }) => void
  ): void;
}

/** Parte do documento que a volta usa: só a visibilidade da aba. */
export interface DocumentoVolta {
  readonly visibilityState: string;
  addEventListener(tipo: 'visibilitychange', ouvinte: () => void): void;
  removeEventListener(tipo: 'visibilitychange', ouvinte: () => void): void;
}

/**
 * Fonte real dos dois gatilhos de volta (plano 2.2): pageshow (com `persisted`
 * quando a página vem do cache de navegação, o caso do botão Voltar depois de
 * sair) e aba que volta a ficar visível. Recebe a janela e o documento por
 * parâmetro, para o teste ligar ouvintes falsos sem jsdom.
 */
export function criarFonteVoltaNavegador(
  janela: JanelaVolta,
  documento: DocumentoVolta
): FonteVolta {
  return {
    aoMostrarPagina(callback) {
      const ouvinte = (evento: { readonly persisted: boolean }) => callback(evento.persisted);
      janela.addEventListener('pageshow', ouvinte);
      return () => janela.removeEventListener('pageshow', ouvinte);
    },
    aoFicarVisivel(callback) {
      const ouvinte = () => {
        if (documento.visibilityState === 'visible') callback();
      };
      documento.addEventListener('visibilitychange', ouvinte);
      return () => documento.removeEventListener('visibilitychange', ouvinte);
    }
  };
}

export interface DestinosDeVolta {
  readonly navegador: { recarregar(): void };
  readonly sessao: { conferirAoVoltar(): Promise<void> };
}

/**
 * Liga a fonte às duas ações: volta do cache recarrega (cai no portão);
 * aba que volta confere a sessão (sem sessão, recarrega).
 */
export function iniciarVigiaVoltaNavegador(
  fonte: FonteVolta,
  destinos: DestinosDeVolta
): () => void {
  return vigiarVolta(fonte, {
    recarregar: () => destinos.navegador.recarregar(),
    conferir: () => void destinos.sessao.conferirAoVoltar()
  });
}
