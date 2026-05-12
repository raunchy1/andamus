if ('serviceWorker' in navigator) {
  window.addEventListener('load', async function () {
    try {
      // One-time forced cleanup: stale caches from older SW versions
      // were serving broken HTML across deploys. Bump this key when we
      // need to force another full reset for existing clients.
      var RESET_KEY = 'sw-reset-2026-05-12';
      if (!localStorage.getItem(RESET_KEY)) {
        var regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(function (r) { return r.unregister(); }));
        if (window.caches && caches.keys) {
          var keys = await caches.keys();
          await Promise.all(keys.map(function (k) { return caches.delete(k); }));
        }
        localStorage.setItem(RESET_KEY, '1');
        // Reload so the freshly registered SW controls the next nav.
        location.reload();
        return;
      }

      var reg = await navigator.serviceWorker.register('/sw.js');

      // When a new SW takes control, reload once to drop stale page state.
      var refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (refreshing) return;
        refreshing = true;
        location.reload();
      });

      // Force activation of any waiting SW
      if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      reg.addEventListener('updatefound', function () {
        var nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', function () {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            nw.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
    } catch (e) {
      console.warn('[sw-register] failed:', e);
    }
  });
}
