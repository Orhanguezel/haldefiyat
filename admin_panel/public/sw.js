/*
 * Cleanup service worker for development/runtime cache mismatch issues.
 * If an old SW is still registered, this worker unregisters itself and
 * clears all Cache Storage entries to avoid stale _next chunks.
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        // Clear all caches
        if ('caches' in self) {
          try {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          } catch (err) {
            console.error('[SW] Cache cleanup error:', err);
          }
        }
      } catch (err) {
        console.error('[SW] Error in cleanup:', err);
      }

      try {
        await self.registration.unregister();
      } catch (err) {
        console.error('[SW] Unregister error:', err);
      }

      try {
        if ('clients' in self) {
          const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
          for (const client of clients) {
            client.postMessage({ type: 'SW_CLEANED' });
          }
        }
      } catch (err) {
        console.error('[SW] Client messaging error:', err);
      }
    })(),
  );
});

self.addEventListener('fetch', () => {
  // Intentionally empty.
});
