const APP_CACHE = 'cc-v10';

// Cached files
const urlsToCache = [
  '/',
  '/manifest.json',
  '/styles/styles.min.css',

  '/images/ic_more_vert.svg',
  '/images/Logo_144.png',
  '/images/Logo_192.png',
  '/images/Logo_256.png',
  '/images/Logo_512.png',

];

// Install essential URLs.
self.addEventListener('install', (event) => {
  event.waitUntil(
      caches.open(APP_CACHE).then((cache) => cache.addAll(urlsToCache)));
});

// Delete old caches.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== APP_CACHE)
            .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});

// Fetch data from cache.
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  if (requestUrl.href.includes('api') || 
      requestUrl.href.includes('coinmarketcap') || 
      requestUrl.href.includes('google-analytics') || 
      requestUrl.href.includes('googletagmanager') ||
      requestUrl.href.includes('yandex')) {
    // API. Don't cache.
    fetch(event.request);
  } else if (requestUrl.pathname === '/') {
    // Serve from cache, update in background.
    cacheThenUpdateWithCacheBust(event);
  } else {
    // Try cache first. If that fails, go to network and update cache.
    cacheWithNetworkFallbackAndStore(event);
  }
});

/**
 * Attempts to retrieve from cache first. If that fails, goes to network and
 * stores it in the cache for later.
 * @param {FetchEvent} event The event to handle.
 */
function cacheWithNetworkFallbackAndStore(event) {
  let response = null;
  event.respondWith(fromCache(event.request)
      .catch(() => fetch(event.request.clone())
          .then((resp) => {
              response = resp;
              return update(event.request, resp.clone());
          })
          .then(() => response)));
}

/**
 * Immediately responds from cache, but updates from network in the background.
 * Performs a cache bust when updating.
 * @param {FetchEvent} event The event to handle.
 */
function cacheThenUpdateWithCacheBust(event) {
  const networkRequest =
      new Request(`${event.request.url}?${Date.now().toString()}`);

  const network = fetch(networkRequest);
  const networkClone = network.then((response) => response.clone());

  event.respondWith(fromCache(event.request).catch(() => networkClone));
  event.waitUntil(network.then((resp) => update(event.request, resp)));
}

/**
 * Retrieve response from cache.
 * @param {Request} request The fetch request to handle.
 * @return {Promise} The response promise.
 */
function fromCache(request) {
  return caches.open(APP_CACHE).then((cache) => {
    return cache.match(request).then((matching) => {
      return matching || Promise.reject('no-match');
    });
  });
}

/**
 * Store response in the cache.
 * @param {Request} request The fetch request to handle.
 * @param {Response} response The fetch response to handle.
 * @return {Promise} The storage promise.
 */
function update(request, response) {
  if(request.method == "POST") Promise.resolve(response); 
  return caches.open(APP_CACHE).then((cache) => cache.put(request, response)).catch( _ => Promise.resolve(response)) ;
}
