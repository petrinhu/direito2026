/**
 * Apaga o que o navegador guardou do site: caches nomeados e registros de
 * service worker. Sai ao sair do site, porque o Safari anterior à versão 17
 * não entende Clear-Site-Data (o servidor manda "cache" no sair.php, mas
 * isso não basta lá). Recebe o ambiente por parâmetro: sem janela real no teste.
 */
export interface RegistroServiceWorker {
  unregister(): Promise<boolean>;
}

export interface AmbienteLimpeza {
  readonly caches?: {
    keys(): Promise<readonly string[]>;
    delete(nome: string): Promise<boolean>;
  };
  readonly serviceWorker?: {
    getRegistrations(): Promise<readonly RegistroServiceWorker[]>;
  };
}

export async function limparCachesESW(ambiente: AmbienteLimpeza): Promise<void> {
  if (ambiente.caches) {
    for (const nome of await ambiente.caches.keys()) await ambiente.caches.delete(nome);
  }
  if (ambiente.serviceWorker) {
    for (const registro of await ambiente.serviceWorker.getRegistrations()) {
      await registro.unregister();
    }
  }
}
