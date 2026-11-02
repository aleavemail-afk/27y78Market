/* Mercado 27 y 78: guarda la página y las imágenes en el móvil para que carguen más rápido.
   Si cambias este archivo, sube el número de versión para limpiar lo guardado. */
const CACHE = "mercado-27-78-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;

  /* Página: primero la red; si no hay señal, la última versión guardada */
  if (r.mode === "navigate") {
    e.respondWith(
      fetch(r)
        .then(res => {
          const copia = res.clone();
          caches.open(CACHE).then(k => k.put("./", copia));
          return res;
        })
        .catch(() => caches.match("./").then(x => x || Response.error()))
    );
    return;
  }

  /* Imágenes: salen de lo guardado al instante y se actualizan en segundo plano */
  if (/\.(webp|jpe?g|png|gif|svg)$/i.test(u.pathname)) {
    e.respondWith(
      caches.open(CACHE).then(async k => {
        const guardada = await k.match(r);
        const red = fetch(r)
          .then(res => { if (res.ok) k.put(r, res.clone()); return res; })
          .catch(() => null);
        if (guardada) { e.waitUntil(red); return guardada; }
        return (await red) || Response.error();
      })
    );
  }
});
