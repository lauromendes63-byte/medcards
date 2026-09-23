// Service Worker do MedCards PWA
// Versão com auto-limpeza de cache e Network-First absoluto para garantir atualizações imediatas
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames.map((name) => caches.delete(name)));
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Não intercepta requisições de assets dinâmicos para não servir código antigo em cache
self.addEventListener('fetch', (event) => {
  // Pass-through direto para a rede / Vite dev server
  return;
});
