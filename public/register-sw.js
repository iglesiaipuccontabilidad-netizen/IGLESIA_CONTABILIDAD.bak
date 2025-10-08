if ('serviceWorker' in navigator) {
  window.addEventListener('load', async function() {
    try {
      // Desregistrar cualquier Service Worker existente
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
      }

      // Registrar el nuevo Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      // Forzar la activación inmediata
      if (registration.active) {
        registration.active.postMessage({ type: 'SKIP_WAITING' });
      }

      console.log('Service Worker registrado correctamente:', registration.scope);
    } catch (err) {
      console.error('Error al registrar el Service Worker:', err);
    }
  });

  // Recargar la página cuando el Service Worker tome el control
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}