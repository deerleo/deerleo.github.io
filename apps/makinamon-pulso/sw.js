// Service worker mínimo: hace el juego instalable como app. Siempre va a la red (el juego carga sus scripts con marca de versión).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => { });
