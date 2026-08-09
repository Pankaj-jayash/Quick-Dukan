// ============================================
// SERVICE-WORKER.JS - PWA Cache & Offline (v3)
// ============================================

const CACHE_VERSION = 'v3'; // ⬅️ Version update karte raho
const CACHE_NAME = `quick-dukan-${CACHE_VERSION}`;
const DATA_CACHE = `quick-dukan-data-${CACHE_VERSION}`;

// Static files to cache (GitHub Pages paths)
const STATIC_CACHE = [
    '/Quick-Dukan/',
    '/Quick-Dukan/index.html',
    '/Quick-Dukan/manifest.json',
    
    // CSS Files
    '/Quick-Dukan/css/theme.css',
    '/Quick-Dukan/css/animations.css',
    '/Quick-Dukan/css/layout.css',
    '/Quick-Dukan/css/header.css',
    '/Quick-Dukan/css/search.css',
    '/Quick-Dukan/css/categories.css',
    '/Quick-Dukan/css/product-card.css',
    '/Quick-Dukan/css/category-products.css',
    '/Quick-Dukan/css/recently-viewed.css',
    '/Quick-Dukan/css/most-orders.css',
    '/Quick-Dukan/css/bottom-nav.css',
    '/Quick-Dukan/css/cart.css',
    '/Quick-Dukan/css/checkout.css',
    '/Quick-Dukan/css/orders.css',
    '/Quick-Dukan/css/dark-mode.css',
    '/Quick-Dukan/css/pwa-install.css',
    '/Quick-Dukan/css/floating-cart-bubble.css',
    '/Quick-Dukan/css/order-popup.css',
    '/Quick-Dukan/css/floating-map.css',
    '/Quick-Dukan/css/pull-to-refresh.css',
    '/Quick-Dukan/css/splash-screen.css',
    
    // JS Files
    '/Quick-Dukan/js/config.js',
    '/Quick-Dukan/js/whatsapp.js',
    '/Quick-Dukan/js/theme.js',
    '/Quick-Dukan/js/language.js',
    '/Quick-Dukan/js/data-loader.js',
    '/Quick-Dukan/js/search.js',
    '/Quick-Dukan/js/categories.js',
    '/Quick-Dukan/js/products.js',
    '/Quick-Dukan/js/category-products.js',
    '/Quick-Dukan/js/recently-viewed.js',
    '/Quick-Dukan/js/most-orders.js',
    '/Quick-Dukan/js/cart.js',
    '/Quick-Dukan/js/orders.js',
    '/Quick-Dukan/js/checkout.js',
    '/Quick-Dukan/js/location.js',
    '/Quick-Dukan/js/bottom-nav.js',
    '/Quick-Dukan/js/back-to-top.js',
    '/Quick-Dukan/js/animations.js',
    '/Quick-Dukan/js/app.js',
    '/Quick-Dukan/js/auto-refresh.js',
    '/Quick-Dukan/js/pwa-install.js',
    '/Quick-Dukan/js/floating-cart-bubble.js',
    '/Quick-Dukan/js/order-popup.js',
    '/Quick-Dukan/js/floating-map.js',
    '/Quick-Dukan/js/pull-to-refresh.js',
    
    // Icons
    '/Quick-Dukan/icons/icon-72.png',
    '/Quick-Dukan/icons/icon-96.png',
    '/Quick-Dukan/icons/icon-128.png',
    '/Quick-Dukan/icons/icon-144.png',
    '/Quick-Dukan/icons/icon-152.png',
    '/Quick-Dukan/icons/icon-192.png',
    '/Quick-Dukan/icons/icon-384.png',
    '/Quick-Dukan/icons/icon-512.png',
];

// Install
self.addEventListener('install', (event) => {
    console.log(`🔧 Service Worker ${CACHE_VERSION} Installing...`);
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log('📦 Caching', STATIC_CACHE.length, 'files...');
            return Promise.allSettled(
                STATIC_CACHE.map(url =>
                    cache.add(url).catch(err => {
                        console.warn('❌ Failed:', url);
                    })
                )
            );
        })
        .then(() => {
            console.log('✅ Install complete, activating...');
            return self.skipWaiting();
        })
    );
});

// Activate - Clean old caches
self.addEventListener('activate', (event) => {
    console.log(`✅ Service Worker ${CACHE_VERSION} Activated`);
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                .filter(cache => cache !== CACHE_NAME && cache !== DATA_CACHE)
                .map(cache => {
                    console.log('🗑️ Deleting:', cache);
                    return caches.delete(cache);
                })
            );
        }).then(() => {
            console.log('👑 Claiming clients...');
            return self.clients.claim();
        })
    );
});

// Fetch Strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    if (request.method !== 'GET') return;
    if (url.protocol === 'chrome-extension:') return;
    
    // 📊 Data JSON files - Network First (with timeout fallback)
    if (url.pathname.includes('/data/')) {
        event.respondWith(networkFirstWithTimeout(request, 3000));
        return;
    }
    
    // 🎨 Static Assets - Cache First (Stale While Revalidate)
    if (url.pathname.match(/\.(css|js|png|jpg|svg|ico|woff2)$/) ||
        url.pathname === '/Quick-Dukan/' ||
        url.pathname.endsWith('index.html') ||
        url.pathname.endsWith('manifest.json')) {
        event.respondWith(staleWhileRevalidate(request));
        return;
    }
});

// Network First with Timeout
async function networkFirstWithTimeout(request, timeoutMs) {
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), timeoutMs)
    );
    
    try {
        const response = await Promise.race([fetch(request), timeoutPromise]);
        const cache = await caches.open(DATA_CACHE);
        cache.put(request, response.clone());
        return response;
    } catch (err) {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw err;
    }
}

// Stale While Revalidate (instant cache + background update)
async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    const fetchPromise = fetch(request)
        .then(response => {
            if (response && response.status === 200) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(err => console.warn('Update failed:', request.url, err));
    
    return cached || fetchPromise;
}

// Skip waiting message
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data === 'CHECK_UPDATE') {
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({ type: 'UPDATE_CHECK', version: CACHE_VERSION });
            });
        });
    }
});

console.log(`🔄 Service Worker ${CACHE_VERSION} Ready`);