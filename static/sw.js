importScripts("/assets/history/config.js?v=2025-04-15");
importScripts("/assets/history/worker.js?v=2025-04-15");
importScripts("/assets/mathematics/bundle.js?v=2025-04-15");
importScripts("/assets/mathematics/config.js?v=2025-04-15");
importScripts(__uv$config.sw || "/assets/mathematics/sw.js?v=2025-04-15");

const uv = new UVServiceWorker();
const dynamic = new Dynamic();

const userKey = new URL(location).searchParams.get("userkey");
self.dynamic = dynamic;

self.addEventListener("fetch", event => {
  event.respondWith(
    (async () => {
      if (await dynamic.route(event)) {
        return await dynamic.fetch(event);
      }

      if (event.request.url.startsWith(`${location.origin}/a/`)) {
        return await uv.fetch(event);
      }

        // If the request is for an external URL, proxy it through the UV service worker
        // to avoid the 404 Bare meta error. This mirrors the behavior used for internal
        // routes (the `/a/` prefix) and ensures third‑party sites are fetched correctly.
        const url = new URL(event.request.url);
        if (url.origin !== location.origin) {
          // Use the UV service worker instance to fetch external resources
          return await uv.fetch(event);
        }
        return await fetch(event.request);
    })(),
  );
});
