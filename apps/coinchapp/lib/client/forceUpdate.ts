/** Drops the service-worker cache/registration and reloads from the network
 *  so testers (especially on a mobile PWA) pick up the latest deploy. Keeps
 *  localStorage / IndexedDB (local game saves) intact. */
export async function forceUpdate(): Promise<void> {
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }

  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  const url = new URL(window.location.href);
  url.searchParams.set("_refresh", String(Date.now()));
  window.location.replace(url.toString());
}
