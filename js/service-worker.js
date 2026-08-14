// ============================================
// SERVICE-WORKER.JS - Full Offline Support v3
// ============================================

const CACHE_VERSION = 'v3';
const CACHE_NAME = `quick-dukan-${CACHE_VERSION}`;
const DATA_CACHE = `quick-dukan-data-${CACHE_VERSION}`;

// Static files - MUST be cached for offline
const STATIC_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',

    // CSS
    '/css/theme.css',
    '/css/animations.css',
    '/css/layout.css',
    '/css/header.css',
    '/css/search.css',
    '/css/categories.css',
    '/css/product-card.css',
    '/css/category-products.css',
    '/css/recently-viewed.css',
    '/css/most-orders.css',
    '/css/bottom-nav.css',
    '/css/cart.css',
    '/css/checkout.css',
    '/css/orders.css',
    '/css/dark-mode.css',
    '/css/pwa-install.css',
    '/css/floating-cart-bubble.css',
    '/css/order-popup.css',
    '/css/floating-map.css',
    '/css/pull-to-refresh.css',
    '/css/splash-screen.css',
    '/css/payment-popup.css',
    '/css/location-popup.css',

    // JS - Core
    '/js/security.js',
    '/js/config.js',
    '/js/whatsapp.js',
    '/js/theme.js',
    '/js/language.js',
    '/js/data-loader.js',
    '/js/search.js',
    '/js/categories.js',
    '/js/products.js',
    '/js/category-products.js',
    '/js/recently-viewed.js',
    '/js/most-orders.js',
    '/js/cart.js',
    '/js/bottom-nav.js',
    '/js/back-to-top.js',
    '/js/animations.js',
    '/js/app.js',
    '/js/auto-refresh.js',
    '/js/pwa-install.js',
    '/js/orders.js',
    '/js/location.js',
    '/js/pull-to-refresh.js',
    '/js/checkout.js',
    '/js/floating-cart-bubble.js',
    '/js/order-popup.js',
    '/js/floating-map.js',
    '/js/payment-popup.js',

    // Icons
    '/icons/icon-72.png',
    '/icons/icon-96.png',
    '/icons/icon-128.png',
    '/icons/icon-144.png',
    '/icons/icon-152.png',
    '/icons/icon-192.png',
    '/icons/icon-384.png',
    '/icons/icon-512.png',
];

// ============================================
// INSTALL - Cache all static files
// ============================================
self.addEventListener('install', (event) => {
    console.log(`🔧 SW ${CACHE_VERSION} Installing...`);

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Caching all files for offline...');
                return Promise.allSettled(
                    STATIC_CACHE.map(url =>
                        cache.add(url).catch(err => {
                            console.warn('❌ Failed to cache:', url, err);
                        })
                    )
                );
            })
            .then(() => {
                console.log('✅ All files cached! Offline ready!');
                return self.skipWaiting();
            })
    );
});

// ============================================
// ACTIVATE - Clean old caches
// ============================================
self.addEventListener('activate', (event) => {
    console.log(`✅ SW ${CACHE_VERSION} Activated`);

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(cache => cache !== CACHE_NAME && cache !== DATA_CACHE)
                    .map(cache => {
                        console.log('🗑️ Deleting old:', cache);
                        return caches.delete(cache);
                    })
            );
        }).then(() => {
            console.log('👑 Taking control of all pages...');
            return self.clients.claim();
        })
    );
});

// ============================================
// FETCH - Offline First Strategy
// ============================================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip chrome extensions
    if (url.protocol === 'chrome-extension:') return;

    // Skip Google Analytics etc.
    if (url.hostname.includes('google-analytics')) return;
    if (url.hostname.includes('googletagmanager')) return;

    // 🔥 HTML PAGES - Network First, Cache Fallback
    if (request.destination === 'document' || url.pathname === '/' || url.pathname === '/index.html') {
        event.respondWith(networkFirstHTML(request));
        return;
    }

    // 🔥 DATA FILES - Network First, Cache Fallback
    if (url.pathname.includes('/data/') || url.pathname.includes('.json')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // 🔥 STATIC FILES - Cache First, Network Fallback
    if (url.pathname.match(/\.(css|js|png|jpg|jpeg|svg|ico|woff|woff2|ttf)$/) ||
        url.pathname.includes('/css/') ||
        url.pathname.includes('/js/') ||
        url.pathname.includes('/icons/')) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // 🔥 EXTERNAL RESOURCES - Network Only (maps, cdn etc.)
    if (url.hostname.includes('openstreetmap') || 
        url.hostname.includes('unpkg.com') ||
        url.hostname.includes('leafletjs') ||
        url.hostname.includes('cdnjs.cloudflare.com') ||
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com')) {
        event.respondWith(networkOnly(request));
        return;
    }

    // Default: Cache First
    event.respondWith(cacheFirst(request));
});

