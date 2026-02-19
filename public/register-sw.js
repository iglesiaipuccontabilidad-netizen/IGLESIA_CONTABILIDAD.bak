// UNREGISTER all Service Workers and clear caches
// The SW was causing issues by caching HTML/RSC responses and breaking navigation
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async function() {
    try {
      // Unregister ALL Service Workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
        console.log('Service Worker desregistrado:', registration.scope);
      }

      // Clear ALL caches to remove stale content
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log('Cache eliminado:', cacheName);
      }

      if (registrations.length > 0 || cacheNames.length > 0) {
        console.log('Service Workers y caches limpiados correctamente');
      }
    } catch (err) {
      console.error('Error al limpiar Service Workers:', err);
    }
  });
}