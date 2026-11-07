// Matador do service worker antigo. Fica público neste caminho para sempre:
// um aparelho parado pode voltar a qualquer momento, e se este endereço pedir
// login a atualização falha e o service worker antigo continua servindo.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      for (const nome of await caches.keys()) await caches.delete(nome);
      await self.registration.unregister();
    })()
  );
});
