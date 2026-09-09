/* ============================================================
   MontaÊ - Service worker
   Mantém o app abrindo mesmo sem internet, o que importa muito
   dentro de prédios e garagens onde o sinal cai.

   Estratégia:
     - navegação  -> rede primeiro, cache como reserva
     - /assets/*  -> cache primeiro (arquivos têm hash no nome)
     - resto      -> rede, guardando uma cópia
   ============================================================ */

const VERSION = 'montae-v2';
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;

const SHELL_FILES = ['/', '/index.html', '/manifest.webmanifest', '/logo.jpeg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Nunca interceptar o Firebase: ele tem a própria camada offline
  // e cachear essas respostas quebraria a sincronização.
  if (
    url.origin !== self.location.origin ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('gstatic')
  ) {
    return;
  }

  // Navegação: tenta a rede, cai para o index em caso de falha.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html').then((cached) => cached || Response.error()))
    );
    return;
  }

  // Arquivos com hash: servem do cache imediatamente.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