// ============================================
// CACHE FIRST STRATEGY
// ============================================
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
        // Return cached, update in background
        updateCache(request, cache);
        return cached;
    }

    try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response && response.ok) {
            cache.put(request, response.clone());
        }
        return response || new Response('Not Found', { status: 404 });
    } catch (err) {
        // 🔥 OFFLINE FALLBACK
        if (request.destination === 'document') {
            const offlinePage = await cache.match('/index.html');
            if (offlinePage) return offlinePage;
        }
        return new Response('Offline - Please connect to internet', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// ============================================
// NETWORK FIRST (for HTML Pages)
// ============================================
async function networkFirstHTML(request) {
    const cache = await caches.open(CACHE_NAME);

    try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response && response.ok) {
            cache.put(request, response.clone());
            return response;
        }
        throw new Error('Network failed');
    } catch (err) {
        console.log('🌐 Offline - Serving cached HTML');
        const cached = await cache.match(request);
        if (cached) {
            return cached;
        }
        // Fallback to index.html
        const fallback = await cache.match('/index.html');
        if (fallback) return fallback;
        
        return new Response('Offline - Please connect to internet', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// ============================================
// NETWORK FIRST STRATEGY (for Data)
// ============================================
async function networkFirst(request) {
    const cache = await caches.open(DATA_CACHE);

    try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response && response.ok) {
            cache.put(request, response.clone());
        }
        return response || new Response('Data not available', { status: 404 });
    } catch (err) {
        console.log('🌐 Offline - Using cached data');
        const cached = await cache.match(request);
        if (cached) return cached;

        return new Response('Offline - Data not available', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// ============================================
// NETWORK ONLY
// ============================================
async function networkOnly(request) {
    try {
        const response = await fetch(request);
        return response || new Response('Not Found', { status: 404 });
    } catch (err) {
        return new Response('Offline - External resource unavailable', { 
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// ============================================
// BACKGROUND CACHE UPDATE
// ============================================
async function updateCache(request, cache) {
    try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response && response.ok) {
            cache.put(request, response.clone());
        }
    } catch (err) {
        // Silent fail - offline mein update nahi ho sakta
    }
}

// ============================================
// MESSAGE LISTENER
// ============================================
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data === 'CHECK_OFFLINE') {
        caches.keys().then(names => {
            console.log('📦 Cached:', names);
        });
    }

    if (event.data === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME).then(() => {
            console.log('🗑️ Cache cleared');
        });
        caches.delete(DATA_CACHE).then(() => {
            console.log('🗑️ Data cache cleared');
        });
    }
});

// ============================================
// ENGAGEMENT NOTIFICATION CLICK HANDLER
// ============================================
self.addEventListener('notificationclick', (event) => {
    console.log('👆 Notification clicked:', event.action);

    event.notification.close();

    if (event.action === 'dismiss' || event.action === 'dismiss-engagement') {
        // User dismissed, do nothing
        return;
    }

    // Open app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                for (const client of clientList) {
                    if (client.url.includes('/') && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
    );
});

// ============================================
// PERIODIC BACKGROUND SYNC (Optional)
// ============================================
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-cache') {
        event.waitUntil(updateAllCaches());
    }
});

async function updateAllCaches() {
    const cache = await caches.open(CACHE_NAME);
    for (const url of STATIC_CACHE) {
        try {
            const response = await fetch(url, { cache: 'no-store' });
            if (response && response.ok) {
                cache.put(url, response.clone());
            }
        } catch (err) {
            // Silent fail
        }
    }
    console.log('🔄 Periodic cache update completed');
}

console.log(`🔄 Service Worker ${CACHE_VERSION} Ready - Full Offline Support ✅`);